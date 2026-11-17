// Lokale testserver die werkt zoals Vercel: schone URL's + /api/offerte.
// Gebruik: OFFERTE_TEST=1 node bron/dev-server.js   (dan wordt er geen echte mail verstuurd)
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const handler = require(path.join(ROOT, "api/offerte.js"));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain" };
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/offerte") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { req.body = JSON.parse(raw || "{}"); } catch { req.body = raw; }
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
      handler(req, res);
    });
    return;
  }
  let p = url.pathname === "/" ? "/index.html" : url.pathname;
  let file = path.join(ROOT, p);
  if (!path.extname(file)) file += ".html";
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.statusCode = 404; file = path.join(ROOT, "404.html"); }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
