// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// External hosts commonly expose the backend settings without Vite's `VITE_`
// prefix. Only the public URL and publishable key are copied into the browser
// bundle; privileged server credentials must never be defined here.
const publicBackendUrl =
  process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
const publicBackendKey =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  process.env["SUPABASE_PUBLISHABLE_KEY"] ??
  process.env["SUPABASE_ANON_KEY"];

export default defineConfig({
  // Lovable pins its own deployment target in hosted builds. External Vercel
  // builds need an explicit Vercel output bundle instead of the Cloudflare
  // fallback used for local/other production builds.
  nitro: {
    preset: process.env["VERCEL"] ? "vercel" : "cloudflare-module",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      ...(publicBackendUrl
        ? { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBackendUrl) }
        : {}),
      ...(publicBackendKey
        ? {
            "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY":
              JSON.stringify(publicBackendKey),
          }
        : {}),
    },
  },
});
