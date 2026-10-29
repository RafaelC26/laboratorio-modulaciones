import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Las pruebas viven en src/pruebas y usan el prefijo "pruebas" (sin sufijo .test).
    include: ["src/pruebas/**/*.ts"],
    environment: "node",
  },
});
