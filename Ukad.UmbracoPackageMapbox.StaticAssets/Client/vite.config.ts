import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);

export default defineConfig({
  build: {
    lib: {
      entry: "src/bundle.manifests.ts",
      formats: ["es"],
      fileName: "ukad-mapbox",
    },
    outDir: "../wwwroot/App_Plugins/Ukad.UmbracoPackageMapbox",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [/^@umbraco/],
      // Stable file names, so builds replace files instead of adding new ones next to the old.
      output: {
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
  plugins: [
    {
      // Mapbox GL JS ships as a prebuilt bundle that creates its web worker from its own source,
      // so it is copied as-is and loaded with a script tag instead of being re-bundled.
      name: "copy-mapbox-gl",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "lib/mapbox-gl.js",
          source: readFileSync(require.resolve("mapbox-gl/dist/mapbox-gl.js")),
        });
      },
    },
  ],
});
