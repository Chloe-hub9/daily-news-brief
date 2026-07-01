import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"]
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
