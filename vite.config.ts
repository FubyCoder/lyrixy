import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        outDir: "./dist",
        cssMinify: true,
        minify: true,
        cssCodeSplit: true,

        lib: {
            formats: ["cjs"],
            entry: {
                index: resolve(__dirname, "src/index.ts"),
                "index.css": resolve(__dirname, "src/index.css"),
            },
            name: "lyricx",
        },
    },

    esbuild: {},
});
