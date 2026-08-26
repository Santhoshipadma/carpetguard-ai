import assert from "node:assert/strict";
import test from "node:test";

async function renderHome() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders CarpetGuard safety and privacy boundaries", async () => {
  const response = await renderHome();
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /CarpetGuard AI/);
  assert.match(html, /On-device photo analysis/);
  assert.match(html, /cannot identify mold species/i);
  assert.match(html, /screening only/i);
});

test("links to official EPA and CDC guidance", async () => {
  const response = await renderHome();
  const html = await response.text();

  assert.match(html, /epa\.gov\/mold/);
  assert.match(html, /cdc\.gov\/mold-health/);
  assert.match(html, /cdc\.gov\/niosh\/mold/);
});
