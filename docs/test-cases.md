# Manual Test Cases

Run these in the browser before each release and record the result.
**Result:** ✅ Pass · ❌ Fail (link a bug report) · ⏭️ Skipped

| | |
|---|---|
| **Build / commit** | _fill in (`git log --oneline -1`)_ |
| **Tester** | Reniel Perez |
| **Date run** | _YYYY-MM-DD_ |
| **Browser** | _e.g. Chrome 140, Windows 11_ |

## Authentication

| ID | Role | Steps | Expected result | Result |
|---|---|---|---|---|
| TC-AUTH-01 | — | Open `/tickets` while logged out | Redirected to the login page | |
| TC-AUTH-02 | — | Click **Sign in** with both fields empty | "Email is required." and "Password is required." shown; no request sent | |
| TC-AUTH-03 | — | Enter `notanemail` and any password, sign in | "Enter a valid email address." | |
| TC-AUTH-04 | Employee | Correct email, wrong password | "Invalid email or password." Stays on login page | |
| TC-AUTH-05 | — | Unknown email `nobody@helpdesk.test` | Same message as TC-AUTH-04 (does not reveal whether the account exists) | |
| TC-AUTH-06 | Employee | Log in from `/login` after TC-AUTH-01 | Lands on `/tickets` (the page originally requested) | |
| TC-AUTH-07 | Any | Log in, then refresh the page | Still logged in | |
| TC-AUTH-08 | Any | Click **Sign out** | Returned to login; pressing Back does not show app pages | |

## Navigation and access

| ID | Role | Steps | Expected result | Result |
|---|---|---|---|---|
| TC-NAV-01 | Admin | Look at the top menu | Dashboard, Tickets, Assets, Users | |
| TC-NAV-02 | IT Staff | Look at the top menu | Dashboard, Tickets, Assets (no Users) | |
| TC-NAV-03 | Employee | Look at the top menu | Dashboard, My Tickets, My Assets | |
| TC-NAV-04 | Employee | Type `/users` in the address bar | "Access denied" | |
| TC-NAV-05 | Any | Open `/does-not-exist` | "Page not found" with a link to the dashboard | |

## Creating tickets

| ID | Role | Steps | Expected result | Result |
|---|---|---|---|---|
| TC-TKT-01 | Employee | Tickets → **New ticket** → submit empty form | "Title is required." and "Description is required." | |
| TC-TKT-02 | Employee | Title `Help` (4 chars), any description | "Title must be at least 5 characters." | |
| TC-TKT-03 | Employee | Title of exactly 5 characters, valid description | Ticket is created | |
| TC-TKT-04 | Employee | Try to type more than 120 characters in Title | Input stops at 120 characters | |
| TC-TKT-05 | Employee | Valid title, description with several lines, Category = Software, Priority = High → Create | Opens the new ticket; status **Open**, priority **High**, **Unassigned**; line breaks preserved | |
| TC-TKT-06 | Employee | Click **Create ticket** twice quickly | Only one ticket is created (button disables while saving) | |

## Viewing tickets

| ID | Role | Steps | Expected result | Result |
|---|---|---|---|---|
| TC-TKT-07 | Employee | Open My Tickets | Only tickets this employee created; no Requester column | |
| TC-TKT-08 | IT Staff | Open Tickets | All tickets, including the employee's; Requester column shown | |
| TC-TKT-09 | Employee | Note the ID of a ticket created by IT Staff, open `/tickets/<that id>` | "Ticket not found" (no hint that it exists) | |
| TC-TKT-10 | Any | Open `/tickets/abc` and `/tickets/999999` | "Ticket not found" for both | |

## Managing tickets (staff)

| ID | Role | Steps | Expected result | Result |
|---|---|---|---|---|
| TC-TKT-11 | Employee | Open own ticket | No **Manage** panel | |
| TC-TKT-12 | IT Staff | Open a ticket without changing anything | **Save changes** is disabled | |
| TC-TKT-13 | IT Staff | Assign to yourself, set status **In Progress** → Save | Details show new assignee and status; "Last updated" changes | |
| TC-TKT-14 | IT Staff | Set status **Resolved** → Save | "Resolved" date appears in Details | |
| TC-TKT-15 | IT Staff | Change a Resolved ticket back to **In Progress** → Save | "Resolved" date disappears | |
| TC-TKT-16 | Employee | After TC-TKT-13, view the ticket list | Shows new status and assignee | |

## Notes

| ID | Role | Steps | Expected result | Result |
|---|---|---|---|---|
| TC-NOTE-01 | Any | Click **Add note** with an empty box | "Note cannot be empty." | |
| TC-NOTE-02 | IT Staff | Add a public note | Note appears immediately with name and "IT Staff" | |
| TC-NOTE-03 | IT Staff | Tick **Internal note**, add a note | Note appears with yellow background and **Internal** badge | |
| TC-NOTE-04 | Employee | Open the same ticket | Sees the public note, **not** the internal one | |
| TC-NOTE-05 | Employee | Look for the internal-note checkbox | Not shown | |
| TC-NOTE-06 | Employee | Add a reply | Reply appears; staff can see it | |

## Layout

| ID | Role | Steps | Expected result | Result |
|---|---|---|---|---|
| TC-UI-01 | Any | Narrow the browser to phone width (~375px) on the ticket list | Table scrolls sideways inside its box; page itself does not scroll sideways | |
| TC-UI-02 | Any | Phone width on a ticket detail page | Details and Manage panels stack below the description | |
| TC-UI-03 | Any | Create a ticket with a very long word (60+ characters, no spaces) in the title | Title wraps; layout does not break | |

## Summary

| Total | Pass | Fail | Skipped |
|---|---|---|---|
| 38 | | | |
