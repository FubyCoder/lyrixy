import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        outDir: "./build",
        cssMinify: true,
        cssCodeSplit: true,
        minify: true,
        lib: {
            formats: ["cjs"],
            fileName: (format, filename) => {
                if (format === "cjs") {
                    return filename + ".js";
                }

                return filename + "." + format;
            },
            entry: {
                index: resolve(__dirname, "src/index.ts"),
                "index.css": resolve(__dirname, "src/index.css"),
            },
            name: "lyrixy",
        },
    },

    esbuild: {},
});
