import { ok, rpc, withAdmin } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET: headline numbers for the admin dashboard.
export const GET = withAdmin(async () => ok(await rpc("sq_admin_overview", {})));
