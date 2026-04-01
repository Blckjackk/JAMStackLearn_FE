// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"

// https://astro.build/config
export default defineConfig({
  vite: /** @type {any} */ ({
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["screwed-nonhedonistically-joycelyn.ngrok-free.dev"],
    },
  }),
  integrations: [react()],
})
