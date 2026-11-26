// NationStat local server — serves app/ at http://localhost:8080.
// Standard library only. Run: node serve.ts

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = join(here, "app");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    // Browsers ask for /favicon.ico on every visit; the page already
    // carries an inline icon, so answer 204 and keep the logs clean.
    if (path === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const file = path === "/" ? "index.html" : path.replace(/^\//, "");
    if (file.includes("..")) {
      res.writeHead(400);
      res.end("bad path");
      return;
    }
    const body = await readFile(join(root, file));
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(8080, () => {
  console.log("NationStat at http://localhost:8080");
});
