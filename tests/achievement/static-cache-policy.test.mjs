import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

async function headersSource(relativePath) {
  return (await readFile(new URL(relativePath, projectRoot), "utf8"))
    .replaceAll("\r\n", "\n")
    .trim();
}

async function jsonFile(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, projectRoot), "utf8"));
}

test("congratulations caches stable and content-addressed assets", async () => {
  const source = await headersSource("public/_headers");
  assert.match(source, /^\/\*\n  Cache-Control: no-cache\n/);
  assert.equal(source.includes("Cache-Control: no-store"), false);
  assert.match(
    source,
    /Content-Security-Policy: default-src 'self';.*frame-ancestors 'self';.*object-src 'none'/,
  );

  for (const path of [
    "/assets/*",
    "/vendor/*",
    "/experiences/conche/_astro/*",
    "/experiences/glyphica/_next/static/*",
    "/experiences/halfstep/assets/*",
  ]) {
    assert.match(
      source,
      new RegExp(
        `${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n` +
          "  ! Cache-Control\\n" +
          "  Cache-Control: public, max-age=31536000, immutable",
      ),
    );
  }
});
