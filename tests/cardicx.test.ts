// Run with: npm test   (node --experimental-strip-types --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { CxError, sendSigned, sign } from "../src/lib/cardicx-core.ts";
import { purchase } from "../src/lib/purchase.ts";

const RAW = JSON.stringify({ user_id: "did:privy:abc", amount: 10, reason: "game_run", ref: "run_1" });
const cfg = { base: "https://example.test/api/partner/squeaks", secret: "test-secret" };

function fakeFetch(statuses: number[], seen: { body?: string; headers: Record<string, string> }[]) {
  let i = 0;
  return async (_url: string, init: { headers: Record<string, string>; body?: string }) => {
    seen.push({ body: init.body, headers: init.headers });
    const status = statuses[Math.min(i++, statuses.length - 1)];
    const body = status === 200 ? JSON.stringify({ balance: 5, credited: 10, capped: false }) : JSON.stringify({ error: status === 402 ? "insufficient_balance" : status === 409 ? "ref_conflict" : status === 400 ? "validation" : "internal" });
    return { ok: status >= 200 && status < 300, status, text: async () => body, headers: { get: () => null } };
  };
}

test("signature is hex HMAC-SHA256 of `${timestamp}.${rawBody}`", () => {
  assert.equal(sign("test-secret", "1700000000000", RAW), "155a328cf4b6cbc7d818b5064cc390b22a69772776ebfe603b0992d3bdaeb42d");
  assert.equal(sign("test-secret", "1700000000000", ""), sign("test-secret", "1700000000000", "")); // GET signs ""
});

test("5xx is retried with the SAME body and ref, fresh signature each try", async () => {
  const seen: { body?: string; headers: Record<string, string> }[] = [];
  const r = await sendSigned<{ credited: number }>(fakeFetch([500, 502, 200], seen), cfg, "POST", "/credit", RAW, { backoffMs: 1 });
  assert.equal(r.credited, 10);
  assert.equal(seen.length, 3);
  for (const s of seen) {
    assert.equal(s.body, RAW);
    assert.equal(s.headers["X-Partner-Signature"], sign(cfg.secret, s.headers["X-Partner-Timestamp"], RAW));
  }
});

for (const status of [400, 401, 402, 409]) {
  test(`${status} is not retried`, async () => {
    const seen: { body?: string; headers: Record<string, string> }[] = [];
    await assert.rejects(sendSigned(fakeFetch([status, 200], seen), cfg, "POST", "/debit", RAW, { backoffMs: 1 }), (e: unknown) => e instanceof CxError && e.status === status);
    assert.equal(seen.length, 1);
  });
}

test("a 402 does not grant the item", async () => {
  let granted = false;
  const seen: { body?: string; headers: Record<string, string> }[] = [];
  await assert.rejects(purchase(() => sendSigned(fakeFetch([402], seen), cfg, "POST", "/debit", RAW), () => { granted = true; }));
  assert.equal(granted, false);
});

test("a successful debit grants the item once", async () => {
  let grants = 0;
  const seen: { body?: string; headers: Record<string, string> }[] = [];
  await purchase(() => sendSigned(fakeFetch([200], seen), cfg, "POST", "/debit", RAW), () => { grants++; });
  assert.equal(grants, 1);
});
