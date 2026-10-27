# BUG-001: Asset "Edit" links announced without a space ("EditLAP-0001")

| | |
|---|---|
| **Severity** | Low (accessibility) |
| **Status** | Fixed |
| **Found by** | Automated test: `AssetsPage.test.tsx` › "shows staff the inventory with condition, assignee, and edit links" |
| **Found on** | 2026-10-27 |
| **Environment** | Vitest + jsdom (before the feature was committed) |
| **Logged in as** | IT Staff |

## Steps to reproduce

1. Log in as IT Staff and open **Assets** with at least one asset.
2. Inspect the accessible name of an **Edit** link (Chrome DevTools → Elements → Accessibility pane, or a screen reader).

## Expected result

Each link's accessible name is "Edit" followed by the asset tag, e.g. **"Edit LAP-0001"**,
so screen-reader users can tell the links apart.

## Actual result

The name was **"EditLAP-0001"**, with the words run together, so a screen reader reads it as one garbled word.

## Evidence

```
TestingLibraryElementError: Unable to find an accessible element with the role "link" and name "Edit MON-0002"
...
Name "EditMON-0002":
<a href="/assets/2/edit" />
```

## Root cause

The link text was built from visible text plus visually hidden text:
`Edit<span className="sr-only"> {asset.asset_tag}</span>`. The leading space inside the
hidden span did not survive into the computed accessible name.

## Fix

Give the link an explicit `aria-label={`Edit ${asset.asset_tag}`}` instead of relying on
hidden text. The accessible name is now set in one place and can't lose its spacing.
The test that found the bug now passes and guards against regressions.

**Lesson:** querying elements by role and accessible name (`getByRole('link', { name })`)
makes component tests double as accessibility checks.
