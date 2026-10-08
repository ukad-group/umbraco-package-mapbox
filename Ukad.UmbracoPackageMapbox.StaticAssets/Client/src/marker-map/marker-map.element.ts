import { css, customElement, html, nothing, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbChangeEvent } from "@umbraco-cms/backoffice/event";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import type {
  UmbPropertyEditorConfigCollection,
  UmbPropertyEditorUiElement,
} from "@umbraco-cms/backoffice/property-editor";
import type * as MapboxGl from "mapbox-gl";
import { getBoolean, numberFieldValue, parseNumberField } from "../shared/config.js";
import { getMapboxAccessToken } from "../shared/mapbox-settings.js";
import { loadMapbox, mapboxStyles, type Mapbox } from "../shared/load-mapbox.js";
import { numberFieldStyles } from "../shared/styles.js";
import { DEFAULT_MARKER_MAP_VALUE as DEFAULT_VALUE, parseValue, type MarkerMapValue } from "../shared/types.js";

interface NominatimFeature {
  bbox: [number, number, number, number];
  geometry: { coordinates: [number, number] };
  properties: { display_name: string };
}

/**
 * Port of the Umbraco 13 "Ukad.UmbracoPackageMapbox.MarkerMap.Controller".
 * The value is only changed in response to the editor's own actions, so opening and saving
 * a document leaves the stored value untouched.
 */
@customElement("ukad-mapbox-marker-map")
export class UkadMapboxMarkerMapElement extends UmbLitElement implements UmbPropertyEditorUiElement {
  @property({ attribute: false })
  value?: MarkerMapValue | string;

  @property({ attribute: false })
  set config(config: UmbPropertyEditorConfigCollection | undefined) {
    // Defaults are the C# defaults Umbraco 13 used for missing settings.
    this._showSearch = getBoolean(config, "showSearch", false);
    this._showSetMarkerByCoordinates = getBoolean(config, "showSetMarkerByCoordinates", false);
    this._showZoom = getBoolean(config, "showZoom", false);
    this._allowClear = getBoolean(config, "allowClear", true);
    this.#scrollWheelZoom = getBoolean(config, "scrollWheelZoom", true);
    this.#roundZoomToNatural = getBoolean(config, "roundZoomToNatural", true);
    this.#defaultPosition = parseValue<MarkerMapValue>(config?.getValueByAlias("defaultPosition"));
  }

  @state() private _showSearch = false;
  @state() private _showSetMarkerByCoordinates = false;
  @state() private _showZoom = false;
  @state() private _allowClear = true;
  @state() private _loading = true;
  @state() private _error = "";
  @state() private _hasMarker = false;
  @state() private _inputLat?: number;
  @state() private _inputLng?: number;
  @state() private _inputZoom?: number;
  @state() private _coordinates?: { lng: number; lat: number };
  @state() private _searchTerm = "";
  @state() private _searchResults?: NominatimFeature[];
  @state() private _selectedResult = 0;

  @query("#map") private _mapContainer!: HTMLDivElement;

  #scrollWheelZoom = true;
  #roundZoomToNatural = true;
  #defaultPosition?: MarkerMapValue;
  #accessToken?: string;
  #typed = { lat: "", lng: "", zoom: "" };
  #language?: string;
  #mapbox?: Mapbox;
  #map?: MapboxGl.Map;
  #marker?: MapboxGl.Marker;
  #startZoom: number | null = null;
  #userZooming = false;
  #searchTimer?: number;
  #searchRequest = 0;
  #resizeObserver = new ResizeObserver(() => this.#map?.resize());

  constructor() {
    super();
    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      this.observe(context?.languageIsoCode, (language) => (this.#language = language), "_language");
    });
  }

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
    const initValue = parseValue<MarkerMapValue>(this.value) || this.#defaultPosition || DEFAULT_VALUE;

    this.#marker = undefined;
    this._hasMarker = false;
    this._coordinates = undefined;
    this._inputLat = undefined;
    this._inputLng = undefined;

    const isBoundingBoxExists =
      initValue?.boundingBox?.southWestCorner?.longitude &&
      initValue?.boundingBox?.southWestCorner?.latitude &&
      initValue?.boundingBox?.northEastCorner?.longitude &&
      initValue?.boundingBox?.northEastCorner?.latitude;

    const isMarkerExists = initValue.marker?.latitude && initValue.marker?.longitude;

    if (isMarkerExists) {
      this._coordinates = { lng: initValue.marker!.longitude, lat: initValue.marker!.latitude };
    }

    const map = new mapbox.Map({
      accessToken,
      container: this._mapContainer,
      animate: false,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: initValue.zoom,
      projection: "equirectangular",
    } as unknown as MapboxGl.MapboxOptions);
    this.#map = map;

    if (isMarkerExists) {
      map.jumpTo({ center: [initValue.marker!.longitude, initValue.marker!.latitude] });
    } else if (isBoundingBoxExists) {
      const boundingBox = this.#getBoundingBox(initValue);
      map.jumpTo({ center: [boundingBox.getCenter().lng, boundingBox.getCenter().lat] });
    } else {
      map.jumpTo({ center: [DEFAULT_VALUE.marker!.longitude, DEFAULT_VALUE.marker!.latitude] });
    }

    if (isBoundingBoxExists) {
      const boundingBox = this.#getBoundingBox(initValue);
      map.fitBounds(boundingBox, { center: boundingBox.getCenter() } as MapboxGl.FitBoundsOptions);
    }

    map.addControl(new mapbox.NavigationControl());
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    if (!this.#scrollWheelZoom) {
      map.scrollZoom.disable();
    }

    map.on("click", (e) => this.#onMapClick(e));
    map.on("moveend", (e) => {
      if (e.originalEvent) {
        this.#updateModel(true);
      }
    });
    map.on("zoomstart", (e) => {
      this.#startZoom = map.getZoom();
      if (e.originalEvent) {
        this.#userZooming = true;
      }
    });
    map.on("zoomend", () => this.#updateZoom());
    map.on("contextmenu", () => {
      if (!this._allowClear) {
        return;
      }
      this.#clearMarker(false);
    });

    if (isMarkerExists) {
      this.#setCurrentMarker(new mapbox.Marker({ draggable: true }).setLngLat([initValue.marker!.longitude, initValue.marker!.latitude]));

      if (this._showSetMarkerByCoordinates) {
        this._inputLat = initValue.marker!.latitude;
        this._inputLng = initValue.marker!.longitude;
      }
    }

    map.on("load", () => {
      map.resize();
      map.setZoom(initValue.zoom);
    });

    if (this._showZoom) {
      this._inputZoom = initValue.zoom;
    }

    this.#resizeObserver.observe(this._mapContainer);
  }

  #getBoundingBox(value: MarkerMapValue) {
    const mapbox = this.#mapbox!;
    const southWest = new mapbox.LngLat(value.boundingBox.southWestCorner.longitude, value.boundingBox.southWestCorner.latitude);
    const northEast = new mapbox.LngLat(value.boundingBox.northEastCorner.longitude, value.boundingBox.northEastCorner.latitude);
    return new mapbox.LngLatBounds(southWest, northEast);
  }

  #setCurrentMarker(marker: MapboxGl.Marker) {
    this.#marker = marker.addTo(this.#map!);
    this.#marker.on("dragend", () => this.#updateModel(true));
    this._hasMarker = true;
  }

  #clearMarker(skipUpdate: boolean) {
    if (this.#marker) {
      this.#marker.remove();
      this.#marker = undefined;
      this._hasMarker = false;
      this._coordinates = undefined;
    }

    if (!skipUpdate) {
      this.#updateModel(true);
    }
  }

  #setMarker() {
    if (!Number.isFinite(this._inputLat) || !Number.isFinite(this._inputLng)) {
      return;
    }

    this.#clearMarker(false);

    const lngLat: [number, number] = [this._inputLng!, this._inputLat!];
    this.#map!.jumpTo({ center: lngLat });
    this.#setCurrentMarker(new this.#mapbox!.Marker({ draggable: true }).setLngLat(lngLat));
    this._coordinates = { lng: lngLat[0], lat: lngLat[1] };

    this.#updateModel(true);
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

  #onMapClick(e: MapboxGl.MapMouseEvent) {
    this.#clearMarker(true);

    this.#map!.jumpTo({ center: e.lngLat });
    this.#setCurrentMarker(new this.#mapbox!.Marker({ draggable: true }).setLngLat([e.lngLat.lng, e.lngLat.lat]));
    this._coordinates = { lng: e.lngLat.lng, lat: e.lngLat.lat };

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

  /** Mirrors the old updateModel(); the value is only written when the change came from the editor. */
  #updateModel(writeValue: boolean) {
    setTimeout(() => {
      const map = this.#map;
      if (!map) {
        return;
      }

      const zoom = this.#roundZoomToNatural ? Math.round(map.getZoom()) : map.getZoom();
      this._inputZoom = zoom;

      const northEastCorner = map.getBounds().getNorthEast();
      const southWestCorner = map.getBounds().getSouthWest();

      let marker: MarkerMapValue["marker"] = null;
      if (this.#marker) {
        const lngLat = this.#marker.getLngLat();
        marker = { latitude: lngLat.lat, longitude: lngLat.lng };
        this._inputLat = lngLat.lat;
        this._inputLng = lngLat.lng;
        this._coordinates = { lng: lngLat.lng, lat: lngLat.lat };
      } else {
        this._inputLat = undefined;
        this._inputLng = undefined;
      }

      if (!writeValue) {
        return;
      }

      this.value = {
        marker,
        zoom,
        boundingBox: {
          southWestCorner: { latitude: southWestCorner.lat, longitude: southWestCorner.lng },
          northEastCorner: { latitude: northEastCorner.lat, longitude: northEastCorner.lng },
        },
      };
      this.dispatchEvent(new UmbChangeEvent());
    }, 0);
  }

  #onSearchInput(e: Event) {
    this._searchTerm = (e.target as HTMLInputElement).value;
    clearTimeout(this.#searchTimer);

    if (this._searchTerm.length < 2) {
      this._searchResults = undefined;
      return;
    }

    this.#searchTimer = window.setTimeout(() => this.#search(this._searchTerm), 500);
  }

  async #search(term: string) {
    const request = ++this.#searchRequest;
    const limit = 5;
    const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=${limit}&q=${encodeURI(term)}&accept-language=${this.#language ?? ""}`;

    try {
      const response = await fetch(api);
      const data = (await response.json()) as { features: NominatimFeature[] };
      if (request === this.#searchRequest && this._searchTerm === term) {
        this._searchResults = data.features;
        this._selectedResult = 0;
      }
    } catch (error) {
      console.error(error);
    }
  }

  #onSearchKeydown(e: KeyboardEvent) {
    const results = this._searchResults;
    if (!results?.length) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this._selectedResult = (this._selectedResult + 1) % results.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this._selectedResult = (this._selectedResult - 1 + results.length) % results.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.#onSearchSubmit(results[this._selectedResult]);
    } else if (e.key === "Escape") {
      this._searchResults = undefined;
    }
  }

  #clearSearch() {
    this._searchTerm = "";
    this._searchResults = undefined;
  }

  #onSearchSubmit(feature: NominatimFeature) {
    const mapbox = this.#mapbox!;
    const map = this.#map!;
    const { display_name } = feature.properties;
    const coords = feature.geometry.coordinates;

    this._searchTerm = display_name;
    this._searchResults = undefined;

    const popup = new mapbox.Popup({ offset: 25 }).setText(display_name);
    const marker = new mapbox.Marker({ draggable: true }).setLngLat([coords[0], coords[1]]).setPopup(popup);

    const bbox = feature.bbox;
    const boundingBox = new mapbox.LngLatBounds(new mapbox.LngLat(bbox[0], bbox[1]), new mapbox.LngLat(bbox[2], bbox[3]));
    map.fitBounds(boundingBox, { center: boundingBox.getCenter() } as MapboxGl.FitBoundsOptions);

    this.#marker?.remove();
    this.#setCurrentMarker(marker);
    this._coordinates = { lng: coords[0], lat: coords[1] };

    this.#updateModel(true);

    map.jumpTo({ center: marker.getLngLat() });
  }

  #renderHighlighted(text: string) {
    const term = this._searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = term ? text.split(new RegExp(`(${term})`, "gi")) : [text];
    return parts.map((part, i) => (i % 2 === 1 ? html`<b>${part}</b>` : part));
  }

  #renderSearch() {
    if (!this._showSearch) {
      return nothing;
    }

    return html`
      <div class="search">
        <uui-input
          label="Search"
          placeholder="Type to search..."
          .value=${this._searchTerm}
          @input=${this.#onSearchInput}
          @keydown=${this.#onSearchKeydown}>
          <uui-icon name="icon-search" slot="prepend"></uui-icon>
          ${this._searchTerm
            ? html`<uui-button slot="append" compact label="Clear" @click=${this.#clearSearch}>
                <uui-icon name="icon-wrong"></uui-icon>
              </uui-button>`
            : nothing}
        </uui-input>
        ${this._searchResults
          ? html`<ul class="search-results">
              ${this._searchResults.length === 0
                ? html`<li>No results found: "${this._searchTerm}"</li>`
                : this._searchResults.map(
                    (feature, i) => html`<li
                      class=${i === this._selectedResult ? "selected" : ""}
                      @mouseenter=${() => (this._selectedResult = i)}
                      @click=${() => this.#onSearchSubmit(feature)}>
                      <uui-icon name="icon-search"></uui-icon>
                      <span>${this.#renderHighlighted(feature.properties.display_name)}</span>
                    </li>`,
                  )}
            </ul>`
          : nothing}
      </div>
    `;
  }

  #renderControls() {
    if (!this._showSetMarkerByCoordinates && !this._showZoom) {
      return nothing;
    }

    return html`
      <div class="map-controls">
        ${this._showSetMarkerByCoordinates
          ? html`
              <div class="coords-lng-label">Longitude:</div>
              <input
                class="number-field coords-lng-input"
                type="number"
                step="any"
                aria-label="Longitude"
                placeholder="Longitude"
                .value=${numberFieldValue(this._inputLng, this.#typed.lng)}
                @input=${(e: Event) => {
                  const { typed, value } = parseNumberField(e);
                  this.#typed.lng = typed;
                  if (value !== undefined) {
                    this._inputLng = value;
                    this.#setMarker();
                  }
                }} />
              ${this._allowClear
                ? html`<uui-button
                    class="coords-clear-btn"
                    look="outline"
                    label="Clear"
                    ?disabled=${!this._hasMarker}
                    @click=${() => this.#clearMarker(false)}></uui-button>`
                : nothing}
              <div class="coords-lat-label">Latitude:</div>
              <input
                class="number-field coords-lat-input"
                type="number"
                step="any"
                aria-label="Latitude"
                placeholder="Latitude"
                .value=${numberFieldValue(this._inputLat, this.#typed.lat)}
                @input=${(e: Event) => {
                  const { typed, value } = parseNumberField(e);
                  this.#typed.lat = typed;
                  if (value !== undefined) {
                    this._inputLat = value;
                    this.#setMarker();
                  }
                }} />
            `
          : nothing}
        ${this._showZoom
          ? html`
              <div class="coords-zoom-label">Zoom:</div>
              <input
                class="number-field coords-zoom-input"
                type="number"
                step="any"
                aria-label="Zoom"
                placeholder="Zoom"
                .value=${numberFieldValue(this._inputZoom, this.#typed.zoom)}
                @input=${(e: Event) => {
                  const { typed, value } = parseNumberField(e);
                  this.#typed.zoom = typed;
                  if (value !== undefined) {
                    this._inputZoom = value;
                    this.#setZoom();
                  }
                }} />
            `
          : nothing}
      </div>
    `;
  }

  override render() {
    return html`
      ${this.#renderSearch()} ${this.#renderControls()}
      ${this._error
        ? html`<div class="error">${this._error}</div>`
        : html`
            <div class="map-wrapper">
              <div id="map" class="map" ?hidden=${this._loading}></div>
              ${this._coordinates && !this._loading
                ? html`<pre class="coordinates">Longitude: ${this._coordinates.lng}<br />Latitude: ${this._coordinates.lat}</pre>`
                : nothing}
              ${this._loading ? html`<div class="map loader"><uui-loader></uui-loader></div>` : nothing}
            </div>
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

      .map-wrapper {
        position: relative;
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

      .coordinates {
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        position: absolute;
        bottom: 40px;
        left: 10px;
        padding: 5px 10px;
        margin: 0;
        font-size: 11px;
        line-height: 18px;
        border-radius: 3px;
        z-index: 1;
      }

      .search {
        position: relative;
        margin-bottom: var(--uui-size-space-5);
      }

      .search uui-input {
        width: 100%;
      }

      .search uui-input uui-icon[slot="prepend"] {
        padding-left: var(--uui-size-space-3);
      }

      .search-results {
        position: absolute;
        z-index: 2;
        left: 0;
        right: 0;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--uui-color-surface);
        border: 1px solid var(--uui-color-border);
        box-shadow: var(--uui-shadow-depth-2);
      }

      .search-results li {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
        padding: var(--uui-size-space-3) var(--uui-size-space-4);
        cursor: pointer;
      }

      .search-results li.selected {
        background: var(--uui-color-surface-emphasis);
      }

      .map-controls {
        display: grid;
        align-items: center;
        text-align: end;
        justify-content: start;
        gap: 16px 8px;
        margin-bottom: var(--uui-size-space-5);
        grid-template-areas:
          "lnglb lngin latlb latin btn"
          "zoomlb zoomin . . .";
      }

      .coords-lng-label {
        grid-area: lnglb;
      }
      .coords-lng-input {
        grid-area: lngin;
      }
      .coords-lat-label {
        grid-area: latlb;
      }
      .coords-lat-input {
        grid-area: latin;
      }
      .coords-clear-btn {
        grid-area: btn;
      }
      .coords-zoom-label {
        grid-area: zoomlb;
      }
      .coords-zoom-input {
        grid-area: zoomin;
      }

      .error {
        color: var(--uui-color-danger);
      }
    `,
  ];
}

export default UkadMapboxMarkerMapElement;

declare global {
  interface HTMLElementTagNameMap {
    "ukad-mapbox-marker-map": UkadMapboxMarkerMapElement;
  }
}
