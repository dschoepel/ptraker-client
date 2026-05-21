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
