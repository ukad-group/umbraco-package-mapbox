export interface LatitudeLongitude {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  southWestCorner: LatitudeLongitude;
  northEastCorner: LatitudeLongitude;
}

/** Stored value of the marker map. Keep the key order: it is what Umbraco 13 wrote. */
export interface MarkerMapValue {
  marker: LatitudeLongitude | null;
  zoom: number;
  boundingBox: BoundingBox;
}

/** Where the marker map opens when there is neither a value nor a configured default position. */
export const DEFAULT_MARKER_MAP_VALUE: MarkerMapValue = {
  marker: { latitude: -54.975556, longitude: -1.621667 },
  zoom: 9,
  boundingBox: {
    southWestCorner: { latitude: -54.970495269313204, longitude: -1.6278648376464846 },
    northEastCorner: { latitude: -54.97911600936982, longitude: -1.609625816345215 },
  },
};

/** Stored value of the raster layer map. Keep the key order: it is what Umbraco 13 wrote. */
export interface RasterLayerMapValue {
  topLeftPoint: LatitudeLongitude | null;
  topRightPoint: LatitudeLongitude | null;
  bottomLeftPoint: LatitudeLongitude | null;
  bottomRightPoint: LatitudeLongitude | null;
  rotationDot?: number[];
  image: string | null;
  opacity: number;
  halfDiagonal?: number;
  centerCoordsPx?: number[];
  normalizedVectors?: number[][];
  normalizedRotationDotVector?: number[];
  zoom: number;
  boundingBox: BoundingBox;
}

/**
 * Values come in as objects, or as JSON strings when nested in blocks migrated from Umbraco 13.
 */
export function parseValue<T>(value: unknown): T | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  return value as T;
}
