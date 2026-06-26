import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] || "out");
const port = Number(process.argv[3] || process.env.PORT || 3000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
};

function fileFor(urlPath) {
  const pathname = decodeURIComponent((urlPath || "/").split("?")[0]);
  const safePath = normalize(pathname).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  const candidates =
    safePath === ""
      ? [join(root, "index.html")]
      : [join(root, safePath), join(root, `${safePath}.html`), join(root, safePath, "index.html")];

  return candidates.find((candidate) => {
    const resolved = resolve(candidate);
    return resolved.startsWith(root) && existsSync(resolved) && statSync(resolved).isFile();
  });
}

createServer((request, response) => {
  const file = fileFor(request.url);

  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(file)] || "application/octet-stream",
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
