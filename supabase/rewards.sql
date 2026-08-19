create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action text not null,
  amount integer not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, action, dedupe_key)
);

create index if not exists coin_transactions_user_created_idx
  on public.coin_transactions (user_id, created_at);

create table if not exists public.coin_action_rewards (
  action text primary key,
  amount integer not null check (amount > 0)
);

insert into public.coin_action_rewards (action, amount) values
  ('plan_created', 100), ('friend_invited', 150), ('plan_joined', 30), ('comment_added', 20), ('message_sent', 10)
on conflict (action) do update set amount = excluded.amount;

create table if not exists public.reward_catalog (
  id text primary key,
  title text not null,
  kind text not null check (kind in ('code', 'booking', 'pickup')),
  cost integer not null check (cost > 0)
);

insert into public.reward_catalog (id, title, kind, cost) values
  ('shu', 'Скидка 15% SHU', 'code', 500),
  ('slot', 'Слот на забег', 'booking', 800),
  ('tee', 'Футболка WWW', 'pickup', 1500),
  ('bottle', 'Бутылка WWW', 'pickup', 2000),
  ('marathon', 'Слот на марафон', 'booking', 6000)
on conflict (id) do update set title = excluded.title, kind = excluded.kind, cost = excluded.cost;

create table if not exists public.claimed_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  reward_id text not null,
  title text not null,
  code text not null unique,
  kind text not null check (kind in ('code', 'booking', 'pickup')),
  claimed_at timestamptz not null default now(),
  unique (user_id, reward_id)
);

create index if not exists claimed_rewards_user_claimed_idx
  on public.claimed_rewards (user_id, claimed_at desc);

create or replace function public.award_coins(
  p_user_id text,
  p_action text,
  p_dedupe_key text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  action_amount integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id));
  select amount into action_amount from public.coin_action_rewards where action = p_action;
  if action_amount is null then raise exception 'unknown_coin_action'; end if;
  insert into public.coin_transactions (user_id, action, amount, dedupe_key)
  values (p_user_id, p_action, action_amount, p_dedupe_key)
  on conflict (user_id, action, dedupe_key) do nothing;
  return coalesce((select sum(amount)::integer from public.coin_transactions where user_id = p_user_id), 0);
end;
$$;

create or replace function public.redeem_reward(
  p_user_id text,
  p_reward_id text,
  p_code text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
  reward_claimed_at timestamptz;
  catalog_reward public.reward_catalog%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id));
  select * into catalog_reward from public.reward_catalog where id = p_reward_id;
  if catalog_reward.id is null then raise exception 'unknown_reward'; end if;
  select claimed_at into reward_claimed_at from public.claimed_rewards
    where user_id = p_user_id and reward_id = p_reward_id;
  current_balance := coalesce((select sum(amount)::integer from public.coin_transactions where user_id = p_user_id), 0);
  if reward_claimed_at is not null then
    return jsonb_build_object(
      'balance', current_balance,
      'claimed_at', reward_claimed_at,
      'code', (select code from public.claimed_rewards where user_id = p_user_id and reward_id = p_reward_id)
    );
  end if;
  if current_balance < catalog_reward.cost then
    raise exception 'insufficient_balance';
  end if;
  insert into public.claimed_rewards (user_id, reward_id, title, code, kind)
    values (p_user_id, p_reward_id, catalog_reward.title, p_code, catalog_reward.kind)
    returning claimed_at into reward_claimed_at;
  insert into public.coin_transactions (user_id, action, amount, dedupe_key)
    values (p_user_id, 'reward_redeemed', -catalog_reward.cost, p_reward_id);
  return jsonb_build_object('balance', current_balance - catalog_reward.cost, 'claimed_at', reward_claimed_at, 'code', p_code);
end;
$$;

grant select on public.coin_transactions, public.claimed_rewards, public.coin_action_rewards, public.reward_catalog to anon, authenticated;
grant execute on function public.award_coins(text, text, text) to anon, authenticated;
grant execute on function public.redeem_reward(text, text, text) to anon, authenticated;
