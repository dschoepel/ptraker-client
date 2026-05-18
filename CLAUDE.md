# ptraker-client — Project Context for Claude

This file provides context for Claude (VSCode extension and claude.ai chat)
about the ptraker React frontend architecture, decisions made, and plans.

Last updated: May 2026

---

## What This App Does

portfolioTraker (ptraker) is a personal investment portfolio tracker frontend.
It consumes the ptraker-api and displays a consolidated dashboard with current
values, gain/loss calculations, import capabilities, and a watchlist.

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
| Charts | Recharts |
| Auth (direct) | @supabase/supabase-js |

---

## Key ANTD v6 API Changes (breaking from v5)

```jsx
// Statistic — valueStyle is deprecated
styles={{ content: { color: '#fff' } }}

// Space — direction is deprecated
<Space orientation="vertical">
```

---

## Brand / Theme

Colors defined in `src/theme/index.js`:

```javascript
import { brandColors } from '../theme';
// brandColors.gold          #f5a623
// brandColors.darkBg        #1a1d23
// brandColors.darkCard      #22262e
// brandColors.darkBorder    #2e3340
// brandColors.darkHover     #2a2d35
// brandColors.textPrimary   #ffffff
// brandColors.textSecondary #a0a0a0
// brandColors.textMuted     #6b7280
// brandColors.gain          #52c41a
// brandColors.loss          #ff4d4f
// brandColors.neutral       #8c8c8c
```

---

## Project Structure

```
src/
  theme/index.js            — ANTD design tokens + brandColors
  store/
    context.js              — AuthContext createContext only
    AuthContext.jsx         — AuthProvider component only
    useAuth.js              — useAuth hook only
  services/
    api.js                  — Axios + auth interceptor + token refresh
    auth.service.js         — login, logout, profile, forgotPassword, resetPassword
                              exports supabaseAuth for direct Supabase calls
    dashboard.service.js    — dashboard, positions, accounts, import,
                              prices, watchlist services
  utils/
    formatters.js           — formatCurrency, formatPercent, formatShares,
                              formatDate, formatDateTime, gainLossColor,
                              institutionName, accountTypeName, assetTypeName
  layouts/
    AppLayout.jsx           — sidebar (desktop) + bottom tab bar (mobile)
  pages/
    Login.jsx               — email/password + forgot password
    ResetPassword.jsx       — PASSWORD_RECOVERY event pattern
    Dashboard.jsx           — collapsible account sections, live prices
    Accounts.jsx            — full CRUD + expandable positions
    Import.jsx              — 3-step wizard + sync-delete + watchlist integration
    Watchlist.jsx           — watchlist with sparkline charts + symbol search
  App.jsx                   — routing, theme, auth provider
  main.jsx                  — entry point
  index.css                 — minimal reset
```

---

## Auth Pattern

Three files to avoid Fast Refresh warnings:
- `context.js` — `createContext` only
- `AuthContext.jsx` — `AuthProvider` only
- `useAuth.js` — `useAuth` hook only

State from localStorage via lazy useState — no useEffect needed:
```javascript
const [token, setToken] = useState(() => localStorage.getItem('ptraker_token') || null);
```

### Forgot Password
Calls Supabase directly (not Express) via `supabaseAuth` in `auth.service.js`.

### Reset Password
Listens for `PASSWORD_RECOVERY` auth state event — do NOT parse URL hash.

### Dev Email Link Issue
Links show `https://10.0.10.60` — manually change to `http://10.0.10.60:8100`.
Works correctly in production with proper domain.

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=http://10.0.10.60:8100
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Component Rules

**Never define components inside other components.**
**Never call setState synchronously in useEffect.**
**Never use `Date.now()` in render** — use `new Date().getTime()`.
**Avoid impure functions in render.**

### refreshKey pattern for re-fetching after mutations:
```javascript
const [refreshKey, setRefreshKey] = useState(0);
useEffect(() => { fetchData(); }, [refreshKey]);
// After mutation:
setRefreshKey(k => k + 1);
```

### Cancelled flag pattern for async useEffect:
```javascript
useEffect(() => {
  let cancelled = false;
  const fetch = async () => {
    const data = await someApi();
    if (!cancelled) setState(data);
  };
  fetch();
  return () => { cancelled = true; };
}, []);
```

---

## Dashboard Page

- Single `GET /api/v1/dashboard` call on mount
- 4 summary cards: Total Value, Cost, Gain/Loss, Today's Change
- Collapsible account sections (all collapsed by default)
- Each header: name, institution, value, cost, gain/loss, today, holdings, last import
- Last import uses `last_imported_at` from `account_summary` view
- Freshness: green=today, grey=≤7 days, yellow=>7 days
- `daysSince` uses `new Date().getTime()` not `Date.now()`
- CASH shows `—` for gain/loss and today
- Refresh Prices reloads full dashboard state after update

---

## Accounts Page

- Full CRUD with Popconfirm on delete
- Expandable rows show positions (lazy loaded, cached)
- refreshKey pattern for reloading after mutations
- Mobile view not yet implemented

---

## Import Page

- 3-step wizard: Institution → Upload → Results
- Account selector optional — leave blank for auto-match by last 4 digits
- Sync-delete checkbox (default on) — removes positions not in file
- Results show removed positions with Watch button → adds to watchlist
- Import history table refreshes after each import
- `importService.upload(file, importerId, accountId, syncMode)`

---

## Watchlist Page

- Table with sparkline charts (30-day area chart, recharts)
- Sparkline: green if up over period, red if down
- YAxis domain padded to amplify small movements
- Symbol search via `AutoComplete` + `GET /api/v1/watchlist/search?q=`
  Uses yahoo-finance2 `search` module (NOT `autoc` — decomissioned)
- Add manually or auto-added from import sync-delete
- Edit notes, delete with Popconfirm
- `added_from` field: 'manual' or 'import_sync'

---

## Nav Items (AppLayout)

```javascript
const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/accounts',  icon: <BankOutlined />,      label: 'Accounts'  },
  { key: '/import',    icon: <UploadOutlined />,     label: 'Import'    },
  { key: '/watchlist', icon: <StarOutlined />,       label: 'Watchlist' },
];
```

Mobile bottom tab bar maps over navItems automatically.

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Complete | |
| Reset Password | ✅ Complete | PASSWORD_RECOVERY event |
| Dashboard | ✅ Complete | Collapsible, live prices, last import |
| Accounts | ✅ Complete | Full CRUD, expandable positions |
| Import | ✅ Complete | Wizard, sync-delete, watchlist integration |
| Watchlist | ✅ Complete | Sparklines, symbol search |
| Profile/Settings | 🔜 Planned | |
| Admin/User Mgmt | 🔜 Planned | Invite family members |

---

## Known Issues / TODO

- [ ] User invite flow (admin invites family members by email)
- [ ] Portfolio sharing (view-only access between users)
- [ ] Email templates not yet branded (Studio skeleton issue)
- [ ] OTP code entry for password reset
- [ ] Mobile view for Accounts page
- [ ] Profile/settings page
- [ ] Data export (download all user data)
- [ ] Account deletion with confirmation
- [ ] System theme change at runtime not reactive
- [ ] No error boundary component
- [ ] Production deployment not yet done
