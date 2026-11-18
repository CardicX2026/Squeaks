// Tamper-proof "tickets" issued by the server (run start, mine shift start). The browser only stores them;
// the server checks the signature and its own timestamp when the run finishes or the shift is collected.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function key() {
  const base = process.env.SQ_TICKET_SECRET || process.env.SQUEAKS_PARTNER_SECRET;
  if (!base) throw new Error("ticket_secret_missing");
  return createHmac("sha256", base).update("squeaks-ticket-v1").digest();
}
const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function issue(payload: Record<string, unknown>): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(createHmac("sha256", key()).update(body).digest())}`;
}
export function verify<T extends Record<string, unknown>>(ticket: unknown): T | null {
  if (typeof ticket !== "string" || ticket.length > 2000) return null;
  const [body, sig] = ticket.split(".");
  if (!body || !sig) return null;
  const want = createHmac("sha256", key()).update(body).digest();
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()) as T; } catch { return null; }
}
