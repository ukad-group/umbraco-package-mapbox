import { css, customElement, html, nothing, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbChangeEvent } from "@umbraco-cms/backoffice/event";
import type {
  UmbPropertyEditorConfigCollection,
  UmbPropertyEditorUiElement,
} from "@umbraco-cms/backoffice/property-editor";
import type * as MapboxGl from "mapbox-gl";
import { getBoolean, numberFieldValue, parseNumberField } from "../shared/config.js";
import { getMapboxAccessToken } from "../shared/mapbox-settings.js";
import { loadMapbox, mapboxStyles, type Mapbox } from "../shared/load-mapbox.js";
import { pickImageUrl } from "../shared/pick-image.js";
import { numberFieldStyles } from "../shared/styles.js";
import { parseValue, type LatitudeLongitude, type RasterLayerMapValue } from "../shared/types.js";

type Point = number[];

interface Dots {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

const DEFAULT_VALUE = {
  boundingBox: {
    southWestCorner: { latitude: -54.970495269313204, longitude: -1.6278648376464846 },
    northEastCorner: { latitude: -54.97911600936982, longitude: -1.609625816345215 },
  },
  zoom: 9,
  opacity: 100,
} as RasterLayerMapValue;

const emptyDots = (): Dots => ({ topLeft: [], topRight: [], bottomRight: [], bottomLeft: [] });

/**
 * Port of the Umbraco 13 "Ukad.UmbracoPackageMapbox.RasterLayerMap.Controller".
 * The value is only changed in response to the editor's own actions, so opening and saving
 * a document leaves the stored value untouched.
 */
@customElement("ukad-mapbox-raster-layer-map")
export class UkadMapboxRasterLayerMapElement extends UmbLitElement implements UmbPropertyEditorUiElement {
  @property({ attribute: false })
  value?: RasterLayerMapValue | string;

  @property({ attribute: false })
  set config(config: UmbPropertyEditorConfigCollection | undefined) {
    // Defaults are the C# defaults Umbraco 13 used for missing settings.
    this._showSetLayerByCoordinates = getBoolean(config, "showSetLayerByCoordinates", false);
    this._showZoom = getBoolean(config, "showZoom", false);
    this._allowClear = getBoolean(config, "allowClear", true);
    this.#scrollWheelZoom = getBoolean(config, "scrollWheelZoom", true);
    this.#roundZoomToNatural = getBoolean(config, "roundZoomToNatural", true);
    this.#showOpacityEnabled = getBoolean(config, "showOpacity", true);
  }

  @state() private _showSetLayerByCoordinates = false;
  @state() private _showZoom = false;
  @state() private _allowClear = true;
  @state() private _showOpacity = false;
  @state() private _loading = true;
  @state() private _error = "";
  @state() private _image = "";
  @state() private _inputZoom?: number;
  @state() private _inputOpacity = 100;
  @state() private _points: Record<keyof Dots, LatitudeLongitude | null> = {
    topLeft: null,
    topRight: null,
    bottomRight: null,
    bottomLeft: null,
  };

  @query("#map") private _mapContainer!: HTMLDivElement;

  #scrollWheelZoom = true;
  #roundZoomToNatural = true;
  #showOpacityEnabled = true;
  #accessToken?: string;
  #typedZoom = "";
  #mapbox?: Mapbox;
  #map?: MapboxGl.Map;
  #mapLoaded = false;
  #startZoom: number | null = null;
  #userZooming = false;
  #resizeObserver = new ResizeObserver(() => this.#map?.resize());

  // Image placement, in the same shape the Umbraco 13 editor stored it.
  #dots: Dots = emptyDots();
  #rotationDot?: Point;
  #halfDiagonal?: number;
  #centerCoordsPx?: Point;
  #normalizedVectors?: Point[];
  #normalizedRotationDotVector?: Point;

  override async firstUpdated() {
    try {
      const [accessToken, mapbox] = await Promise.all([getMapboxAccessToken(this), loadMapbox()]);
      if (accessToken === "") {
        this._error = "No Mapbox access token set, Maps Editor cannot load.";
        return;
      }

      this.#mapbox = mapbox;
      this.#accessToken = accessToken;
      this._loading = false;
      await this.updateComplete;
      this.#initMapboxMap(accessToken);
    } catch (error) {
      this._error = (error as Error).message;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    // The element can be moved (detached and attached again); rebuild the map disconnectedCallback removed.
    if (this.#accessToken && !this.#map) {
      this.updateComplete.then(() => this.#initMapboxMap(this.#accessToken!));
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver.disconnect();
    this.#map?.remove();
    this.#map = undefined;
  }

  #initMapboxMap(accessToken: string) {
    const mapbox = this.#mapbox!;
    const initValue = parseValue<RasterLayerMapValue>(this.value) || DEFAULT_VALUE;

    this.#mapLoaded = false;
    this.#handlersRegistered.clear();
    this.#dots = emptyDots();
    this._image = "";
    this._showOpacity = false;

    // Values saved before image opacity existed have no opacity and are fully opaque.
    const opacity = typeof initValue.opacity === "number" ? initValue.opacity : 100;
    this._inputOpacity = this.#showOpacityEnabled ? opacity : 100;
    this.#rotationDot = initValue.rotationDot;
    this.#halfDiagonal = initValue.halfDiagonal;
    this.#centerCoordsPx = initValue.centerCoordsPx;
    this.#normalizedVectors = initValue.normalizedVectors;
    this.#normalizedRotationDotVector = initValue.normalizedRotationDotVector;

    this.#initImageWithPoints(initValue);

    const isBoundingBoxExists =
      initValue?.boundingBox?.southWestCorner?.longitude &&
      initValue?.boundingBox?.southWestCorner?.latitude &&
      initValue?.boundingBox?.northEastCorner?.longitude &&
      initValue?.boundingBox?.northEastCorner?.latitude;

    const isPlacedImageExists = this._image && this.#hasDots();

    const map = new mapbox.Map({
      accessToken,
      container: this._mapContainer,
      animate: false,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: initValue.zoom,
      projection: "equirectangular",
    } as unknown as MapboxGl.MapboxOptions);
    this.#map = map;

    const initBox = isBoundingBoxExists ? this.#getBoundingBox(initValue) : this.#getBoundingBox(DEFAULT_VALUE);
    map.jumpTo({ center: initBox.getCenter() });
    map.fitBounds(initBox, { center: initBox.getCenter() } as MapboxGl.FitBoundsOptions);

    map.addControl(new mapbox.NavigationControl());
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    if (!this.#scrollWheelZoom) {
      map.scrollZoom.disable();
    }

    if (this._showZoom) {
      this._inputZoom = initValue.zoom;
    }

    map.on("load", () => {
      this.#mapLoaded = true;
      const canvas = map.getCanvasContainer();
      let mouseDownCoords: Point | undefined;

      map.on("mousedown", (e) => {
        if (!this.#hasDots()) {
          return;
        }

        const isOnImage = this.#isPointInsidePolygon(e.lngLat.toArray(), Object.values(this.#dots));
        // Only an image under the cursor is dragged; elsewhere the map pans as usual.
        // The corner and rotation handles have their own drag handlers.
        if (!isOnImage || this.#isOnHandle(e.point)) {
          return;
        }

        this.#syncTransformFromDots();
        mouseDownCoords = e.lngLat.toArray();
        const imageDraggingStartDots = this.#dots;
        this.#setDotsOpacity(0.5);
        map.dragPan.disable();

        const onMoveImage = (e: MapboxGl.MapMouseEvent) => {
          const isDragging = mouseDownCoords && e.lngLat.toArray().join("") !== mouseDownCoords.join("");
          if (!isDragging) {
            return;
          }

          this.#setLayerProperty("image", 0.5);
          this.#calcMovedCoordsPx(imageDraggingStartDots, mouseDownCoords!, e.lngLat.toArray());
          this.#defineDots();
          this.#redrawDuringDrag();
        };

        map.on("mousemove", onMoveImage);
        map.once("mouseup", () => {
          map.dragPan.enable();
          this.#setLayerProperty("image", this._inputOpacity / 100);
          this.#setDotsOpacity(1);
          this.#updateModel(true);
          map.off("mousemove", onMoveImage);
        });
      });

      map.on("zoomstart", (e) => {
        this.#startZoom = map.getZoom();
        if (e.originalEvent) {
          this.#userZooming = true;
        }
      });

      map.on("moveend", (e) => {
        if (e.originalEvent) {
          this.#updateModel(true);
        }
      });
      map.on("zoomend", () => this.#updateZoom());

      this.#canvas = canvas;

      if (isPlacedImageExists) {
        this._showOpacity = this.#showOpacityEnabled;

        // Values saved before the move/rotate handles existed only have the corner points.
        if (!this.#rotationDot) {
          this.#syncTransformFromDots();
          this.#defineDots();
        }

        this.#drawImage();
        this.#drawScaleDots();
        this.#drawRotationDot();
      }

      map.resize();
      map.setZoom(initValue.zoom);
    });

    this.#resizeObserver.observe(this._mapContainer);
  }

  #canvas?: HTMLElement;
  #handlersRegistered = new Set<string>();

  #isOnHandle(point: MapboxGl.Point) {
    const layers = ["point-0", "point-1", "point-2", "point-3", "rotation-dot"].filter((id) => this.#map!.getLayer(id));
    return layers.length > 0 && this.#map!.queryRenderedFeatures(point, { layers }).length > 0;
  }

  /** Layer event handlers survive removing and re-adding the layer, so they are registered once per layer id. */
  #registerHandlersOnce(layerId: string, register: () => void) {
    if (!this.#handlersRegistered.has(layerId)) {
      this.#handlersRegistered.add(layerId);
      register();
    }
  }

  #hasDots() {
    const dots = this.#dots;
    return Boolean(
      dots.topLeft[0] && dots.topLeft[1] && dots.topRight[0] && dots.topRight[1] &&
        dots.bottomLeft[0] && dots.bottomLeft[1] && dots.bottomRight[0] && dots.bottomRight[1],
    );
  }

  #getBoundingBox(value: RasterLayerMapValue) {
    const mapbox = this.#mapbox!;
    const southWest = new mapbox.LngLat(value.boundingBox.southWestCorner.longitude, value.boundingBox.southWestCorner.latitude);
    const northEast = new mapbox.LngLat(value.boundingBox.northEastCorner.longitude, value.boundingBox.northEastCorner.latitude);
    return new mapbox.LngLatBounds(southWest, northEast);
  }

  #initImageWithPoints(initValue: RasterLayerMapValue) {
    if (initValue.image) {
      this._image = initValue.image;
    }

    if (initValue.topLeftPoint) {
      this.#dots.topLeft = [initValue.topLeftPoint.longitude, initValue.topLeftPoint.latitude];
    }
    if (initValue.topRightPoint) {
      this.#dots.topRight = [initValue.topRightPoint.longitude, initValue.topRightPoint.latitude];
    }
    if (initValue.bottomLeftPoint) {
      this.#dots.bottomLeft = [initValue.bottomLeftPoint.longitude, initValue.bottomLeftPoint.latitude];
    }
    if (initValue.bottomRightPoint) {
      this.#dots.bottomRight = [initValue.bottomRightPoint.longitude, initValue.bottomRightPoint.latitude];
    }

    this.#updatePointInputs();
  }

  /**
   * Derives the pixel transform (center, half diagonal, corner and rotation-handle directions)
   * from the corners as they are projected now. Stored pixel values go stale once the map is
   * panned or zoomed, and values saved by older versions do not have them at all.
   */
  #syncTransformFromDots() {
    const map = this.#map!;
    const px = Object.values(this.#dots).map((dot) => Object.values(map.project(dot as [number, number])) as Point);
    const center = [(px[0][0] + px[2][0]) / 2, (px[0][1] + px[2][1]) / 2];
    const halfDiagonal = this.#getDistanceBetweenTwoDots(px[0], px[2]) / 2;

    this.#centerCoordsPx = center;
    this.#halfDiagonal = halfDiagonal;

    if (!this.#normalizedVectors?.length) {
      this.#normalizedVectors = px.map((p) => [(p[0] - center[0]) / halfDiagonal, (p[1] - center[1]) / halfDiagonal]);
    }

    if (!this.#normalizedRotationDotVector?.length) {
      const topMiddle = [(px[0][0] + px[1][0]) / 2 - center[0], (px[0][1] + px[1][1]) / 2 - center[1]];
      const length = Math.sqrt(topMiddle[0] * topMiddle[0] + topMiddle[1] * topMiddle[1]);
      this.#normalizedRotationDotVector = [topMiddle[0] / length, topMiddle[1] / length];
    }
  }

  #defineDots() {
    const map = this.#map!;
    const [x0, y0] = this.#centerCoordsPx!;
    const halfDiagonal = this.#halfDiagonal!;
    const dotsPx = this.#normalizedVectors!.map(([x, y]) => [x * halfDiagonal + x0, y * halfDiagonal + y0]);
    const rotationDotPx = [
      this.#normalizedRotationDotVector![0] * halfDiagonal + x0,
      this.#normalizedRotationDotVector![1] * halfDiagonal + y0,
    ];

    this.#dots = {
      topLeft: map.unproject(dotsPx[0] as [number, number]).toArray(),
      topRight: map.unproject(dotsPx[1] as [number, number]).toArray(),
      bottomRight: map.unproject(dotsPx[2] as [number, number]).toArray(),
      bottomLeft: map.unproject(dotsPx[3] as [number, number]).toArray(),
    };
    this.#rotationDot = map.unproject(rotationDotPx as [number, number]).toArray();
  }

  #frameGeoJson() {
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [...Object.values(this.#dots), Object.values(this.#dots)[0]] },
    } as GeoJSON.Feature;
  }

  #imageCoordinates() {
    return Object.values(this.#dots) as MapboxGl.ImageSourceRaw["coordinates"];
  }

  #drawImage() {
    const map = this.#map!;
    if (map.getLayer("image")) map.removeLayer("image");
    if (map.getSource("image")) map.removeSource("image");
    if (map.getLayer("outline")) map.removeLayer("outline");
    if (map.getSource("frame")) map.removeSource("frame");

    map.addSource("image", { type: "image", url: this._image, coordinates: this.#imageCoordinates() });
    map.addLayer({
      id: "image",
      type: "raster",
      source: "image",
      paint: { "raster-fade-duration": 0, "raster-opacity": this._inputOpacity / 100 },
    });

    map.addSource("frame", { type: "geojson", data: this.#frameGeoJson() });
    map.addLayer({
      id: "outline",
      type: "line",
      source: "frame",
      paint: { "line-color": "#000", "line-width": 1, "line-opacity": 0.3, "line-dasharray": [2, 2] },
    });
  }

  #drawScaleDots() {
    const map = this.#map!;

    Object.values(this.#dots).forEach((dot, dotIndex) => {
      const pointId = `point-${dotIndex}`;

      if (map.getLayer(pointId)) map.removeLayer(pointId);
      if (map.getSource(pointId)) map.removeSource(pointId);

      map.addSource(pointId, { type: "geojson", data: this.#getDotGeoJson(dot) });
      map.addLayer({ id: pointId, type: "circle", source: pointId, paint: { "circle-radius": 7, "circle-color": "#F84C4C" } });

      this.#registerHandlersOnce(pointId, () => this.#registerScaleDotHandlers(pointId, dotIndex));
    });
  }

  #registerScaleDotHandlers(pointId: string, dotIndex: number) {
    const map = this.#map!;
    const canvas = this.#canvas!;

    map.on("mouseenter", pointId, () => {
      map.setPaintProperty(pointId, "circle-color", "#FFBF00");
      canvas.style.cursor = dotIndex === 0 || dotIndex === 2 ? "nwse-resize" : "nesw-resize";
    });

    map.on("mouseleave", pointId, () => {
      map.setPaintProperty(pointId, "circle-color", "#F84C4C");
      canvas.style.cursor = "";
    });

    map.on("mousedown", pointId, (e) => {
      e.preventDefault();
      map.scrollZoom.disable();
      canvas.style.cursor = "grab";
      this.#syncTransformFromDots();
      this.#setLayerProperty("image", 0.5);
      this.#setDotsOpacity(0.5);

      const onDragPoint = (e: MapboxGl.MapMouseEvent) => {
        this.#calcScaledCoordsPx(this.#dots, dotIndex, e.lngLat);
        this.#defineDots();
        this.#redrawDuringDrag();
      };

      map.on("mousemove", onDragPoint);
      map.once("mouseup", () => {
        this.#setDotsOpacity(1);
        this.#setLayerProperty("image", this._inputOpacity / 100);
        map.off("mousemove", onDragPoint);
        this.#enableScrollZoom();
        this.#updateModel(true);
      });
    });
  }

  #drawRotationDot() {
    const map = this.#map!;

    if (map.getLayer("rotation-dot")) map.removeLayer("rotation-dot");
    if (map.getSource("rotation-dot")) map.removeSource("rotation-dot");

    if (!this.#rotationDot) {
      return;
    }

    map.addSource("rotation-dot", { type: "geojson", data: this.#getDotGeoJson(this.#rotationDot) });
    map.addLayer({
      id: "rotation-dot",
      type: "circle",
      source: "rotation-dot",
      paint: { "circle-radius": 7, "circle-color": "#F84C4C" },
    });

    this.#registerHandlersOnce("rotation-dot", () => this.#registerRotationDotHandlers());
  }

  #registerRotationDotHandlers() {
    const map = this.#map!;
    const canvas = this.#canvas!;

    map.on("mouseenter", "rotation-dot", () => {
      map.setPaintProperty("rotation-dot", "circle-color", "#FFBF00");
      canvas.style.cursor = "ew-resize";
    });

    map.on("mouseleave", "rotation-dot", () => {
      map.setPaintProperty("rotation-dot", "circle-color", "#F84C4C");
      canvas.style.cursor = "";
    });

    map.on("mousedown", "rotation-dot", (e) => {
      e.preventDefault();
      map.scrollZoom.disable();
      canvas.style.cursor = "grab";
      this.#syncTransformFromDots();
      this.#setLayerProperty("image", 0.5);
      this.#setDotsOpacity(0.5);

      const onDragPoint = (e: MapboxGl.MapMouseEvent) => {
        this.#calcRotatedCoordsPx(this.#dots, this.#rotationDot!, e.lngLat);
        this.#defineDots();
        this.#redrawDuringDrag();
      };

      map.on("mousemove", onDragPoint);
      map.once("mouseup", () => {
        this.#setDotsOpacity(1);
        this.#setLayerProperty("image", this._inputOpacity / 100);
        map.off("mousemove", onDragPoint);
        this.#enableScrollZoom();
        this.#updateModel(true);
      });
    });
  }

  #enableScrollZoom() {
    if (this.#scrollWheelZoom) {
      this.#map?.scrollZoom.enable();
    }
  }

  /** Moves the image, its handles and its frame to the current dots while a drag is in progress. */
  #redrawDuringDrag() {
    const map = this.#map!;
    (map.getSource("image") as MapboxGl.ImageSource | undefined)?.setCoordinates(this.#imageCoordinates() as number[][]);

    Object.values(this.#dots).forEach((dot, i) => {
      const pointId = `point-${i}`;
      (map.getSource(pointId) as MapboxGl.GeoJSONSource | undefined)?.setData(this.#getDotGeoJson(dot));
      this.#setLayerProperty(pointId, { duration: 0 }, "circle-opacity-transition");
      this.#setLayerProperty(pointId, 0.5, "circle-opacity");
    });

    if (this.#rotationDot) {
      (map.getSource("rotation-dot") as MapboxGl.GeoJSONSource | undefined)?.setData(this.#getDotGeoJson(this.#rotationDot));
    }

    (map.getSource("frame") as MapboxGl.GeoJSONSource | undefined)?.setData(this.#frameGeoJson());
  }

  #setDotsOpacity(opacity: number) {
    for (let i = 0; i < 4; i++) {
      this.#setLayerProperty(`point-${i}`, opacity, "circle-opacity");
    }
    this.#setLayerProperty("rotation-dot", opacity, "circle-opacity");
  }

  async #selectImage() {
    // Like the Umbraco 13 editor, images can be picked once the map has loaded.
    if (!this.#mapLoaded) {
      return;
    }

    const url = await pickImageUrl(this);
    if (!url) {
      return;
    }

    this.#removeImage();
    this._image = url;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const sizeMultiplier = 0.15;
    const mapContainer = this._mapContainer;
    const imageAspectRatio = image.width / image.height;
    const imageWidth = mapContainer.offsetWidth * sizeMultiplier;
    const imageHeight = imageWidth / imageAspectRatio;

    const dotsVectors = [
      [-imageWidth / 2, -imageHeight / 2],
      [imageWidth / 2, -imageHeight / 2],
      [imageWidth / 2, imageHeight / 2],
      [-imageWidth / 2, imageHeight / 2],
    ];

    const normalizeVector = ([x, y]: Point) => {
      const length = Math.sqrt(x * x + y * y);
      return [x / length, y / length];
    };

    this.#halfDiagonal = Math.sqrt(imageWidth * imageWidth + imageHeight * imageHeight) / 2;
    this.#normalizedVectors = dotsVectors.map((vector) => normalizeVector(vector));
    this.#normalizedRotationDotVector = [0, -1];
    this.#centerCoordsPx = [mapContainer.offsetWidth / 2, mapContainer.offsetHeight / 2];

    this._showOpacity = this.#showOpacityEnabled;

    this.#defineDots();
    this.#drawImage();
    this.#drawScaleDots();
    this.#drawRotationDot();
    this.#updateModel(true);
  }

  #removeImage() {
    this._showOpacity = false;
    this._inputOpacity = 100;
    this._image = "";
    this.#clearPoints(false);
  }

  #clearPoints(skipUpdate: boolean) {
    const map = this.#map;
    this.#dots = emptyDots();

    if (map) {
      if (map.getLayer("outline")) map.removeLayer("outline");
      if (map.getSource("frame")) map.removeSource("frame");
      if (map.getLayer("image")) map.removeLayer("image");
      if (map.getSource("image")) map.removeSource("image");

      for (let i = 0; i < 4; i++) {
        const pointId = `point-${i}`;
        if (map.getLayer(pointId)) map.removeLayer(pointId);
        if (map.getSource(pointId)) map.removeSource(pointId);
      }

      if (map.getLayer("rotation-dot")) map.removeLayer("rotation-dot");
      if (map.getSource("rotation-dot")) map.removeSource("rotation-dot");
    }

    if (!skipUpdate) {
      this.#updateModel(true);
    }
  }

  #setZoom() {
    if (!Number.isFinite(this._inputZoom)) {
      return;
    }

    if (this._inputZoom! < 0) {
      this._inputZoom = 0;
    }

    this.#map!.setZoom(this._inputZoom!);
    this.#updateModel(true);
  }

  #setOpacity() {
    this.#setLayerProperty("image", this._inputOpacity / 100);
    this.#updateModel(true);
  }

  #updateZoom() {
    setTimeout(() => {
      const map = this.#map;
      if (!map) {
        return;
      }

      const zoom = map.getZoom();
      const deltaZoom = this.#startZoom != null ? zoom - this.#startZoom : 0;

      if (this.#roundZoomToNatural && deltaZoom != 0) {
        if (deltaZoom >= 0.5 || deltaZoom <= -0.5) {
          map.setZoom(Math.round(zoom));
        } else if (deltaZoom > 0) {
          map.setZoom(Math.round(zoom + 1));
        } else {
          map.setZoom(Math.round(zoom - 1));
        }
      }

      this.#startZoom = null;
      this.#updateModel(this.#userZooming);
      this.#userZooming = false;
    }, 0);
  }

  #toPoint(dot: Point): LatitudeLongitude | null {
    return dot && dot[0] && dot[1] ? { latitude: dot[1], longitude: dot[0] } : null;
  }

  #updatePointInputs() {
    this._points = {
      topLeft: this.#toPoint(this.#dots.topLeft),
      topRight: this.#toPoint(this.#dots.topRight),
      bottomRight: this.#toPoint(this.#dots.bottomRight),
      bottomLeft: this.#toPoint(this.#dots.bottomLeft),
    };
  }

  /** Mirrors the old updateModel(); the value is only written when the change came from the editor. */
  #updateModel(writeValue: boolean) {
    setTimeout(() => {
      const map = this.#map;
      if (!map) {
        return;
      }

      const zoom = this.#roundZoomToNatural ? Math.round(map.getZoom()) : map.getZoom();
      this._inputZoom = zoom;
      this.#updatePointInputs();

      if (!writeValue) {
        return;
      }

      const northEastCorner = map.getBounds().getNorthEast();
      const southWestCorner = map.getBounds().getSouthWest();

      this.value = {
        topLeftPoint: this._points.topLeft,
        topRightPoint: this._points.topRight,
        bottomLeftPoint: this._points.bottomLeft,
        bottomRightPoint: this._points.bottomRight,
        rotationDot: this.#rotationDot,
        image: this._image ? this._image : null,
        opacity: this._inputOpacity,
        halfDiagonal: this.#halfDiagonal,
        centerCoordsPx: this.#centerCoordsPx,
        normalizedVectors: this.#normalizedVectors,
        normalizedRotationDotVector: this.#normalizedRotationDotVector,
        zoom,
        boundingBox: {
          southWestCorner: { latitude: southWestCorner.lat, longitude: southWestCorner.lng },
          northEastCorner: { latitude: northEastCorner.lat, longitude: northEastCorner.lng },
        },
      };
      this.dispatchEvent(new UmbChangeEvent());
    }, 0);
  }

  #getDotGeoJson(coordinates: Point): GeoJSON.FeatureCollection {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates } }],
    };
  }

  #setLayerProperty(layer: string, value: unknown, name?: string) {
    const map = this.#map;
    if (!map?.getLayer(layer)) return;
    try {
      map.setPaintProperty(layer, name || "raster-opacity", value);
    } catch (e) {
      console.log(e);
    }
  }

  #isPointInsidePolygon(point: Point, polygonDots: Point[]) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    const x = point[0];
    const y = point[1];

    let inside = false;
    for (let i = 0, j = polygonDots.length - 1; i < polygonDots.length; j = i++) {
      const xi = polygonDots[i][0];
      const yi = polygonDots[i][1];
      const xj = polygonDots[j][0];
      const yj = polygonDots[j][1];

      const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  #calcAngle(A: Point, B: Point, C: Point) {
    const x1 = A[0] - B[0]; // Vector 1 - x
    const y1 = A[1] - B[1]; // Vector 1 - y

    const x2 = C[0] - B[0]; // Vector 2 - x
    const y2 = C[1] - B[1]; // Vector 2 - y

    return Math.atan2(y2, x2) - Math.atan2(y1, x1);
  }

  // straightDotsCoordinatesArray is an array of two dots coordinates on this straight
  #calcDotToStraightDistance(dotCoordinates: Point, straightDotsCoordinatesArray: Point[]) {
    // was using this https://cutt.ly/59F0j6v
    // and this https://cutt.ly/n9F0gtK
    const [ACoordinates, BCoordinates] = straightDotsCoordinatesArray;

    if (BCoordinates[0] - ACoordinates[0] === 0) {
      return Math.abs(dotCoordinates[0] - BCoordinates[0]);
    } else if (BCoordinates[1] - ACoordinates[1] === 0) {
      return Math.abs(dotCoordinates[1] - BCoordinates[1]);
    }

    const slope = (BCoordinates[1] - ACoordinates[1]) / (BCoordinates[0] - ACoordinates[0]);

    const aMultiplier = slope;
    const bMultiplier = -1;
    const cMultiplier = slope * -ACoordinates[0] + ACoordinates[1];

    return (
      Math.abs(aMultiplier * dotCoordinates[0] + bMultiplier * dotCoordinates[1] + cMultiplier) /
      Math.sqrt(aMultiplier * aMultiplier + bMultiplier * bMultiplier)
    );
  }

  #getDistanceBetweenTwoDots(A: Point, B: Point) {
    const [x1, y1] = A;
    const [x2, y2] = B;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  #calcScaledCoordsPx(oldCoordinates: Dots, scalingDotIndex: number, cursorLngLat: MapboxGl.LngLat) {
    const map = this.#map!;
    // array of coords in lnglat
    const oldCoordinatesArray = Object.values(oldCoordinates);

    // convert array of coords and newdo in pixels
    const oldCoordsArrayPx = oldCoordinatesArray.map((coords) => Object.values(map.project(coords as [number, number])) as Point);
    const cursorPx = Object.values(map.project(cursorLngLat)) as Point;

    const oppositeDotIndex = (scalingDotIndex + 2) % 4;
    const oppositeDotCoordinates = oldCoordsArrayPx[oppositeDotIndex];

    // Get the current size of the image in pixels
    const currentWidth = this.#getDistanceBetweenTwoDots(oldCoordsArrayPx[(scalingDotIndex + 1) % 4], oppositeDotCoordinates);
    const currentHeight = this.#getDistanceBetweenTwoDots(oppositeDotCoordinates, oldCoordsArrayPx[(scalingDotIndex + 3) % 4]);

    // data for calculating new sizes
    const segmentOne = [oppositeDotCoordinates, oldCoordsArrayPx[(scalingDotIndex + 3) % 4]];
    const segmentTwo = [oldCoordsArrayPx[(scalingDotIndex + 1) % 4], oppositeDotCoordinates];

    let newWidth = this.#calcDotToStraightDistance(cursorPx, segmentOne);
    let newHeight = this.#calcDotToStraightDistance(cursorPx, segmentTwo);

    const aspectRatio = currentWidth / currentHeight;
    const newAspectRatio = newWidth / newHeight;

    if (newAspectRatio > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }

    const newDiagonal = Math.sqrt(newWidth * newWidth + newHeight * newHeight);
    const newDot = [
      this.#normalizedVectors![scalingDotIndex][0] * newDiagonal + oppositeDotCoordinates[0],
      this.#normalizedVectors![scalingDotIndex][1] * newDiagonal + oppositeDotCoordinates[1],
    ];

    this.#centerCoordsPx = [(oppositeDotCoordinates[0] + newDot[0]) / 2, (oppositeDotCoordinates[1] + newDot[1]) / 2];
    this.#halfDiagonal = newDiagonal / 2;
  }

  #calcMovedCoordsPx(oldCoordinates: Dots, initialCursorCoords: Point, newCursorCoords: Point) {
    const map = this.#map!;
    const oldCoordinatesArray = Object.values(oldCoordinates);
    const oldCoordsArrayPx = oldCoordinatesArray.map((coords) => Object.values(map.project(coords as [number, number])) as Point);
    const initialCursorPx = Object.values(map.project(initialCursorCoords as [number, number])) as Point;
    const newCursorPx = Object.values(map.project(newCursorCoords as [number, number])) as Point;
    const delta = initialCursorPx.map((value, i) => newCursorPx[i] - value);
    const oldCenterPx = [
      (oldCoordsArrayPx[0][0] + oldCoordsArrayPx[2][0]) / 2,
      (oldCoordsArrayPx[0][1] + oldCoordsArrayPx[2][1]) / 2,
    ];
    const width = this.#getDistanceBetweenTwoDots(oldCoordsArrayPx[0], oldCoordsArrayPx[1]);
    const height = this.#getDistanceBetweenTwoDots(oldCoordsArrayPx[0], oldCoordsArrayPx[3]);
    const newDiagonal = Math.sqrt(width * width + height * height);

    this.#centerCoordsPx = oldCenterPx.map((value, i) => value + delta[i]);
    this.#halfDiagonal = newDiagonal / 2;
  }

  #calcRotatedCoordsPx(oldCoordinates: Dots, oldDotCoordinates: Point, cursorLngLat: MapboxGl.LngLat) {
    const map = this.#map!;
    const oldCoordinatesArray = Object.values(oldCoordinates);
    const oldCoordsArrayPx = oldCoordinatesArray.map((coords) => Object.values(map.project(coords as [number, number])) as Point);
    const cursorPx = Object.values(map.project(cursorLngLat)) as Point;
    const oldDotPx = Object.values(map.project(oldDotCoordinates as [number, number])) as Point;
    const centerDotPx = [
      (oldCoordsArrayPx[0][0] + oldCoordsArrayPx[2][0]) / 2,
      (oldCoordsArrayPx[0][1] + oldCoordsArrayPx[2][1]) / 2,
    ];

    const width = this.#getDistanceBetweenTwoDots(oldCoordsArrayPx[0], oldCoordsArrayPx[1]);
    const height = this.#getDistanceBetweenTwoDots(oldCoordsArrayPx[0], oldCoordsArrayPx[3]);
    const newDiagonal = Math.sqrt(width * width + height * height);
    const rotationAngle = this.#calcAngle(oldDotPx, centerDotPx, cursorPx);

    const rotateVector = ([x, y]: Point, angle: number) => [
      x * Math.cos(angle) - y * Math.sin(angle),
      x * Math.sin(angle) + y * Math.cos(angle),
    ];

    this.#halfDiagonal = newDiagonal / 2;
    this.#normalizedVectors = this.#normalizedVectors!.map((vector) => rotateVector(vector, rotationAngle));
    this.#normalizedRotationDotVector = rotateVector(this.#normalizedRotationDotVector!, rotationAngle);
  }

  #renderPointInputs(label: string, point: LatitudeLongitude | null, area: string) {
    return html`
      <div class="point-label" style="grid-area: ${area}label">${label}</div>
      <div style="grid-area: ${area}lnglb">Longitude:</div>
      <input class="number-field" style="grid-area: ${area}lngin" type="number" step="any" aria-label="Longitude" placeholder="Longitude" readonly
        .value=${point?.longitude?.toString() ?? ""} />
      <div style="grid-area: ${area}latlb">Latitude:</div>
      <input class="number-field" style="grid-area: ${area}latin" type="number" step="any" aria-label="Latitude" placeholder="Latitude" readonly
        .value=${point?.latitude?.toString() ?? ""} />
    `;
  }

  #renderImage() {
    if (this._image) {
      return html`
        <div>
          <button type="button" class="image-picker" @click=${this.#selectImage}>
            <img src=${this._image} alt="" />
          </button>
          <div class="image-actions">
            <uui-button look="secondary" compact label="Edit" @click=${this.#selectImage}></uui-button>
            <uui-button look="primary" color="danger" compact label="Delete" @click=${this.#removeImage}></uui-button>
          </div>
        </div>
      `;
    }

    return html`<button type="button" class="image-picker" @click=${this.#selectImage}>
      <span class="help-text">Click to select image</span>
    </button>`;
  }

  #renderControls() {
    const points = this._points;
    const hasPoints = Boolean(points.topLeft || points.topRight || points.bottomLeft || points.bottomRight);

    return html`
      <div class="raster-layer-map-controls">
        ${this._showSetLayerByCoordinates
          ? html`
              ${this.#renderPointInputs("Top left point:", points.topLeft, "tl")}
              ${this.#renderPointInputs("Top right point:", points.topRight, "tr")}
              ${this.#renderPointInputs("Bottom left point:", points.bottomLeft, "bl")}
              ${this.#renderPointInputs("Bottom right point:", points.bottomRight, "br")}
              ${this._allowClear
                ? html`<uui-button class="coords-clear-btn" look="outline" label="Clear" ?disabled=${!hasPoints}
                    @click=${() => this.#clearPoints(false)}></uui-button>`
                : nothing}
            `
          : nothing}
        ${this._showZoom
          ? html`
              <div class="coords-zoom-label">Zoom:</div>
              <input class="number-field coords-zoom-input" type="number" step="any" aria-label="Zoom" placeholder="Zoom"
                .value=${numberFieldValue(this._inputZoom, this.#typedZoom)}
                @input=${(e: Event) => {
                  const { typed, value } = parseNumberField(e);
                  this.#typedZoom = typed;
                  if (value !== undefined) {
                    this._inputZoom = value;
                    this.#setZoom();
                  }
                }} />
            `
          : nothing}
        ${this._showOpacity
          ? html`
              <label class="coords-opacity-label">Image opacity:</label>
              <input class="coords-opacity-input" type="range" min="0" max="100" step="1" aria-label="Image opacity"
                .value=${this._inputOpacity.toString()}
                @input=${(e: Event) => {
                  this._inputOpacity = Number((e.target as HTMLInputElement).value);
                  this.#setOpacity();
                }} />
              <span class="coords-opacity-value">${this._inputOpacity}%</span>
            `
          : nothing}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="raster-layer-map-container">${this.#renderImage()} ${this.#renderControls()}</div>
      ${this._error
        ? html`<div class="error">${this._error}</div>`
        : html`
            <div id="map" class="map" ?hidden=${this._loading}></div>
            ${this._loading ? html`<div class="map loader"><uui-loader></uui-loader></div>` : nothing}
          `}
    `;
  }

  static override styles = [
    mapboxStyles,
    numberFieldStyles,
    css`
      :host {
        display: block;
      }

      .map {
        width: 100%;
        height: 400px;
      }

      .map[hidden] {
        display: none;
      }

      .loader {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .raster-layer-map-container {
        display: flex;
        flex-direction: row;
        column-gap: 50px;
        justify-content: start;
        align-items: center;
        margin-bottom: var(--uui-size-space-5);
      }

      .image-picker {
        display: flex;
        box-sizing: content-box;
        height: 144px;
        width: 144px;
        padding: 20px;
        background-color: var(--uui-color-surface);
        border: 4px dashed var(--uui-color-border);
        text-align: center;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }

      .image-picker img {
        max-width: 100%;
        max-height: 100%;
      }

      .image-actions {
        width: 192px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .raster-layer-map-controls {
        display: grid;
        align-items: center;
        text-align: end;
        justify-content: start;
        gap: 0px 8px;
        grid-template-areas:
          "tllabel . . . ."
          "tllnglb tllngin tllatlb tllatin btn"
          "trlabel . . . btn"
          "trlnglb trlngin trlatlb trlatin btn"
          "bllabel . . . btn"
          "bllnglb bllngin bllatlb bllatin btn"
          "brlabel . . . btn"
          "brlnglb brlngin brlatlb brlatin btn"
          ". . . . ."
          "zoomlb zoomin . . ."
          ". . . . ."
          "opacitylb opacityin opacityvl . .";
      }

      .point-label {
        font-weight: bold;
      }

      .coords-clear-btn {
        grid-area: btn;
      }
      .coords-zoom-label {
        grid-area: zoomlb;
        margin-top: var(--uui-size-space-5);
      }
      .coords-zoom-input {
        grid-area: zoomin;
        margin-top: var(--uui-size-space-5);
      }
      .coords-opacity-label {
        grid-area: opacitylb;
        margin-top: var(--uui-size-space-5);
      }
      .coords-opacity-input {
        grid-area: opacityin;
        margin-top: var(--uui-size-space-5);
      }
      .coords-opacity-value {
        grid-area: opacityvl;
        margin-top: var(--uui-size-space-5);
        text-align: start;
      }

      .error {
        color: var(--uui-color-danger);
      }
    `,
  ];
}

export default UkadMapboxRasterLayerMapElement;

declare global {
  interface HTMLElementTagNameMap {
    "ukad-mapbox-raster-layer-map": UkadMapboxRasterLayerMapElement;
  }
}
