import { randomUUID } from "node:crypto";
import { getChat, postChat } from "@/lib/cardicx";
import { BadRequest, body, cheeseRoute, publicRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const last = new Map<string, number>(); // simple per-instance flood guard (CardicX also rate limits)
const BAD = /\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|c+u+n+t+|n+i+g+g+\w*)\b/gi;

// GET ?after=<id>: newest messages (public, read-only)
export const GET = publicRoute(async (req) => {
  const after = Math.max(0, Number(new URL(req.url).searchParams.get("after")) || 0);
  return getChat(after, 50);
});

// POST { body }: send a message as the signed-in user
export const POST = cheeseRoute(async (req, userId) => {
  const now = Date.now();
  if (now - (last.get(userId) ?? 0) < 1500) throw new BadRequest("slow_down");
  const text = String((await body(req)).body ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 1 || text.length > 280) throw new BadRequest("bad_length");
  last.set(userId, now);
  return postChat(userId, text.replace(BAD, (w) => "🧀".repeat(Math.min(4, w.length))), `chat_${randomUUID()}`);
});
