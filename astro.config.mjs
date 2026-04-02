// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import vercel from "@astrojs/vercel"

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react()],
  vite: /** @type {any} */ ({
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["screwed-nonhedonistically-joycelyn.ngrok-free.dev"],
    },
  }),
})
