-- SQUEAKS CORE BACKEND: run once in the Supabase SQL editor.
-- Safe to re-run: tables use "if not exists", functions use "create or replace", seeds skip duplicates.
-- All tables are deny-all (RLS on, no policies). Only the server (service role) touches them.

create extension if not exists pgcrypto;

-- ---------- TABLES ----------
create table if not exists sq_players (
  user_id text primary key,                       -- Privy DID
  handle text,
  cheese bigint not null default 0 check (cheese >= 0),
  points bigint not null default 0 check (points >= 0),
  best_score int not null default 0,
  runs int not null default 0,
  streak int not null default 0,
  last_daily date,
  banned boolean not null default false,
  ban_reason text,
  created_at timestamptz not null default now()
);
create unique index if not exists sq_players_handle_uq on sq_players (lower(handle)) where handle is not null;

create table if not exists sq_ledger (
  id bigserial primary key,
  user_id text not null references sq_players(user_id),
  kind text not null check (kind in ('cheese','points')),
  delta bigint not null,
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);
create unique index if not exists sq_ledger_idem on sq_ledger (user_id, kind, reason, ref) where ref is not null;
create index if not exists sq_ledger_user_time on sq_ledger (user_id, kind, reason, created_at);

create table if not exists sq_runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references sq_players(user_id),
  seed text not null,
  status text not null default 'active' check (status in ('active','finished','rejected','expired')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int,
  score int,
  cheese int,
  reject_reason text
);
create index if not exists sq_runs_user_started on sq_runs (user_id, started_at desc);
create index if not exists sq_runs_board on sq_runs (status, finished_at, score desc);

create table if not exists sq_burrow (
  user_id text primary key references sq_players(user_id),
  level int not null default 1 check (level between 1 and 50),
  last_collect_at timestamptz not null default now()
);

create table if not exists sq_shop_items (
  key text primary key,
  kind text not null check (kind in ('skin','hat','trail','boost')),
  name text not null,
  description text not null default '',
  price_cheese int not null check (price_cheese >= 0),
  active boolean not null default true,
  sort int not null default 0,
  meta jsonb not null default '{}'::jsonb,
  available_from timestamptz
);

create table if not exists sq_inventory (
  user_id text not null references sq_players(user_id),
  item_key text not null references sq_shop_items(key),
  qty int not null default 1,
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

create table if not exists sq_missions (
  key text primary key,
  title text not null,
  description text not null default '',
  metric text not null check (metric in ('runs','score','cheese')),
  target int not null check (target > 0),
  reward_cheese int not null default 0,
  reward_points int not null default 0,
  period text not null check (period in ('daily','weekly','once')),
  active boolean not null default true,
  sort int not null default 0
);

create table if not exists sq_mission_progress (
  user_id text not null references sq_players(user_id),
  mission_key text not null references sq_missions(key),
  period_key text not null,
  progress int not null default 0,
  claimed_at timestamptz,
  primary key (user_id, mission_key, period_key)
);

create table if not exists sq_flags (
  id bigserial primary key,
  user_id text not null references sq_players(user_id),
  run_id uuid,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists sq_flags_status on sq_flags (status, created_at desc);

create table if not exists sq_admins (
  user_id text primary key,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists sq_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists sq_audit (
  id bigserial primary key,
  actor text not null,
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table sq_players enable row level security;
alter table sq_ledger enable row level security;
alter table sq_runs enable row level security;
alter table sq_burrow enable row level security;
alter table sq_shop_items enable row level security;
alter table sq_inventory enable row level security;
alter table sq_missions enable row level security;
alter table sq_mission_progress enable row level security;
alter table sq_flags enable row level security;
alter table sq_admins enable row level security;
alter table sq_config enable row level security;
alter table sq_audit enable row level security;

-- ---------- FUNCTIONS ----------
create or replace function sq_period_key(p_period text) returns text
language sql stable as $$
  select case p_period
    when 'daily'  then to_char(now() at time zone 'utc', 'YYYY-MM-DD')
    when 'weekly' then to_char(now() at time zone 'utc', 'IYYY-"W"IW')
    else 'once' end;
$$;

-- The one place balances change. Atomic, idempotent on (user, reason, ref), never negative.
create or replace function sq_apply(p_user text, p_cheese bigint, p_points bigint, p_reason text, p_ref text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cur_c bigint; cur_p bigint;
begin
  select cheese, points into cur_c, cur_p from sq_players where user_id = p_user for update;
  if not found then raise exception 'no_player'; end if;
  if p_ref is not null and exists (
    select 1 from sq_ledger where user_id = p_user and reason = p_reason and ref = p_ref
  ) then
    return jsonb_build_object('applied', false, 'cheese', cur_c, 'points', cur_p);
  end if;
  if cur_c + p_cheese < 0 then raise exception 'insufficient_cheese'; end if;
  if cur_p + p_points < 0 then raise exception 'insufficient_points'; end if;
  if p_cheese <> 0 then
    insert into sq_ledger(user_id, kind, delta, reason, ref) values (p_user, 'cheese', p_cheese, p_reason, p_ref);
  end if;
  if p_points <> 0 then
    insert into sq_ledger(user_id, kind, delta, reason, ref) values (p_user, 'points', p_points, p_reason, p_ref);
  end if;
  update sq_players set cheese = cheese + p_cheese, points = points + p_points where user_id = p_user;
  return jsonb_build_object('applied', true, 'cheese', cur_c + p_cheese, 'points', cur_p + p_points);
end $$;

create or replace function sq_record_run(p_user text, p_score int) returns int
language plpgsql security definer set search_path = public as $$
declare b int;
begin
  update sq_players set runs = runs + 1, best_score = greatest(best_score, p_score)
  where user_id = p_user returning best_score into b;
  return b;
end $$;

create or replace function sq_bump(p_user text, p_metric text, p_amount int, p_mode text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into sq_mission_progress(user_id, mission_key, period_key, progress)
  select p_user, m.key, sq_period_key(m.period), p_amount
  from sq_missions m where m.active and m.metric = p_metric
  on conflict (user_id, mission_key, period_key) do update set progress =
    case when p_mode = 'max' then greatest(sq_mission_progress.progress, excluded.progress)
         else sq_mission_progress.progress + excluded.progress end;
end $$;

create or replace function sq_missions_list(p_user text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', m.key, 'title', m.title, 'description', m.description, 'metric', m.metric,
    'target', m.target, 'reward_cheese', m.reward_cheese, 'reward_points', m.reward_points,
    'period', m.period, 'progress', coalesce(p.progress, 0), 'claimed', p.claimed_at is not null
  ) order by m.sort, m.key), '[]'::jsonb)
  from sq_missions m
  left join sq_mission_progress p
    on p.user_id = p_user and p.mission_key = m.key and p.period_key = sq_period_key(m.period)
  where m.active;
$$;

create or replace function sq_mission_claim(p_user text, p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m sq_missions%rowtype; pk text; pr sq_mission_progress%rowtype; r jsonb;
begin
  select * into m from sq_missions where key = p_key and active;
  if not found then raise exception 'mission_not_found'; end if;
  pk := sq_period_key(m.period);
  select * into pr from sq_mission_progress
   where user_id = p_user and mission_key = p_key and period_key = pk for update;
  if not found or pr.progress < m.target then raise exception 'not_ready'; end if;
  if pr.claimed_at is not null then raise exception 'already_claimed'; end if;
  update sq_mission_progress set claimed_at = now()
   where user_id = p_user and mission_key = p_key and period_key = pk;
  r := sq_apply(p_user, m.reward_cheese, m.reward_points, 'mission', p_key || ':' || pk);
  return jsonb_build_object('mission', p_key, 'reward_cheese', m.reward_cheese,
                            'reward_points', m.reward_points, 'balances', r);
end $$;

create or replace function sq_daily_claim(p_user text, p_base int, p_step int, p_cap int, p_points int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pl sq_players%rowtype; today date := (now() at time zone 'utc')::date; s int; c int; r jsonb;
begin
  select * into pl from sq_players where user_id = p_user for update;
  if not found then raise exception 'no_player'; end if;
  if pl.last_daily = today then raise exception 'already_claimed'; end if;
  if pl.last_daily = today - 1 then s := pl.streak + 1; else s := 1; end if;
  c := p_base + p_step * (least(s, p_cap) - 1);
  r := sq_apply(p_user, c, p_points, 'daily', today::text);
  update sq_players set streak = s, last_daily = today where user_id = p_user;
  return jsonb_build_object('streak', s, 'cheese', c, 'points', p_points, 'balances', r);
end $$;

create or replace function sq_burrow_collect(p_user text, p_base_per_hour int, p_max_hours int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b sq_burrow%rowtype; hrs numeric; amt bigint; r jsonb;
begin
  insert into sq_burrow(user_id) values (p_user) on conflict (user_id) do nothing;
  select * into b from sq_burrow where user_id = p_user for update;
  hrs := least(extract(epoch from (now() - b.last_collect_at)) / 3600.0, p_max_hours);
  amt := floor(hrs * p_base_per_hour * b.level);
  if amt < 1 then
    return jsonb_build_object('collected', 0, 'level', b.level);
  end if;
  r := sq_apply(p_user, amt, 0, 'burrow',
        'collect:' || floor(extract(epoch from b.last_collect_at) * 1000)::text);
  update sq_burrow set last_collect_at = now() where user_id = p_user;
  return jsonb_build_object('collected', amt, 'level', b.level, 'balances', r);
end $$;

create or replace function sq_burrow_upgrade(p_user text, p_base_cost int, p_base_per_hour int, p_max_hours int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b sq_burrow%rowtype; cost bigint; r jsonb;
begin
  perform sq_burrow_collect(p_user, p_base_per_hour, p_max_hours);   -- pay out pending at the old rate first
  select * into b from sq_burrow where user_id = p_user for update;
  if b.level >= 50 then raise exception 'max_level'; end if;
  cost := p_base_cost::bigint * b.level * b.level;
  r := sq_apply(p_user, -cost, 0, 'burrow_upgrade', 'to:' || (b.level + 1)::text);
  update sq_burrow set level = level + 1 where user_id = p_user;
  return jsonb_build_object('level', b.level + 1, 'cost', cost, 'balances', r);
end $$;

create or replace function sq_buy(p_user text, p_item text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it sq_shop_items%rowtype; own int; r jsonb;
begin
  perform 1 from sq_players where user_id = p_user for update;       -- serialize this player's purchases
  select * into it from sq_shop_items
   where key = p_item and active and (available_from is null or available_from <= now());
  if not found then raise exception 'item_not_found'; end if;
  select qty into own from sq_inventory where user_id = p_user and item_key = p_item;
  if own is not null and it.kind <> 'boost' then raise exception 'already_owned'; end if;
  r := sq_apply(p_user, -(it.price_cheese::bigint), 0, 'shop', p_item || ':' || gen_random_uuid()::text);
  insert into sq_inventory(user_id, item_key, qty) values (p_user, p_item, 1)
  on conflict (user_id, item_key) do update set qty = sq_inventory.qty + 1;
  return jsonb_build_object('item', p_item, 'price', it.price_cheese, 'balances', r);
end $$;

create or replace function sq_equip(p_user text, p_item text, p_equipped boolean) returns void
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  select s.kind into k from sq_inventory i join sq_shop_items s on s.key = i.item_key
   where i.user_id = p_user and i.item_key = p_item;
  if not found then raise exception 'item_not_found'; end if;
  if k = 'boost' then raise exception 'not_equippable'; end if;
  if p_equipped then
    update sq_inventory i set equipped = false
      from sq_shop_items s where s.key = i.item_key and s.kind = k and i.user_id = p_user;
  end if;
  update sq_inventory set equipped = p_equipped where user_id = p_user and item_key = p_item;
end $$;

create or replace function sq_leaderboard(p_since timestamptz, p_limit int)
returns table(rank bigint, handle text, score int) language sql stable security definer set search_path = public as $$
  select row_number() over (order by b.best desc, b.first_at asc) as rank,
         coalesce(p.handle, 'mouse-' || substr(md5(b.user_id), 1, 5)) as handle,
         b.best as score
  from (
    select r.user_id, max(r.score) as best, min(r.finished_at) as first_at
    from sq_runs r
    where r.status = 'finished' and (p_since is null or r.finished_at >= p_since)
    group by r.user_id
  ) b
  join sq_players p on p.user_id = b.user_id
  where not p.banned
  order by b.best desc, b.first_at asc
  limit least(greatest(p_limit, 1), 100);
$$;

create or replace function sq_admin_overview() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'players', (select count(*) from sq_players),
    'banned', (select count(*) from sq_players where banned),
    'runs_today', (select count(*) from sq_runs where started_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'),
    'rejected_today', (select count(*) from sq_runs where status = 'rejected' and started_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'),
    'open_flags', (select count(*) from sq_flags where status = 'open'),
    'cheese_in_circulation', (select coalesce(sum(cheese), 0) from sq_players),
    'points_issued', (select coalesce(sum(delta), 0) from sq_ledger where kind = 'points' and delta > 0),
    'points_outstanding', (select coalesce(sum(points), 0) from sq_players)
  );
$$;

-- Lock every sq_ function away from the public API (service role only)
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'sq\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;

-- ---------- STARTER DATA (edit in the admin routes later) ----------
insert into sq_shop_items (key, kind, name, description, price_cheese, sort) values
  ('hat_cap',       'hat',   'Street Cap',     'A plain black cap.',            300, 10),
  ('skin_bandana',  'skin',  'Red Bandana',    'The classic look.',             500, 20),
  ('trail_cheese',  'trail', 'Cheese Trail',   'Leaves cheese behind you.',     800, 30),
  ('skin_gold',     'skin',  'Gold Chain',     'Heavy chain, heavier swagger.', 2000, 40),
  ('boost_magnet',  'boost', 'Cheese Magnet',  'Pulls in nearby cheese for one run.', 150, 50)
on conflict (key) do nothing;

insert into sq_missions (key, title, description, metric, target, reward_cheese, reward_points, period, sort) values
  ('first_run',  'First run',        'Finish your first run.',       'runs',  1,   100, 5,  'once',   1),
  ('daily_runs', 'Play 3 runs',      'Finish 3 runs today.',         'runs',  3,   30,  2,  'daily',  10),
  ('daily_score','Score 500',        'Reach 500 in a single run.',   'score', 500, 50,  3,  'daily',  20),
  ('weekly_runs','Play 30 runs',     'Finish 30 runs this week.',    'runs',  30,  300, 20, 'weekly', 30)
on conflict (key) do nothing;
