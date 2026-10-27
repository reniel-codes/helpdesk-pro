# Permission Matrix

What each role is allowed to do. These rules are enforced by **Row Level Security (RLS)
policies in the database** ([`supabase/migrations/20261027000002_rls.sql`](../supabase/migrations/20261027000002_rls.sql)).
The UI hides links and buttons to match, but that is only for convenience — the database
is the real gatekeeper.

The key rules below (mainly the ❌ cells) are checked by automated tests in [`tests/rls/rls.test.ts`](../tests/rls/rls.test.ts).

## Roles

| Role | Who | Summary |
|---|---|---|
| **Employee** | Regular staff member | Reports problems and follows their own tickets |
| **IT Staff** | Support technician | Works on all tickets and manages the asset inventory |
| **Admin** | IT manager | Everything IT Staff can do, plus delete records and manage user roles |

## Tickets

| Action | Employee | IT Staff | Admin |
|---|:-:|:-:|:-:|
| View tickets | Own only | All | All |
| Create a ticket (as themselves) | ✅ | ✅ | ✅ |
| Create a ticket already assigned or not `open` | ❌ | ✅ | ✅ |
| Create a ticket on behalf of another user | ❌ | ❌ | ❌ |
| Change status, priority, assignee | ❌ | ✅ | ✅ |
| Delete a ticket | ❌ | ❌ | ✅ |

## Ticket notes

| Action | Employee | IT Staff | Admin |
|---|:-:|:-:|:-:|
| View public notes | On own tickets | All | All |
| View internal notes | ❌ | ✅ | ✅ |
| Add a public note | On own tickets | ✅ | ✅ |
| Add an internal note | ❌ | ✅ | ✅ |
| Post a note as another user | ❌ | ❌ | ❌ |
| Edit or delete a note | ❌ | ❌ | ❌ |

Notes are an append-only history: once written they cannot be changed by anyone.

## Assets

| Action | Employee | IT Staff | Admin |
|---|:-:|:-:|:-:|
| View assets | Assigned to them only | All | All |
| Create / edit / assign assets | ❌ | ✅ | ✅ |
| Delete an asset | ❌ | ❌ | ✅ |

## Profiles (users)

| Action | Employee | IT Staff | Admin |
|---|:-:|:-:|:-:|
| View own profile | ✅ | ✅ | ✅ |
| View IT Staff and Admin profiles | ✅ | ✅ | ✅ |
| View other employees' profiles | ❌ | ✅ | ✅ |
| Change anyone's role or profile | ❌ | ❌ | ✅ |

Employees can see staff profiles so they know who is handling their ticket.

## Logged-out visitors

Cannot read or change anything. Public sign-up is disabled; accounts are created by an admin.

## Business rules (enforced by database triggers and constraints)

| Rule | Where |
|---|---|
| New users always start as **Employee** (role is never taken from sign-up data) | `handle_new_user` trigger |
| Tickets can only be assigned to IT Staff or Admins | `validate_ticket` trigger |
| `resolved_at` is set when a ticket becomes `resolved`, cleared if reopened | `validate_ticket` trigger |
| Ticket title must be 5–120 characters | `CHECK` constraint |
| Asset tag and serial number must be unique | `UNIQUE` constraints |
