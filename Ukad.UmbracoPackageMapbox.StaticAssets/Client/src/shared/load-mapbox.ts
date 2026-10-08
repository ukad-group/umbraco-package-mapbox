import { unsafeCSS } from "@umbraco-cms/backoffice/external/lit";
import type * as MapboxGl from "mapbox-gl";
import mapboxCss from "mapbox-gl/dist/mapbox-gl.css?inline";

export type Mapbox = typeof MapboxGl;

declare global {
  interface Window {
    mapboxgl?: Mapbox;
  }
}

/** Mapbox GL JS styles, adopted by each map element's shadow root. */
export const mapboxStyles = unsafeCSS(mapboxCss);

// Emitted next to this bundle by the build (see vite.config.ts). A variable keeps Vite from inlining it.
const mapboxScript = "lib/mapbox-gl.js";

let loader: Promise<Mapbox> | undefined;

/** Loads Mapbox GL JS once and returns the global it defines. */
export function loadMapbox(): Promise<Mapbox> {
  loader ??= new Promise<Mapbox>((resolve, reject) => {
    if (window.mapboxgl) {
      resolve(window.mapboxgl);
      return;
    }

    const script = document.createElement("script");
    script.src = new URL(mapboxScript, import.meta.url).href;
    script.onload = () => (window.mapboxgl ? resolve(window.mapboxgl) : reject(new Error("Mapbox GL JS did not load")));
    script.onerror = () => {
      loader = undefined;
      reject(new Error("Mapbox GL JS could not be loaded"));
    };
    document.head.appendChild(script);
  });

  return loader;
}
