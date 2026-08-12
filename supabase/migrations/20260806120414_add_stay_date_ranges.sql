alter table public.bima_events
  add column if not exists event_type text not null default 'outing';

alter table public.bima_date_options
  add column if not exists ends_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bima_events_event_type_check'
      and conrelid = 'public.bima_events'::regclass
  ) then
    alter table public.bima_events
      add constraint bima_events_event_type_check
      check (event_type in ('outing', 'stay'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bima_date_options_valid_range'
      and conrelid = 'public.bima_date_options'::regclass
  ) then
    alter table public.bima_date_options
      add constraint bima_date_options_valid_range
      check (ends_at is null or ends_at >= starts_at);
  end if;
end $$;

comment on column public.bima_events.event_type is
  'outing keeps the historical single date/time flow; stay enables inclusive date ranges.';

comment on column public.bima_date_options.ends_at is
  'Inclusive end of a stay proposal. Null for historical outings.';
