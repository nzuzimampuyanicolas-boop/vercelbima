create table if not exists public.bima_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1),
  expires_at timestamptz not null
);

comment on table public.bima_rate_limits is
  'Compteurs techniques temporaires utilises par l Edge Function BIMA pour limiter les abus.';

alter table public.bima_rate_limits enable row level security;

revoke all on table public.bima_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.bima_rate_limits to service_role;

create index if not exists idx_bima_rate_limits_expires_at
  on public.bima_rate_limits (expires_at);

create or replace function public.bima_consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval;
  v_counter public.bima_rate_limits%rowtype;
begin
  if p_bucket is null or length(p_bucket) < 16 or length(p_bucket) > 128 then
    raise exception 'Invalid rate-limit bucket';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'Invalid rate-limit maximum';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit window';
  end if;

  v_window := make_interval(secs => p_window_seconds);

  insert into public.bima_rate_limits as limits (
    bucket,
    window_started_at,
    request_count,
    expires_at
  )
  values (
    p_bucket,
    v_now,
    1,
    v_now + v_window
  )
  on conflict (bucket) do update
  set
    window_started_at = case
      when limits.window_started_at + v_window <= v_now then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at + v_window <= v_now then 1
      else limits.request_count + 1
    end,
    expires_at = case
      when limits.window_started_at + v_window <= v_now then v_now + v_window
      else limits.window_started_at + v_window
    end
  returning limits.* into v_counter;

  allowed := v_counter.request_count <= p_limit;
  remaining := greatest(p_limit - v_counter.request_count, 0);
  retry_after := case
    when allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (v_counter.window_started_at + v_window - v_now)))::integer
    )
  end;

  if random() < 0.01 then
    delete from public.bima_rate_limits
    where expires_at < v_now - interval '1 day';
  end if;

  return next;
end;
$$;

comment on function public.bima_consume_rate_limit(text, integer, integer) is
  'Incremente atomiquement un compteur temporaire. Reserve au service_role utilise par bima-api.';

revoke execute on function public.bima_consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.bima_consume_rate_limit(text, integer, integer)
  to service_role;
