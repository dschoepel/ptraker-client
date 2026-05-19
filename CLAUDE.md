# ptraker-client — Project Context for Claude

This file provides context for Claude (VSCode extension and claude.ai chat)
about the ptraker React frontend architecture, decisions made, and plans.

Last updated: May 2026

---

## What This App Does

portfolioTraker (ptraker) is a personal investment portfolio tracker frontend.
Tracks $2M+ across 8 accounts (LPL brokerage/retirement, CFCU bank, NJSD 403b/457).

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

## Key ANTD v6 API Changes

```jsx
// Statistic — valueStyle is deprecated
styles={{ content: { color: '#fff' } }}

// Space — direction is deprecated
<Space orientation="vertical">

// Never use Date.now() in render — use new Date().getTime()
```

---

## Brand Colors

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
    context.js              — AuthContext createContext only (no JSX)
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
    ResetPassword.jsx       — PASSWORD_RECOVERY event pattern (not URL hash)
    Dashboard.jsx           — collapsible account sections, live prices
    Accounts.jsx            — full CRUD + expandable positions + delete position
    Import.jsx              — 3-step wizard, file upload + manual entry
    Watchlist.jsx           — sparkline charts, symbol search autocomplete
  App.jsx                   — routing, theme, auth provider
  main.jsx                  — entry point
  index.css                 — minimal reset
```

---

## Auth Pattern

Three files to avoid Fast Refresh warnings:
- `context.js` — createContext only
- `AuthContext.jsx` — AuthProvider only
- `useAuth.js` — useAuth hook only

```javascript
// Lazy useState from localStorage — no useEffect
const [token, setToken] = useState(() => localStorage.getItem('ptraker_token') || null);
```

### Forgot Password
Calls Supabase directly via `supabaseAuth` — NOT through Express API.

### Reset Password
Listens for `PASSWORD_RECOVERY` event — do NOT parse URL hash.

### Dev Email Issue
Links show `https://10.0.10.60` — manually change to `http://10.0.10.60:8100`.

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
**Never use Date.now() in render — use new Date().getTime().**

### refreshKey pattern:
```javascript
const [refreshKey, setRefreshKey] = useState(0);
useEffect(() => { fetchData(); }, [refreshKey]);
setRefreshKey(k => k + 1); // trigger refetch
```

### Cancelled flag for async useEffect:
```javascript
useEffect(() => {
  let cancelled = false;
  const fetch = async () => {
    const data = await api();
    if (!cancelled) setState(data);
  };
  fetch();
  return () => { cancelled = true; };
}, []);
```

---

## Dashboard — Key Details

- Single `GET /api/v1/dashboard` call
- 4 summary cards: Total Value, Cost, Gain/Loss, Today
- Collapsible account sections (all collapsed by default)
- `daysSince` uses `new Date().getTime()` not `Date.now()`
- Last Import from `account_summary.last_imported_at`
- Freshness: green=today, grey=≤7 days, yellow=>7 days

### Cash Account Display Rules
Bank accounts (type: checking, savings) show `—` for Gain/Loss and Today:
```jsx
{account.account_type === 'checking' || account.account_type === 'savings' ? (
  <Text style={{ color: brandColors.textSecondary }}>—</Text>
) : (
  <ColoredValue value={account.total_gain_loss} />
)}
```
Apply in both `AccountPanelHeader` AND `AccountPositionsTable` summary row.

### Account Header Layout
- Name as bold text, institution as muted subtitle below (NOT a tag)
- `maxWidth` on name text to prevent overflow
- `gutter={[8, 0]}` on Row

---

## Accounts Page — Key Details

- Full CRUD with Popconfirm on delete
- Expandable rows show positions (lazy loaded, cached per account_id)
- `PositionsTable` receives `onDeletePosition` prop for per-position delete
- `positionService.remove(id)` called from `handleDeletePosition`
- After delete: clear position cache and trigger refresh
- refreshKey pattern for reloading after mutations
- Mobile view not yet implemented

---

## Import Page — Key Details

### Importer types
- File importers: show Dragger file upload
- Manual importer: `isManual: true` → show balance/position form

### Manual Entry — two modes
**Cash Balance mode:**
- Creates CASH position, balance = shares value, cost basis = 0

**Fund/Stock mode:**
- Ticker autocomplete via `/watchlist/search?q=` (same as watchlist)
- Selecting result auto-fills asset name
- Enter market value → shares back-calculated from current price
- Enter cost basis from statement
- After save, price cache refreshed automatically (no manual refresh needed)

### importService methods
```javascript
importService.upload(file, importerId, accountId, syncMode)
importService.manualEntry(accountId, ticker, balance, assetName, assetType,
                          marketValue, shares, costBasis, name, defaultAssetType)
importService.getImporters()  // includes isManual flag
importService.getHistory()
```

### Sync-delete
- Checkbox in Step 2 (default on)
- Results show removed positions with Watch button
- `watchlistService.add()` called with `addedFrom: 'import_sync'`

---

## Watchlist — Key Details

- Sparkline: AreaChart (recharts), 30-day from `/watchlist/:ticker/history`
- Green line if up, red if down; YAxis padded to amplify small moves
- Symbol search: AutoComplete + `/watchlist/search?q=`
  Uses yahoo-finance2 `search` module (autoc is decomissioned)
- `added_from`: 'manual' | 'import_sync'

---

## Nav Items

```javascript
{ key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
{ key: '/accounts',  icon: <BankOutlined />,      label: 'Accounts'  },
{ key: '/import',    icon: <UploadOutlined />,     label: 'Import'    },
{ key: '/watchlist', icon: <StarOutlined />,       label: 'Watchlist' },
```

Mobile bottom tab bar maps over navItems automatically.

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ | |
| Reset Password | ✅ | PASSWORD_RECOVERY event |
| Dashboard | ✅ | Collapsible, live prices, cash account rules |
| Accounts | ✅ | Full CRUD, expandable positions, delete position |
| Import | ✅ | File + manual (cash/fund), sync-delete, watchlist |
| Watchlist | ✅ | Sparklines, symbol autocomplete |
| Profile/Settings | 🔜 | |
| Admin/User Mgmt | 🔜 | Invite family members — next priority |

---

## Known Issues / TODO

- [ ] User invite flow (admin invites family members by email) ← NEXT
- [ ] Portfolio sharing (view-only access between users) ← NEXT
- [ ] Email templates branding (Studio skeleton issue)
- [ ] OTP code entry for password reset
- [ ] Mobile view for Accounts page
- [ ] Profile/settings page
- [ ] Data export (download all user data)
- [ ] Account deletion with confirmation
- [ ] System theme change at runtime not reactive
- [ ] No error boundary component
- [ ] Production deployment (Jupiter VPS + ptraker.com)
