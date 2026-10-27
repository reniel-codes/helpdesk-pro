-- HelpDesk Pro: Row Level Security (who can see and change which rows).
-- This is the REAL security layer. The React UI only hides buttons for convenience.
--
-- Note: we write (select auth.uid()) instead of auth.uid() so Postgres evaluates
-- it once per query instead of once per row. Same result, faster.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- The logged-in user's role, or null when not logged in.
-- security definer lets it read profiles without triggering profiles' own RLS
-- (which would otherwise loop forever).
create function public.get_my_role()
returns public.user_role
language sql
stable
security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce(public.get_my_role() in ('admin', 'it_staff'), false)
$$;

-- ---------------------------------------------------------------------------
-- Turn RLS on. With RLS on and no matching policy, access is DENIED by default.
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.assets       enable row level security;
alter table public.tickets      enable row level security;
alter table public.ticket_notes enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Everyone sees their own profile and staff profiles (so employees can see who
-- is handling their ticket). Staff see everyone.
create policy "profiles: read own, staff, or all if staff"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or role in ('admin', 'it_staff')
    or public.is_staff()
  );

-- Only admins can edit profiles (including roles). This blocks self-promotion.
create policy "profiles: admins update"
  on public.profiles for update to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- No insert policy: profiles are created only by the handle_new_user trigger.
-- No delete policy: profiles are removed when the auth user is deleted.

-- ---------------------------------------------------------------------------
-- tickets
-- ---------------------------------------------------------------------------
create policy "tickets: read own or all if staff"
  on public.tickets for select to authenticated
  using (created_by = (select auth.uid()) or public.is_staff());

-- Anyone can file a ticket as themselves. Employees must file it as an
-- unassigned 'open' ticket; staff can set any status or assignee.
create policy "tickets: create as self"
  on public.tickets for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (public.is_staff() or (status = 'open' and assigned_to is null))
  );

create policy "tickets: staff update"
  on public.tickets for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "tickets: admins delete"
  on public.tickets for delete to authenticated
  using (public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- ticket_notes
-- ---------------------------------------------------------------------------
-- Staff see all notes. Employees see public notes on their own tickets only.
create policy "notes: read"
  on public.ticket_notes for select to authenticated
  using (
    public.is_staff()
    or (
      not is_internal
      and exists (
        select 1 from public.tickets t
        where t.id = ticket_id and t.created_by = (select auth.uid())
      )
    )
  );

-- Staff can add any note. Employees can add public notes to their own tickets.
create policy "notes: create as self"
  on public.ticket_notes for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      public.is_staff()
      or (
        not is_internal
        and exists (
          select 1 from public.tickets t
          where t.id = ticket_id and t.created_by = (select auth.uid())
        )
      )
    )
  );

-- No update/delete policies: notes are an append-only history.

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------
create policy "assets: read own or all if staff"
  on public.assets for select to authenticated
  using (assigned_to = (select auth.uid()) or public.is_staff());

create policy "assets: staff create"
  on public.assets for insert to authenticated
  with check (public.is_staff());

create policy "assets: staff update"
  on public.assets for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "assets: admins delete"
  on public.assets for delete to authenticated
  using (public.get_my_role() = 'admin');
