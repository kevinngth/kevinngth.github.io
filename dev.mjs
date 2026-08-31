#!/usr/bin/env node
/**
 * Development server: `node dev.mjs [port]`
 *
 * Builds, serves dist/, watches tools.json and src/, rebuilds on save, and tells
 * the open browser to reload. Zero dependencies.
 *
 * The live-reload snippet is injected into the response, never written to disk,
 * so dist/index.html stays identical to what gets deployed.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, watch } from "node:fs";
import { extname, join, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./build.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, "dist");
const PORT = Number(process.argv[2] || process.env.PORT || 8000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/* ------------------------------------------------------------ live reload */

const clients = new Set();

const CLIENT = `
<script>
/* dev only — injected by dev.mjs, never written to dist/ */
(function(){
  var es = new EventSource("/__dev");
  es.addEventListener("reload", function(){ location.reload(); });
  es.addEventListener("failed", function(e){
    var box = document.getElementById("__err") || (function(){
      var d = document.createElement("div");
      d.id = "__err";
      d.style.cssText = "position:fixed;inset:auto 16px 16px 16px;z-index:9999;max-height:50vh;overflow:auto;" +
        "background:#2B1416;color:#FFD9D6;border:1px solid #7A2B2B;border-radius:10px;padding:14px 16px;" +
        "font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;" +
        "box-shadow:0 10px 30px rgba(0,0,0,.4)";
      document.body.appendChild(d);
      return d;
    })();
    box.textContent = "Build failed\\n\\n" + JSON.parse(e.data).message + "\\n\\nFix it and save again.";
  });
})();
</script>`;

function send(event, data) {
  for (const res of clients) {
    res.write(`event: ${event}\ndata: ${data}\n\n`);
  }
}

/* ---------------------------------------------------------------- build */

function rebuild(reason) {
  const t0 = Date.now();
  try {
    const r = build();
    const bits = [`${r.count} tool${r.count === 1 ? "" : "s"}`, `${r.tags.length} tags`];
    if (!r.finder) bits.push("finder hidden");
    console.log(`  rebuilt  ${reason}  (${bits.join(", ")}, ${Date.now() - t0}ms)`);
    send("reload", "1");
    return true;
  } catch (err) {
    console.error(`  FAILED   ${reason}  ${err.message}`);
    send("failed", JSON.stringify({ message: err.message }));
    return false;
  }
}

/* ---------------------------------------------------------------- serve */

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/__dev") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("retry: 1000\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const file = resolve(dist, "." + pathname);
  if (file !== dist && !file.startsWith(dist + sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  if (!existsSync(file) || !statSync(file).isFile()) {
    // Almost always a link to another repo's project site, which only exists once
    // that repo is deployed. Say so rather than showing a bare 404.
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<body style="font:15px/1.6 system-ui;max-width:34rem;margin:18vh auto;padding:0 1.5rem;color:#47525F">
<h1 style="font-size:1.15rem;color:#161D26">Not found locally: <code>${pathname}</code></h1>
<p>Links like this point at <em>other repositories'</em> project sites. They resolve once
those repos have Pages enabled — there is nothing to serve for them here.</p>
<p><a href="/" style="color:#2C5A8F">Back to the homepage</a></p>${CLIENT}`);
    return;
  }

  const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
  let body = readFileSync(file);

  if (type.startsWith("text/html")) {
    body = Buffer.from(body.toString("utf8").replace("</body>", CLIENT + "\n</body>"));
  }

  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
});

/* ---------------------------------------------------------------- watch */

let timer = null;
function schedule(what) {
  clearTimeout(timer);
  // Editors write in bursts (and some save atomically via rename) — coalesce.
  timer = setTimeout(() => rebuild(what), 60);
}

function relevant(file) {
  if (!file) return false;
  const f = file.split(sep).join("/");
  if (f.startsWith("dist/") || f.startsWith(".git/") || f.startsWith("node_modules/")) return false;
  return f === "tools.json" || f.startsWith("src/");
}

function startWatching() {
  try {
    watch(root, { recursive: true }, (_e, file) => {
      if (relevant(file)) schedule(file.split(sep).join("/"));
    });
  } catch {
    // Recursive watching isn't available everywhere; watch the two inputs directly.
    watch(resolve(root, "tools.json"), () => schedule("tools.json"));
    watch(resolve(root, "src"), (_e, f) => schedule("src/" + (f ?? "")));
  }
}

/* ----------------------------------------------------------------- boot */

console.log("");
if (!rebuild("initial build")) {
  console.log("  (serving anyway — fix the error and save to retry)\n");
}
startWatching();

server.listen(PORT, () => {
  console.log(`
  Homepage dev server

    http://localhost:${PORT}

  Watching tools.json and src/ — save to rebuild and reload.
  Ctrl-C to stop.
`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use. Try:  node dev.mjs ${PORT + 1}\n`);
    process.exit(1);
  }
  throw err;
});

process.on("SIGINT", () => {
  for (const res of clients) res.end();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 150);
});
