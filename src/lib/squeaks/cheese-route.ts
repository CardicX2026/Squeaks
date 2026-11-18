// Shared wrapper for /api/cheese/* routes: verifies the Privy user and maps CardicX errors to responses.
import "server-only";
import { NextResponse } from "next/server";
import { getUserId } from "./adapters";
import { CxError } from "@/lib/cardicx";

export const utcDate = () => new Date().toISOString().slice(0, 10);

export function cheeseRoute(fn: (req: Request, userId: string) => Promise<unknown>) {
  return async (req: Request) => {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
    try {
      return NextResponse.json(await fn(req, userId));
    } catch (e) {
      if (e instanceof CxError) {
        const res = NextResponse.json({ error: e.code }, { status: e.status === 401 ? 502 : e.status });
        if (e.retryAfter) res.headers.set("Retry-After", String(e.retryAfter));
        return res; // CardicX 401 means our signature was refused: a server problem, not the user's
      }
      if (e instanceof BadRequest) return NextResponse.json({ error: e.message }, { status: 400 });
      console.error("[cheese]", e instanceof Error ? e.message : "error"); // never log tokens or secrets
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  };
}
export class BadRequest extends Error {}
export async function body(req: Request): Promise<Record<string, unknown>> {
  const j = await req.json().catch(() => null);
  if (!j || typeof j !== "object" || Array.isArray(j)) throw new BadRequest("bad_json");
  return j as Record<string, unknown>;
}

/** Public (no login) route with the same CardicX error mapping. */
export function publicRoute(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request) => {
    try { return NextResponse.json(await fn(req)); } catch (e) {
      if (e instanceof CxError) return NextResponse.json({ error: e.code }, { status: e.status === 401 ? 502 : e.status });
      if (e instanceof BadRequest) return NextResponse.json({ error: e.message }, { status: 400 });
      console.error("[public]", e instanceof Error ? e.message : "error");
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  };
}
