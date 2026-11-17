import { db } from "@/lib/squeaks/adapters";
import { ApiError, int, ok, readJson, str, withAdmin, audit } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET ?status=open|reviewed|dismissed
export const GET = withAdmin(async (req) => {
  const status = new URL(req.url).searchParams.get("status") || "open";
  const { data, error } = await db().from("sq_flags").select("*")
    .eq("status", status).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return ok({ flags: data ?? [] });
});

// PATCH { id, status: reviewed | dismissed }
export const PATCH = withAdmin(async (req, { userId: admin }) => {
  const b = await readJson(req);
  const id = int(b.id, 1, Number.MAX_SAFE_INTEGER, "id");
  const status = str(b.status, 1, 10, "status");
  if (!["reviewed", "dismissed"].includes(status)) throw new ApiError(400, "bad_status");
  const { error } = await db().from("sq_flags").update({ status }).eq("id", id);
  if (error) throw error;
  await audit(admin, "flag_" + status, String(id));
  return ok({ id, status });
});
