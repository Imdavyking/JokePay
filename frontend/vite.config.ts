import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import serveStatic from "vite-plugin-serve-static";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import rollupNodePolyFill from "rollup-plugin-polyfill-node";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";
// https://vite.dev/config/

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      // Workaround for https://github.com/keep-starknet-strange/scaffold-garaga/issues/5
      ...serveStatic([
        {
          pattern: /main.worker.js/,
          resolve: "node_modules/@aztec/bb.js/dest/browser/main.worker.js",
        },
      ]),
      apply: "serve", // Only apply in dev mode
    },
    wasm(),
    nodePolyfills({
      include: ["process", "util", "path", "buffer"],
    }),
  ],
  define: {
    "process.env": {},
    global: "globalThis",
  },
  resolve: {
    alias: {
      // path: "path-browserify",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: false,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
