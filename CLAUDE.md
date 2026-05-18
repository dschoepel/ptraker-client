# ptraker-client — Project Context for Claude

This file provides context for Claude (VSCode extension and claude.ai chat)
about the ptraker React frontend architecture, decisions made, and plans.

Last updated: May 2026

---

## What This App Does

portfolioTraker (ptraker) is a personal investment portfolio tracker frontend.
It consumes the ptraker-api and displays a consolidated dashboard with current
values, gain/loss calculations, and import capabilities.

---

## Repositories

- **Client:** https://github.com/dschoepel/ptraker-client (this repo)
- **API:** https://github.com/dschoepel/ptraker-api

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| UI Library | Ant Design v6 |
| Routing | React Router v7 |
| HTTP | Axios |
| Dates | dayjs |
| State | React Context (AuthContext) |
| Supabase direct | @supabase/supabase-js (auth flows only) |

---

## Key ANTD v6 API Changes (breaking from v5)

These are easy to get wrong — always use the v6 API:

```jsx
// Statistic — valueStyle is deprecated
// OLD: valueStyle={{ color: '#fff' }}
// NEW:
styles={{ content: { color: '#fff' } }}

// Space — direction is deprecated
// OLD: <Space direction="vertical">
// NEW:
<Space orientation="vertical">
```

---

## Brand / Theme

Colors defined in `src/theme/index.js` — import `brandColors` for inline styles:

```javascript
import { brandColors } from '../theme';
// brandColors.gold          #f5a623  — primary accent
// brandColors.darkBg        #1a1d23  — page background
// brandColors.darkCard      #22262e  — card background
// brandColors.darkBorder    #2e3340  — borders
// brandColors.darkHover     #2a2d35  — hover states
// brandColors.textPrimary   #ffffff
// brandColors.textSecondary #a0a0a0
// brandColors.textMuted     #6b7280
// brandColors.gain          #52c41a  — positive values
// brandColors.loss          #ff4d4f  — negative values
// brandColors.neutral       #8c8c8c  — zero / N/A
```

Theme applied in `App.jsx` via `<ConfigProvider>` with system dark/light detection.

---

## Project Structure

```
src/
  theme/
    index.js          — ANTD design tokens + brandColors
  store/
    context.js        — AuthContext createContext (no JSX — avoids fast refresh warning)
    AuthContext.jsx   — AuthProvider component only
    useAuth.js        — useAuth hook only
  services/
    api.js            — Axios instance with auth interceptor + token refresh
    auth.service.js   — login, logout, profile, forgotPassword, resetPassword
                        NOTE: forgotPassword calls Supabase directly (not Express)
                        exports supabaseAuth client for ResetPassword page
    dashboard.service.js — dashboard, positions, accounts, import, prices
  utils/
    formatters.js     — formatCurrency, formatPercent, formatShares, formatDate,
                        formatDateTime, gainLossColor, institutionName,
                        accountTypeName, assetTypeName
  layouts/
    AppLayout.jsx     — responsive shell: desktop sidebar + mobile bottom tab bar
  pages/
    Login.jsx         — login form with forgot password flow
    ResetPassword.jsx — password reset (listens for PASSWORD_RECOVERY auth event)
    Dashboard.jsx     — portfolio overview with collapsible account sections
    Accounts.jsx      — account management full CRUD + expandable positions
    Import.jsx        — 3-step import wizard + history table
  App.jsx             — routing, theme, auth provider
  main.jsx            — entry point
  index.css           — minimal reset only
```

---

## Auth Pattern

Three files to avoid Fast Refresh warnings:
- `context.js` — `createContext` only, no JSX
- `AuthContext.jsx` — `AuthProvider` component only
- `useAuth.js` — `useAuth` hook only

State initialized from localStorage via lazy useState (no useEffect):
```javascript
const [token, setToken] = useState(() => localStorage.getItem('ptraker_token') || null);
```

Token auto-refreshed by Axios interceptor in `api.js` on 401 response.

### Forgot Password Flow
Calls Supabase directly from browser (not via Express) to ensure correct
verification URL is built. Uses `supabaseAuth` client from `auth.service.js`.

### Reset Password Flow
Uses `supabaseAuth.auth.onAuthStateChange()` to listen for `PASSWORD_RECOVERY`
event — do NOT try to parse URL hash, Supabase v2 doesn't put tokens there.

### Dev Email Link Issue
In dev, Supabase email links show `https://10.0.10.60` (no port).
Manually change to `http://10.0.10.60:8100` in the browser address bar.
This is a GoTrue dev environment issue — works correctly in production
where pt-api.schoepels.com / api.ptraker.com is properly configured.

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=http://10.0.10.60:8100
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Component Rules

**Never define components inside other components** — causes recreation on every render.
All sub-components must be defined at module level and receive props.

**Never call setState synchronously in useEffect** — use lazy useState or refreshKey pattern:
```javascript
// Refresh trigger pattern for re-fetching after mutations
const [refreshKey, setRefreshKey] = useState(0);
const triggerRefresh = () => setRefreshKey(k => k + 1);
useEffect(() => { fetchData(); }, [refreshKey]);
```

**useEffect for external subscriptions is fine:**
```javascript
// Subscribing to external system (Supabase auth) — correct use of useEffect
useEffect(() => {
  const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(...);
  return () => subscription.unsubscribe();
}, []);
```

**Avoid impure functions in render** — don't use `Date.now()`, use `new Date().getTime()`.

---

## Responsive Design

- `useBreakpoint()` from ANTD Grid for breakpoint detection
- `isMobile = !screens.md` (breakpoint: 768px)
- Desktop: collapsible sidebar (220px), full data tables
- Mobile: fixed header (56px) + bottom tab bar (60px), card-based lists
- iOS safe area: `paddingBottom: 'env(safe-area-inset-bottom)'`
- If `screens` is declared but mobile view not implemented yet — remove it to avoid lint warning

---

## Dashboard Page

- Single API call to `GET /api/v1/dashboard` on mount
- Net worth summary cards (4 cards: Total Value, Cost, Gain/Loss, Today's Change)
- Positions grouped by account in collapsible ANTD Collapse panels
- All panels collapsed by default
- Each panel header shows: account name, institution, value, cost, gain/loss,
  today's change, holdings count, last import time
- Last Import uses `last_imported_at` from `account_summary` view
  (subquery on import_history, not as_of_date from file)
- Freshness colors: green=today, grey=≤7 days, yellow=>7 days
- CASH positions show `—` for gain/loss and today's change
- Refresh Prices button in Dashboard reloads dashboard state after refresh

### daysSince calculation
```javascript
// Use new Date().getTime() not Date.now() — linter flags Date.now() as impure
const daysSince = account.last_imported_at
  ? Math.floor(
      (new Date().getTime() - new Date(account.last_imported_at).getTime())
      / (1000 * 60 * 60 * 24)
    )
  : null;
```

---

## Accounts Page

- Full CRUD: create, edit, deactivate/reactivate, delete
- Expandable rows show positions for that account (lazy loaded, cached)
- Positions loaded from dashboard endpoint filtered by account_id
- Delete has Popconfirm to prevent accidents
- refreshKey pattern used for reloading after mutations
- Mobile view not yet implemented (screens variable removed to avoid lint warning)

---

## Import Page

- 3-step wizard: Institution → Upload → Results
- Step 1: Select importer plugin from API
- Step 2: Select account (optional — leave blank for auto-match by account number)
          Drag-and-drop file upload, accepts CSV/QFX/OFX
- Step 3: Results showing imported count, skipped, errors with detail
- Import history table below wizard, refreshes after each import
- account_id recorded in import_history for last_imported_at tracking

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Complete | Email/password, forgot password |
| Reset Password | ✅ Complete | PASSWORD_RECOVERY event pattern |
| Dashboard | ✅ Complete | Collapsible accounts, live prices, last import |
| Accounts | ✅ Complete | Full CRUD, expandable positions |
| Import | ✅ Complete | 3-step wizard, history |
| Watchlist | 🔜 Planned | Track securities of interest |
| Profile/Settings | 🔜 Planned | Edit display name, avatar |
| Admin/User Mgmt | 🔜 Planned | Invite family members |

---

## Known Issues / TODO

- [ ] Sync-delete on import (remove positions no longer in file) — opt-in checkbox
- [ ] Watchlist page — with sync-delete integration
- [ ] Email templates not yet branded (Studio templates UI skeleton issue)
- [ ] OTP code entry for password reset (alternative to email link)
- [ ] Mobile view not built for Accounts page
- [ ] Portfolio sharing (view-only access between family members)
- [ ] User invite flow (admin invites family members)
- [ ] Data export (download all user data)
- [ ] Account deletion with confirmation
- [ ] System theme change at runtime not reactive (requires page reload)
- [ ] No error boundary component yet
- [ ] Production Supabase server not yet provisioned
- [ ] ptraker.com DNS not yet configured
