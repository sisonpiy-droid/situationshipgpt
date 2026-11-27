import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Mounts api/chat.js locally (dev + preview) so the LLM path works without `vercel dev`.
function mount(server) {
  Object.assign(process.env, loadEnv("development", process.cwd(), ""));
  server.middlewares.use("/api/chat", async (req, res) => {
    try {
      let raw = "";
      for await (const c of req) raw += c;
      try { req.body = JSON.parse(raw || "{}"); } catch { req.body = null; }
      const url = pathToFileURL(resolve("api/chat.js")).href + "?" + Date.now();
      await (await import(/* @vite-ignore */ url)).default(req, res);
    } catch (e) {
      res.statusCode = 500; res.end('{"error":"dev-api"}');
    }
  });
}

export default defineConfig({
  plugins: [react(), { name: "local-api", configureServer: mount, configurePreviewServer: mount }],
});
