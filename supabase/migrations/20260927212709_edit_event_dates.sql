create or replace function public.bima_update_event_dates(
  p_event_id uuid,
  p_dates jsonb,
  p_reopen_confirmed boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event public.bima_events%rowtype;
  v_item jsonb;
  v_date_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_previous_start timestamptz;
  v_previous_end timestamptz;
  v_position integer := 0;
  v_keep_ids uuid[] := array[]::uuid[];
  v_invalidated_votes integer := 0;
  v_deleted_votes integer := 0;
begin
  if p_dates is null
    or jsonb_typeof(p_dates) <> 'array'
    or jsonb_array_length(p_dates) < 1
    or jsonb_array_length(p_dates) > 4 then
    raise exception 'Une sortie doit conserver entre 1 et 4 dates.';
  end if;

  select *
  into v_event
  from public.bima_events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Cette sortie n’existe pas.';
  end if;

  if v_event.confirmed_date_id is not null and not p_reopen_confirmed then
    raise exception 'La sortie confirmée doit être rouverte avant de modifier ses dates.';
  end if;

  -- Free the unique (event_id, position) slots before applying the new order.
  update public.bima_date_options
  set position = position + 1000
  where event_id = p_event_id;

  for v_item in select value from jsonb_array_elements(p_dates)
  loop
    v_start := (v_item ->> 'startsAt')::timestamptz;
    v_end := nullif(v_item ->> 'endsAt', '')::timestamptz;

    if nullif(v_item ->> 'id', '') is not null then
      v_date_id := (v_item ->> 'id')::uuid;

      select starts_at, ends_at
      into v_previous_start, v_previous_end
      from public.bima_date_options
      where id = v_date_id and event_id = p_event_id;

      if not found then
        raise exception 'Une des dates n’appartient pas à cette sortie.';
      end if;

      if v_date_id = any(v_keep_ids) then
        raise exception 'Une même date ne peut pas être envoyée deux fois.';
      end if;

      if v_previous_start is distinct from v_start or v_previous_end is distinct from v_end then
        select count(*)::integer
        into v_deleted_votes
        from public.bima_date_votes
        where date_option_id = v_date_id;

        v_invalidated_votes := v_invalidated_votes + v_deleted_votes;

        delete from public.bima_date_votes
        where date_option_id = v_date_id;
      end if;

      update public.bima_date_options
      set position = v_position,
          starts_at = v_start,
          ends_at = v_end
      where id = v_date_id and event_id = p_event_id;
    else
      v_date_id := extensions.gen_random_uuid();

      insert into public.bima_date_options (id, event_id, position, starts_at, ends_at)
      values (v_date_id, p_event_id, v_position, v_start, v_end);
    end if;

    v_keep_ids := array_append(v_keep_ids, v_date_id);
    v_position := v_position + 1;
  end loop;

  select count(*)::integer
  into v_deleted_votes
  from public.bima_date_votes as vote
  join public.bima_date_options as option on option.id = vote.date_option_id
  where option.event_id = p_event_id
    and not (option.id = any(v_keep_ids));

  v_invalidated_votes := v_invalidated_votes + v_deleted_votes;

  delete from public.bima_date_options
  where event_id = p_event_id
    and not (id = any(v_keep_ids));

  update public.bima_events
  set confirmed_date_id = case when p_reopen_confirmed then null else confirmed_date_id end,
      updated_at = now()
  where id = p_event_id;

  return jsonb_build_object(
    'invalidatedVotes', v_invalidated_votes,
    'reopened', v_event.confirmed_date_id is not null and p_reopen_confirmed
  );
end;
$$;

revoke all on function public.bima_update_event_dates(uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.bima_update_event_dates(uuid, jsonb, boolean) to service_role;

comment on function public.bima_update_event_dates(uuid, jsonb, boolean) is
  'Atomically adds, edits, reorders, or deletes event dates. Votes are invalidated only for edited or deleted dates.';
