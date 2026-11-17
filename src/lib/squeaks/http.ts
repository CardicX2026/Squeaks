import { NextResponse } from "next/server";
import { db, getUserId } from "./adapters";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message || code);
  }
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

const KNOWN: Record<string, number> = {
  insufficient_cheese: 402,
  insufficient_points: 402,
  already_owned: 409,
  already_claimed: 409,
  not_ready: 409,
  max_level: 409,
  item_not_found: 404,
  mission_not_found: 404,
  not_equippable: 400,
  no_player: 404,
};

export function fail(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
  }
  const err = e as { message?: unknown; code?: unknown } | null;
  const msg = typeof err?.message === "string" ? err.message : String(e);
  if (err?.code === "23505") return NextResponse.json({ error: "duplicate" }, { status: 409 });
  for (const code of Object.keys(KNOWN)) {
    if (msg.includes(code)) return NextResponse.json({ error: code }, { status: KNOWN[code] });
  }
  console.error("[squeaks]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}

export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "bad_json");
  return body as Record<string, unknown>;
}

export function int(v: unknown, min: number, max: number, name: string): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, "bad_" + name);
  return n;
}

export function str(v: unknown, min: number, max: number, name: string): string {
  if (typeof v !== "string") throw new ApiError(400, "bad_" + name);
  const s = v.trim();
  if (s.length < min || s.length > max) throw new ApiError(400, "bad_" + name);
  return s;
}

export type Player = {
  user_id: string;
  handle: string | null;
  cheese: number;
  points: number;
  best_score: number;
  runs: number;
  streak: number;
  last_daily: string | null;
  banned: boolean;
};

export async function ensurePlayer(userId: string): Promise<Player> {
  await db().from("sq_players").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  await db().from("sq_burrow").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data, error } = await db().from("sq_players").select("*").eq("user_id", userId).single();
  if (error) throw error;
  return data as Player;
}

export type Ctx = { userId: string; player: Player };

export function withUser(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      const userId = await getUserId(req);
      if (!userId) throw new ApiError(401, "unauthorized");
      const player = await ensurePlayer(userId);
      if (player.banned) throw new ApiError(403, "banned");
      return await fn(req, { userId, player });
    } catch (e) {
      return fail(e);
    }
  };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const env = (process.env.SQ_ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (env.includes(userId)) return true;
  const { data } = await db().from("sq_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

export function withAdmin(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      const userId = await getUserId(req);
      if (!userId) throw new ApiError(401, "unauthorized");
      if (!(await isAdmin(userId))) throw new ApiError(403, "forbidden");
      const player = await ensurePlayer(userId);
      return await fn(req, { userId, player });
    } catch (e) {
      return fail(e);
    }
  };
}

export async function audit(actor: string, action: string, target: string | null, detail: Record<string, unknown> = {}) {
  await db().from("sq_audit").insert({ actor, action, target, detail });
}
