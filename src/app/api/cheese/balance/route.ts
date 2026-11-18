import { getBalance } from "@/lib/cardicx";
import { cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: the signed-in player's Cheese, read from CardicX (the only Cheese balance).
export const GET = cheeseRoute(async (_req, userId) => getBalance(userId));
