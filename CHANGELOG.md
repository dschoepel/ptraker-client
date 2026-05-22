# Changelog

All notable changes to ptraker-client are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [1.4.0] — 2026-05-22

### Added
- Admin page: new **Importers** section — table of all registered importers showing name, file types, default status, active status, and display order; Edit button opens modal to update name, description, instructions, is_default, is_active, and display order; Register Importer button for adding newly-deployed code modules
- Profile page: new **Import Sources** section — lists all active non-default importers with per-user enable/disable toggle; default importers shown as always-on; each importer has a collapsible "How to generate this file" instructions panel
- Import page: importer info alert now includes a collapsible "How to generate this file" panel showing DB-managed usage instructions
- `admin.service.js`: `importerService` with `getAll`, `register`, `update` methods
- `userService`: `getImporterPreferences` and `updateImporterPreferences` methods

### Changed
- Import page importer dropdown now filtered server-side by user preferences — users only see importers they have enabled (plus always-visible defaults)

---

## [1.3.0] — 2026-05-21

### Added
- PWA support — installable as home screen app on iOS and Android via `vite-plugin-pwa`
- Full pTracker icon set (all sizes + maskable variants) and App Store screenshots
- Private / unlisted stock support in manual entry — bypass Yahoo Finance with direct ticker, company name, shares, price per share, and cost basis per share
- Demo user seed script (`deploy/seeds/demo-user.sql`) with ~$1M sample portfolio across Schwab, Merrill Lynch, US Bank, and Other accounts

### Fixed
- Login page: 401 interceptor was triggering `window.location.href = '/login'` on failed login attempts, causing a full page reload that wiped the error message and form fields
- Login page: raw "Invalid login credentials" replaced with friendly message; alerts now show icon for better visibility
- Profile page: "Portfolio Sharing" section no longer shown for viewer-role users
- Analytics: pie chart labels clipped — `ResponsiveContainer` height raised 220→260px

---

## [1.2.2] — 2026-05-21

### Fixed
- Admin page: Users and Role Requests tables now scroll horizontally on mobile instead of overflowing off-screen

---

## [1.2.2] — 2026-05-21

### Fixed
- Admin page: Users section now renders as a card list on mobile instead of an overflowing table — shows name/email, role badge, role select, and delete button in a clean layout
- Role Requests table gets horizontal scroll on mobile

---

## [1.2.1] — 2026-05-21

### Fixed
- Mobile/iPad light mode: app now always uses dark theme regardless of OS color scheme setting; all components use hardcoded dark colors so light mode rendered white-on-white

---

## [1.2.0] — 2026-05-21

### Added
- Footer on desktop layout: tagline on the left, Client and API version numbers on the right
- API version fetched live from `GET /api/v1/version` on load

### Changed
- Toast notifications switched from `message` API to `notification` API — proper built-in close button, 8-second duration
- All pages now use shared `useMessage` hook (`src/hooks/useMessage.js`) instead of `AntdApp.useApp().message` directly

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
