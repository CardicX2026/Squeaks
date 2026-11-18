// CardicX free-access pass codes from the Cheese Chase mystery box.
// A code is CDX-XXXX-XXXX-CCCC: eight characters derived from the run plus four check characters signed with a
// server secret, so CardicX support can tell a real code from a made-up one (GET /api/mystery?code=).
import "server-only";
import { createHmac } from "node:crypto";

const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I, easy to read off a screenshot

function secret() {
  const base = process.env.SQ_TICKET_SECRET || process.env.SQUEAKS_PARTNER_SECRET || process.env.PRIVY_APP_SECRET;
  if (!base) throw new Error("pass_secret_missing");
  return createHmac("sha256", base).update("squeaks-cardicx-pass-v1").digest();
}
const enc = (b: Buffer, n: number) => Array.from(b.subarray(0, n), (x) => ABC[x % 32]).join("");
const check = (body: string) => enc(createHmac("sha256", secret()).update(body).digest(), 4);

/** One code per run: the same run always gets the same code. */
export function passForRun(rid: string) {
  const body = enc(createHmac("sha256", secret()).update(`run:${rid}`).digest(), 8);
  return `CDX-${body.slice(0, 4)}-${body.slice(4)}-${check(body)}`;
}
export function isPass(code: string) {
  const m = /^CDX-([A-Z2-9]{4})-([A-Z2-9]{4})-([A-Z2-9]{4})$/.exec(code.trim().toUpperCase());
  return !!m && check(m[1] + m[2]) === m[3];
}
