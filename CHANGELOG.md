# Changelog

All notable changes to ptraker-client are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [1.1.0] — 2026-05-21

### Added
- Manual entry now supports two modes via Radio toggle: **Cash Balance** (checking/savings/other accounts) and **Fund / Stock** (brokerage/retirement accounts)
- Fund/Stock mode: ticker autocomplete via Yahoo Finance search, market value input, cost basis, as-of date; API back-calculates shares from current price

### Fixed
- `import { AuthProvider } from "./store/AuthContext"` — corrected case for Linux case-sensitive filesystem (was `authContext`)
- `importService.manualEntry` signature rewritten to match API contract (`mode`, `fields` object)

---

## [1.0.0] — 2026-05-21

### Added
- Initial production release
- Auth: login, password reset, invite acceptance, set-password flow
- Dashboard: net worth summary cards, portfolio table, account breakdown
- Dashboard: Analytics tab — institution donut/bar chart, account type donut, cash bar chart
- Dashboard: portfolio sharing — view shared portfolios in separate tabs
- Accounts: list with totals, create/edit/delete, mobile card + desktop table layout
- Import: file upload (LPL CSV, OFX/QFX, CFCU CSV) and manual entry
- Import: multi-account importer with per-account match/breakdown results
- Import: history log with status and row counts
- Positions: delete individual positions
- Watchlist: search (Yahoo Finance), add/remove, sparkline price history charts
- Profile: display name, discoverable toggle, notification settings, data export
- Profile: account deletion with confirmation
- Admin: user list with roles, invite new users, change roles, delete users
- Admin: role upgrade request review (approve/deny)
- Admin: notification settings configuration and test
- Responsive layout — mobile card views, desktop tables, collapsing filter panels
- React Router v7, Ant Design v6, Recharts
