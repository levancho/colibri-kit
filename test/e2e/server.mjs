import fs from "node:fs";
import path from "node:path";
import http from "node:http";

export async function serveBuild(directory = "site/dist") {
  const root = path.resolve(directory);
  const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
    if (path.relative(root, file).startsWith("..") || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}
