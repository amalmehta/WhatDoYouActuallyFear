/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Served from GitHub Pages at /WhatDoYouActuallyFear/.
export default defineConfig({
  base: "/WhatDoYouActuallyFear/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
});
