# Squeaks core backend

API routes and database for the Squeaks game site: runs, leaderboard, burrow (idle cheese), shop,
daily reward, missions, and admin. Next.js 15 App Router, Supabase (service role, server side only), Privy login.
No game code and no UI in here, only the backend the game and pages call.

## Install (3 steps)

1. Unzip at the project root. It adds `src/app/api/squeaks/`, `src/lib/squeaks/` and `supabase/`:
       unzip -o squeaks-core-backend.zip -d /path/to/your/project
2. Run `supabase/squeaks_core.sql` once in the Supabase SQL editor (safe to re-run). Creates 12 `sq_` tables
   (RLS on, no policies), the money functions, starter shop items and missions.
3. Add the env vars from `.env.example`, then:
       npm i @supabase/supabase-js @privy-io/server-auth

To make yourself admin, put your Privy user id in `SQ_ADMIN_IDS`
(or `insert into sq_admins(user_id) values ('did:privy:...');`).

If your project already has Supabase or Privy helpers, edit only `src/lib/squeaks/adapters.ts`.

## Currencies

- Cheese: soft currency. Earned from runs, burrow, daily reward, missions. Spent in the shop and on burrow upgrades.
- Points: season score. Earned from run score (capped per UTC day), daily reward, missions.
- Both live in one append-only ledger (`sq_ledger`). Every change goes through `sq_apply()`, which is atomic,
  idempotent per (user, reason, ref), and can never make a balance negative.

## Routes (all need `Authorization: Bearer <Privy access token>` unless noted)

| Method | Path | Body | Does |
|---|---|---|---|
| GET | /api/squeaks/me | | Profile, balances, inventory, can_claim_daily |
| PATCH | /api/squeaks/me | {handle} | Set handle (3 to 20, a-z 0-9 _) |
| POST | /api/squeaks/run/start | | New run: {run_id, seed}. One active run per player |
| POST | /api/squeaks/run/finish | {run_id, score, cheese} | Validates, pays cheese and points, updates best score and missions |
| GET | /api/squeaks/leaderboard?period=daily\|weekly\|all&limit= | | Public. Best score per player |
| GET | /api/squeaks/burrow | | Level, rate, pending, next upgrade cost |
| POST | /api/squeaks/burrow/collect | | Collect pending cheese |
| POST | /api/squeaks/burrow/upgrade | | Upgrade one level (pays pending first) |
| GET | /api/squeaks/shop | | Active items and what you own |
| POST | /api/squeaks/shop/buy | {item_key} | Buy (skins, hats, trails once; boosts stack) |
| POST | /api/squeaks/shop/equip | {item_key, equipped} | One equipped per kind |
| POST | /api/squeaks/daily | | Claim daily reward and streak |
| GET | /api/squeaks/missions | | Missions with progress for this period |
| POST | /api/squeaks/missions/claim | {mission_key} | Claim a completed mission |
| GET | /api/squeaks/admin/overview | | Players, runs today, flags, cheese and points totals |
| GET | /api/squeaks/admin/players?q= | | Search by handle or did |
| POST | /api/squeaks/admin/grant | {user_id, cheese, points, reason} | Grant or revoke (negative). Audited |
| POST | /api/squeaks/admin/ban | {user_id, banned, reason} | Ban or unban. Audited |
| GET/POST | /api/squeaks/admin/shop | item | List all, create or update item |
| GET/POST | /api/squeaks/admin/missions | mission | List all, create or update mission |
| GET/PATCH | /api/squeaks/admin/flags | {id, status} | Anti-cheat flag queue |
| GET/PUT | /api/squeaks/admin/config | {key, value} | Tune numbers without a deploy |

Errors are JSON `{error: "code"}`: 401 unauthorized, 403 banned or forbidden, 402 insufficient_cheese,
409 already_owned or already_claimed or not_ready, 422 run_rejected, 429 too_fast or daily_run_limit.

## How the game should call it

    const start = await apiFetch("/api/squeaks/run/start", { method: "POST" });      // { run_id, seed }
    // ...play... use `seed` for any server-checkable randomness
    const res = await apiFetch("/api/squeaks/run/finish", {
      method: "POST", body: JSON.stringify({ run_id: start.run_id, score, cheese }),
    });                                                                               // { score, cheese, points, best_score, balances }

## Anti-cheat, honestly

The server measures run time itself and rejects runs that are too short, too long, or score or collect faster than
`max_score_per_sec` and `max_cheese_per_sec`. Rejected runs raise a flag in the admin queue. Rewards are capped per run and
points per day, and a player gets max 300 runs a day. This stops casual fakes, not a determined cheater, because the
score still comes from the browser. Do not attach anything with real cash value to it. Tune the numbers in `sq_config`.

## Tuning

All numbers are in `src/lib/squeaks/config.ts` (defaults), overridable per key through `PUT /admin/config`.
Changes reach every server instance within 30 seconds.

## Known limits (v1)

- Login required to play. No guest mode yet.
- Boosts are stored in the inventory but not consumed by any route. The game decides when to use one, so add
  a consume route when you build that.
- Mission rewards are not subject to the daily points cap. Keep reward_points small.
- Leaderboard shows handles only, and falls back to "mouse-xxxxx" when a player has none.
- Nothing here sends tokens or touches a wallet.

## What was tested

TypeScript compiles clean against Next 15 types. The SQL was run on Postgres 16 and the money functions were tested:
idempotent grants, no negative balances, double purchase blocked, boost stacking, one equipped item per kind, daily
streaks, burrow cap and upgrade, mission claim once, leaderboard best score with bans excluded, ledger equals balances,
and anon or authenticated roles cannot call any `sq_` function. The routes were not run against a live Supabase or Privy
project, so do a quick smoke test with a real login after step 3.
