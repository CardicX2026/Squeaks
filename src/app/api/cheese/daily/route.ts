import { credit } from "@/lib/cardicx";
import { DAILY_CHEESE } from "@/lib/catalog";
import { cheeseRoute, utcDate } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: today's gift. The ref is one per user per UTC day, so a second claim is a harmless duplicate.
export const POST = cheeseRoute(async (_req, userId) => credit(userId, DAILY_CHEESE, "daily", `daily_${userId}_${utcDate()}`));
