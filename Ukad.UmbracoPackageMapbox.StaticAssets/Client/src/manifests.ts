import type { ManifestPropertyEditorUi } from "@umbraco-cms/backoffice/property-editor";
import { DEFAULT_MARKER_MAP_VALUE } from "./shared/types.js";

// The UI aliases are the same as the property editor (schema) aliases on purpose: when upgrading from
// Umbraco 13, Umbraco sets each existing data type's UI alias to its editor alias, so data types created
// with earlier versions of this package pick up these UIs without any data migration.
const MARKER_MAP_ALIAS = "Ukad.MapboxMarkerMap";
const RASTER_LAYER_MAP_ALIAS = "Ukad.MapboxRasterLayerMap";
const IMAGE_URL_ALIAS = "Ukad.MapboxImageUrl";
const GROUP = "Mapbox";

const toggle = (alias: string, label: string, description: string) => ({
  alias,
  label,
  description,
  propertyEditorUiAlias: "Umb.PropertyEditorUi.Toggle",
});

export const manifests: Array<ManifestPropertyEditorUi> = [
  {
    type: "propertyEditorUi",
    alias: MARKER_MAP_ALIAS,
    name: "Mapbox Marker Map Property Editor UI",
    element: () => import("./marker-map/marker-map.element.js"),
    meta: {
      label: "Mapbox Marker Map",
      icon: "icon-map-location",
      group: GROUP,
      propertyEditorSchemaAlias: MARKER_MAP_ALIAS,
      settings: {
        properties: [
          {
            alias: "defaultPosition",
            label: "Default Position",
            propertyEditorUiAlias: MARKER_MAP_ALIAS,
          },
          toggle("showSearch", "Show Search", "Show search field above map."),
          toggle("showSetMarkerByCoordinates", "Show Set Marker By Coordinates", "Set Marker By Coordinates field's above map."),
          toggle("allowClear", "Allow Clear", "Allow clearing previous marker."),
          toggle("scrollWheelZoom", "Scroll wheel zoom", "Enable scroll wheel zoom in property editor?"),
          toggle("showZoom", "Show Zoom", "Show zoom level above map."),
          toggle("roundZoomToNatural", "Round Zoom", "Round Zoom to natural numbers."),
        ],
        // Same as the C# defaults in MapboxMarkerMapConfiguration. Umbraco 13 also stored the editor's
        // starting position as the default position when a data type was created.
        defaultData: [
          { alias: "defaultPosition", value: DEFAULT_MARKER_MAP_VALUE },
          { alias: "showSearch", value: false },
          { alias: "showSetMarkerByCoordinates", value: false },
          { alias: "allowClear", value: true },
          { alias: "scrollWheelZoom", value: true },
          { alias: "showZoom", value: false },
          { alias: "roundZoomToNatural", value: true },
        ],
      },
    },
  },
  {
    type: "propertyEditorUi",
    alias: RASTER_LAYER_MAP_ALIAS,
    name: "Mapbox Raster Layer Map Property Editor UI",
    element: () => import("./raster-layer-map/raster-layer-map.element.js"),
    meta: {
      label: "Mapbox Raster Layer Map",
      icon: "icon-map-location",
      group: GROUP,
      propertyEditorSchemaAlias: RASTER_LAYER_MAP_ALIAS,
      settings: {
        properties: [
          {
            alias: "defaultImage",
            label: "Default Image",
            propertyEditorUiAlias: IMAGE_URL_ALIAS,
          },
          toggle("showSetLayerByCoordinates", "Show Set Layer By Coordinates", "Set Layer By Coordinates field's above map."),
          toggle("allowClear", "Allow Clear", "Allow clearing previous layer."),
          toggle("scrollWheelZoom", "Scroll wheel zoom", "Enable scroll wheel zoom in property editor?"),
          toggle("showZoom", "Show Zoom", "Show zoom level above map."),
          toggle("roundZoomToNatural", "Round Zoom", "Round Zoom to natural numbers."),
          toggle("showOpacity", "Show Image Opacity", "Show Image Opacity."),
        ],
        // Same as the C# defaults in MapboxRasterLayerMapConfiguration.
        defaultData: [
          { alias: "showSetLayerByCoordinates", value: false },
          { alias: "allowClear", value: true },
          { alias: "scrollWheelZoom", value: true },
          { alias: "showZoom", value: false },
          { alias: "roundZoomToNatural", value: true },
          { alias: "showOpacity", value: true },
        ],
      },
    },
  },
  {
    type: "propertyEditorUi",
    alias: IMAGE_URL_ALIAS,
    name: "Mapbox Image URL Property Editor UI",
    element: () => import("./image-url/image-url-picker.element.js"),
    meta: {
      label: "Mapbox Image URL",
      icon: "icon-picture",
      group: GROUP,
    },
  },
];
