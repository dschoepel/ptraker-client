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
