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
