# ptraker-client — Project Context for Claude

This file provides context for Claude (VSCode extension and claude.ai chat)
about the ptraker React frontend architecture, decisions made, and plans.

Last updated: May 2026

---

## What This App Does

portfolioTraker (ptraker) is a personal investment portfolio tracker frontend.
Tracks $2M+ across 8 accounts (LPL brokerage/retirement, CFCU bank, NJSD 403b/457).
Supports multi-user with role-based access and portfolio sharing.

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
    admin.service.js        — adminService, sharesService, userService
  utils/
    formatters.js           — formatCurrency, formatPercent, formatShares,
                              formatDate, formatDateTime, gainLossColor,
                              institutionName, accountTypeName, assetTypeName
  layouts/
    AppLayout.jsx           — sidebar (desktop) + bottom tab bar (mobile)
                              nav items filtered by role (viewer hides Accounts/Import)
  pages/
    Login.jsx               — email/password + forgot password
    ResetPassword.jsx       — PASSWORD_RECOVERY event pattern
    SetPassword.jsx         — new user invite acceptance + password setup
    Dashboard.jsx           — collapsible accounts, shared portfolio tabs
    Accounts.jsx            — full CRUD + expandable positions + delete position
    Import.jsx              — 3-step wizard, file + manual entry
    Watchlist.jsx           — sparkline charts, symbol search
    Profile.jsx             — profile, portfolio sharing, upgrade request
    Admin.jsx               — user management, invite, role requests, notifications
  App.jsx                   — routing, theme, auth provider
                              invite token detection at module level
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

### Invite Token Detection
At module level in `App.jsx` (before React renders) — detects `type=invite` in URL hash:
```javascript
const hash = window.location.hash;
if (hash) {
  const params = new URLSearchParams(hash.substring(1));
  if (params.get('access_token') && params.get('type') === 'invite') {
    localStorage.setItem('ptraker_token', params.get('access_token'));
    localStorage.setItem('ptraker_refresh_token', params.get('refresh_token'));
    window.history.replaceState(null, '', '/set-password');
  }
}
```

### Reset Password
Listens for `PASSWORD_RECOVERY` event on `supabaseAuth` — do NOT parse URL hash.

### Set Password (invite flow)
`SetPassword.jsx` calls `supabaseAuth.auth.setSession()` to establish session from
localStorage token, then `supabaseAuth.auth.updateUser({ password })`.

### Dev Email Issues
- Password reset links: `https://10.0.10.60` → change to `http://10.0.10.60:8100`
- Invite emails: sent via nodemailer in Express API (GoTrue v2.186 silently skips invite emails)
  Link fix applied in `admin.controller.js`: `.replace(/^https:\/\/10\.0\.10\.60\//, 'http://10.0.10.60:8100/')`

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=http://10.0.10.60:8100
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## User Roles

| Role | Accounts | Import | Watchlist | Settings | Admin | Dashboard |
|---|---|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | Own + shared |
| user | ✅ | ✅ | ✅ | ✅ | ❌ | Own + shared |
| viewer | ❌ | ❌ | ✅ | ✅ | ❌ | Empty state + shared |

Nav items filtered in `AppLayout.jsx`:
```javascript
const isAdmin  = user?.role === 'admin'  || user?.user_metadata?.role === 'admin';
const isViewer = user?.role === 'viewer' || user?.user_metadata?.role === 'viewer';
```

---

## Component Rules

**Never define components inside other components.**
**Never call setState synchronously in useEffect — wrap in async function.**
**Never use Date.now() in render — use new Date().getTime().**
**Use useCallback for functions used in useEffect dependency arrays.**

### refreshKey pattern:
```javascript
const [refreshKey, setRefreshKey] = useState(0);
useEffect(() => { fetchData(); }, [refreshKey]);
setRefreshKey(k => k + 1);
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

- Loads own dashboard + shares list in parallel on mount
- Shows tabs when user has shared portfolios to view
- Viewers with no own accounts: "My Portfolio" shows empty state with Request Upgrade button
- Auto-switches to first shared tab if viewer has no own accounts
- `PortfolioView` component is reusable for both own and shared portfolios
- `readOnly=true` on shared views hides Refresh Prices button
- Cash accounts (checking/savings) show `—` for Gain/Loss and Today

### daysSince calculation
```javascript
const daysSince = account.last_imported_at
  ? Math.floor(
      (new Date().getTime() - new Date(account.last_imported_at).getTime())
      / (1000 * 60 * 60 * 24)
    )
  : null;
```

---

## Admin Page

- User list with role change dropdown and delete button
- Cannot delete self or last admin
- Invite user modal (email + role)
- Role upgrade requests with approve/deny
- Notification settings (Ntfy + Email) with collapsible panels and Send test button

### Notification Settings
Stored in `profiles.notification_settings` JSONB:
```json
{
  "ntfy":  {"enabled": true, "url": "https://ntfy.schoepels.com", "topic": "ptraker", "token": ""},
  "email": {"enabled": true, "recipient": "dave@theschoepels.com"}
}
```

---

## Profile / Settings Page

- Display name edit
- Role badge
- Request Upgrade section (viewers only) — submits to `/api/v1/user/request-upgrade`
- Portfolio Sharing — share with others by email, see portfolios shared with you
- Danger Zone — Delete My Account with Popconfirm

---

## Import Page — Key Details

### Manual Entry modes
- **Cash Balance** — creates CASH position
- **Fund/Stock** — ticker autocomplete, market value → shares back-calculated,
  price auto-refreshed after save

### importService methods
```javascript
importService.upload(file, importerId, accountId, syncMode)
importService.manualEntry(accountId, ticker, balance, assetName, assetType,
                          marketValue, shares, costBasis, name, defaultAssetType)
```

---

## Watchlist

- Sparkline: AreaChart, 30-day, green/red based on period direction
- Symbol search: AutoComplete + `/watchlist/search?q=` (yahoo `search` module)
- `added_from`: 'manual' | 'import_sync'

---

## Nav Items

```javascript
{ key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
...(!isViewer ? [
  { key: '/accounts', icon: <BankOutlined />,   label: 'Accounts' },
  { key: '/import',   icon: <UploadOutlined />,  label: 'Import'   },
] : []),
{ key: '/watchlist', icon: <StarOutlined />,     label: 'Watchlist' },
{ key: '/profile',   icon: <SettingOutlined />,  label: 'Settings'  },
...(isAdmin ? [{ key: '/admin', icon: <SafetyOutlined />, label: 'Admin' }] : []),
```

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ | |
| Reset Password | ✅ | PASSWORD_RECOVERY event |
| Set Password | ✅ | Invite acceptance flow |
| Dashboard | ✅ | Tabs for shared portfolios, viewer empty state |
| Accounts | ✅ | Full CRUD, expandable positions, delete position |
| Import | ✅ | File + manual (cash/fund), sync-delete, watchlist |
| Watchlist | ✅ | Sparklines, symbol autocomplete |
| Profile/Settings | ✅ | Sharing, upgrade request, delete account |
| Admin | ✅ | User mgmt, invite, role requests, notifications |

---

## Known Issues / TODO

- [ ] OTP code entry for password reset
- [ ] Mobile view for Accounts page
- [ ] Merrill Lynch CSV importer
- [ ] Schwab CSV importer
- [ ] LPL QFX importer
- [ ] System theme change at runtime not reactive
- [ ] No error boundary component
- [ ] Production deployment (Jupiter VPS + ptraker.com)
