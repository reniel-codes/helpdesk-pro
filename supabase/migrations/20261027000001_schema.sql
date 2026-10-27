-- HelpDesk Pro: tables, enums, triggers, indexes.
-- Security rules (RLS) live in the next migration.

-- ---------------------------------------------------------------------------
-- Enums: fixed lists of allowed values. The database rejects anything else.
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'it_staff', 'employee');
create type public.ticket_status as enum ('open', 'in_progress', 'on_hold', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'critical');
create type public.ticket_category as enum ('hardware', 'software', 'network', 'account_access', 'other');
create type public.asset_type as enum ('laptop', 'desktop', 'monitor', 'printer', 'phone', 'peripheral', 'other');
create type public.asset_condition as enum ('new', 'good', 'fair', 'needs_repair', 'retired');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per user, sharing the id of the Supabase auth user.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  full_name   text not null default '',
  role        public.user_role not null default 'employee',
  department  text,
  created_at  timestamptz not null default now()
);

create table public.assets (
  id             bigint generated always as identity primary key,
  asset_tag      text not null unique,
  type           public.asset_type not null,
  brand          text,
  model          text,
  serial_number  text not null unique,
  assigned_to    uuid references public.profiles (id) on delete set null,
  condition      public.asset_condition not null default 'good',
  purchase_date  date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.tickets (
  id           bigint generated always as identity primary key,
  title        text not null check (char_length(title) between 5 and 120),
  description  text not null check (char_length(description) between 1 and 5000),
  category     public.ticket_category not null default 'other',
  priority     public.ticket_priority not null default 'medium',
  status       public.ticket_status not null default 'open',
  created_by   uuid not null references public.profiles (id) on delete restrict,
  assigned_to  uuid references public.profiles (id) on delete set null,
  asset_id     bigint references public.assets (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

-- Notes are an append-only log: no edits or deletes in the MVP.
create table public.ticket_notes (
  id           bigint generated always as identity primary key,
  ticket_id    bigint not null references public.tickets (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete restrict,
  body         text not null check (char_length(body) between 1 and 5000),
  is_internal  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the columns we filter and join on most.
-- ---------------------------------------------------------------------------
create index tickets_status_idx      on public.tickets (status);
create index tickets_priority_idx    on public.tickets (priority);
create index tickets_created_by_idx  on public.tickets (created_by);
create index tickets_assigned_to_idx on public.tickets (assigned_to);
create index ticket_notes_ticket_idx on public.ticket_notes (ticket_id);
create index assets_assigned_to_idx  on public.assets (assigned_to);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create a profile automatically when someone is added in Supabase Auth.
-- The role is ALWAYS 'employee' here; only an admin can promote someone later.
-- (We never read the role from user metadata, because users can edit that.)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current on every edit.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

-- Business rules for tickets:
--   1. Only IT staff or admins can be assignees.
--   2. resolved_at is stamped when a ticket becomes 'resolved',
--      and cleared if it is reopened.
create function public.validate_ticket()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.assigned_to is not null and not exists (
    select 1 from public.profiles
    where id = new.assigned_to and role in ('admin', 'it_staff')
  ) then
    raise exception 'Tickets can only be assigned to IT staff or admins';
  end if;

  if new.status = 'resolved' and (tg_op = 'INSERT' or old.status <> 'resolved') then
    new.resolved_at = now();
  elsif new.status in ('open', 'in_progress', 'on_hold') then
    new.resolved_at = null;
  end if;

  return new;
end;
$$;

create trigger tickets_validate
  before insert or update on public.tickets
  for each row execute function public.validate_ticket();
