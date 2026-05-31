# Release Notes — v1.7.0

**Date:** 2026-05-31
**Type:** Minor — portfolio value history chart

## Summary

New "Portfolio Value Over Time" section at the top of the Analytics tab.
Shows an area chart of total portfolio value across time with range tabs
(All / 1Y / YTD / 6M / 1M), a stats panel (starting/ending value, total
return), and an institution breakdown with mini-charts and per-account tables.

An account selector dropdown (grouped by institution) lets users include or
exclude individual accounts; the chart updates instantly without re-fetching.
Backfilled (estimated) data is visually distinguished from real nightly
snapshots via a shaded region and a "Tracking began" reference line.

To start collecting history, open Accounts, enable "Include in portfolio value
history snapshot" on each account to track, then visit Analytics and run a
backfill.

## Deployment

```bash
git tag v1.7.0
git push origin main --tags
```

---

# Release Notes — v1.6.0

**Date:** 2026-05-27
**Type:** Minor — custom profile photo upload

## Summary

Users can now upload a custom profile photo from the Profile & Settings page.
Selecting a file shows an instant preview before committing. Saving uploads to
the API, which stores the image in Supabase Storage and returns a public URL.
The avatar in the app header (mobile and desktop) updates immediately and
persists across page reloads and fresh logins via an AuthContext startup fetch.

## Deployment

```bash
git tag v1.6.0
git push origin main --tags
```

---

# Release Notes — v1.5.0

**Date:** 2026-05-24
**Type:** Minor — import history retention UI + grouped history display

## Summary

Adds an Import History Retention setting on the Profile page (admin/user roles).
Users pick a limit (10 / 25 / 50 / 100 / Unlimited) and click "Save & Apply" to
enforce it immediately; the API purges excess records while always keeping the
most-recent per account. Auto-purge also fires after each import.

The Import page history section is redesigned: grouped collapsible rows per account,
with the account's financial institution in the header, import count, and last import
date visible without expanding. Detail rows show import method (full name, not short
code), row count, positions-as-of date, and imported-at timestamp.

Also fixes four Ant Design v6 console warnings and the Admin notification settings
"useForm not connected" warning.

## Deployment

```bash
git tag v1.5.0
git push origin main --tags
```

---

# Release Notes — v1.4.3

**Date:** 2026-05-24
**Type:** Patch — Analytics tab 403 fix

## Summary

Fixes a bug where clicking the Analytics tab on the Dashboard while one or more
shared portfolio tabs are present triggered a spurious API call:
`GET /api/v1/shares/analytics/dashboard` → 403 Forbidden.

The `onChange` handler for the Tabs component was calling `loadSharedDashboard(key)`
for any tab key that wasn't `'mine'`, but `'analytics'` is a local tab key, not a
user ID. Added `&& key !== 'analytics'` to the guard condition.

## Deployment

```bash
git tag v1.4.3
git push origin main --tags
```

---

# Release Notes — v1.4.2

**Date:** 2026-05-22
**Type:** Patch — import spinner overlay fix

## Summary

Fixes the file upload spinner blocking re-clicks after a cancelled file picker.
The spinner is now rendered inside the Dragger content area rather than as an
Ant Design Spin overlay. An overlay intercepts pointer events, so clicking the
Dragger while spinning did nothing — users had to click Back to recover. With the
spinner inside the Dragger, clicks always reach the Dragger and re-open the file
picker normally.

## Deployment

```bash
git tag v1.4.2
git push origin main --tags
```

---

# Release Notes — v1.4.1

**Date:** 2026-05-22
**Type:** Patch — import file upload UX improvements

## Summary

After selecting a file on the Import page, the Dragger area is now replaced by a
clearly visible gold-bordered card showing the filename and file size, with a
remove button to swap the file. A spinner with "Loading file..." text appears
during the brief moment between file selection and the card appearing.

## Deployment

```bash
git tag v1.4.1
git push origin main --tags
```

---

# Release Notes — v1.4.0

**Date:** 2026-05-22
**Type:** Minor — pluggable importer registry (admin + user UI)

## Summary

Client-side changes accompanying the API v1.3.0 importer registry feature.

Admin page gains a new **Importers** section: a table listing all registered
importers with Edit and Register Importer actions. Admins can update display names,
descriptions, and multi-line usage instructions without touching code.

Profile page gains a new **Import Sources** section: users toggle which optional
importers (LPL Financial CSV, CFCU CSV, future additions) appear on their Import
page. Default importers (OFX/QFX, Manual Entry) show a locked always-on indicator.
Each importer row has a collapsible "How to generate this file" panel showing the
step-by-step instructions managed by admins.

Import page importer info alert now includes the same collapsible instructions
panel. Filtering of the importer dropdown now happens server-side based on user
preferences — the client no longer needs to filter locally.

## Deployment

```bash
git tag v1.4.0
git push origin main --tags
```

---

# Release Notes — v1.3.0

**Date:** 2026-05-21
**Type:** Minor — PWA support, private stock entry, bug fixes

## Summary

Adds Progressive Web App support so the app can be installed as a home screen
icon on iOS and Android. Includes the full pTracker branded icon set (all sizes
+ maskable variants) and App Store screenshots for the rich install dialog.

Adds private/unlisted stock mode to manual entry — lets users record physical
stock certificates or OTC stocks by entering ticker, company name, shares, price
per share, and cost basis per share directly, bypassing Yahoo Finance entirely.

Fixes a critical login bug where the 401 Axios interceptor triggered a full page
reload on failed login attempts, wiping the error message and form fields before
the user could read them. Error messaging is also improved with friendlier copy.

Fixes the Profile page showing Portfolio Sharing to viewer-role users (who have
no portfolio to share), and fixes pie chart label clipping on the Analytics page.

## Deployment

```bash
git tag v1.3.0
git push origin main --tags
```

---

# Release Notes — v1.2.2

**Date:** 2026-05-21
**Type:** Patch — Admin page mobile overflow fix

## Summary

Admin page Users and Role Requests tables now have `scroll={{ x }}` set so
they scroll horizontally on narrow screens instead of overflowing off the right edge.

## Deployment

```bash
git tag v1.2.2
git push origin main --tags
```

---

# Release Notes — v1.2.2

**Date:** 2026-05-21
**Type:** Patch — Admin page mobile layout

## Summary

Admin Users section now renders as a responsive card list on mobile (< md breakpoint)
instead of a cramped overflowing table. Each card shows name, email, role badge,
role change select, and delete button. Role Requests table gets horizontal scroll.

## Deployment

```bash
git tag v1.2.2
git push origin main --tags
```

---

# Release Notes — v1.2.1

**Date:** 2026-05-21
**Type:** Patch — force dark mode on all devices

## Summary

Fixes invisible content on iOS/iPadOS devices set to Light mode. The app uses
hardcoded dark colors throughout, so the light theme produced white text on white
cards. Dark theme is now always applied regardless of OS color scheme preference.

## Deployment

```bash
git tag v1.2.1
git push origin main --tags
```

---

# Release Notes — v1.2.0

**Date:** 2026-05-21
**Type:** Minor — footer with version info + closeable notifications

## Summary

Adds a footer to the desktop layout with the tagline "Private portfolio tracking
across all your accounts. No ads, no data sharing." on the left and live Client /
API version numbers on the right (API version fetched from `GET /api/v1/version`).

Switches all toast notifications from Ant Design's `message` API to the
`notification` API, which has a proper built-in close button and 8-second
default duration. All pages share a single `useMessage` hook for consistency.

## Deployment

```bash
git tag v1.2.0
git push origin main --tags
```

---

# Release Notes — v1.1.0

**Date:** 2026-05-21
**Type:** Minor — manual entry fund/stock mode

## Summary

Manual entry on the Import page now supports two modes via a Radio toggle:

- **Cash Balance** — existing behavior; filters to checking/savings/other accounts
- **Fund / Stock** — new; filters to brokerage/retirement accounts; ticker autocomplete
  via Yahoo Finance search; market value input; API back-calculates shares from current price

Also fixes the `AuthContext` import case (was `authContext`) which caused the Linux Docker
build to fail, and rewrites `importService.manualEntry` to correctly send `mode` and structured
fields to the API.

## Deployment

```bash
git tag v1.1.0
git push origin main --tags
```

The workflow bakes `VITE_*` environment variables into the bundle at build time.

---

# Release Notes — v1.0.0

**Date:** 2026-05-21
**Type:** Initial production release

## Summary

First production release of the portfolioTraker React client. Full-featured
investment portfolio dashboard with auth, accounts, import, watchlist, admin,
portfolio sharing, and analytics charts.

## Deployment

Deploy via GitHub Actions tag push:
```bash
git tag v1.0.0
git push origin main --tags
```

The workflow bakes `VITE_*` environment variables into the bundle at build time.
These must be set as GitHub Actions secrets before tagging:
- `VITE_API_URL=https://api.ptraker.com/api/v1`
- `VITE_SUPABASE_URL=https://supabase.ptraker.com`
- `VITE_SUPABASE_ANON_KEY` — production anon key
