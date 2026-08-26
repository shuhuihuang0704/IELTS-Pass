import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("https://ielts-ai.test/", { headers: { accept: "text/html", host: "ielts-ai.test" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the IELTS AI product shell and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>IELTS AI/);
  assert.match(html, /场景化雅思学习/);
  assert.match(html, /IELTS AI/);
  assert.match(html, /第一次/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships all four learning modes and persistent progress", async () => {
  const [app, data, state] = await Promise.all([
    readFile(new URL("../app/IeltsApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/learning-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/learning-state.ts", import.meta.url), "utf8"),
  ]);
  for (const feature of ["VocabularyPractice", "ListeningPractice", "SpeakingPractice", "ReadingPractice", "ReviewView"]) {
    assert.match(app, new RegExp(feature));
  }
  assert.match(app, /localStorage\.setItem/);
  assert.match(app, /SpeechSynthesisUtterance/);
  assert.match(data, /vocabulary|listening|speaking|reading/);
  assert.match(state, /completionPercent/);
});

test("includes the finished social preview and removes starter preview files", async () => {
  const image = new URL("../public/og.png", import.meta.url);
  await access(image);
  assert.ok((await stat(image)).size > 100_000);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
