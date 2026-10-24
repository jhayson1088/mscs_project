import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
      },
      output: {
        manualChunks: {
          material: ["@mui/material", "@emotion/react", "@emotion/styled"],
          database: ["dexie", "dexie-react-hooks"],
        },
      },
    },
  },
});
