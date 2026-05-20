# ptraker-client — Project Context for Claude

This file provides context for Claude (VSCode extension and claude.ai chat)
about the ptraker React frontend architecture, decisions made, and plans.

Last updated: May 2026

---

## What This App Does

portfolioTraker (ptraker) is a personal investment portfolio tracker frontend.
Tracks $2M+ across 8 accounts (LPL brokerage/retirement, CFCU bank, NJSD 403b/457).
Multi-user with role-based access (admin/user/viewer) and portfolio sharing.

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
                              username click → /profile, avatar click → dropdown (Sign out)
  pages/
    Login.jsx               — three modes: login / forgot / otp
    ResetPassword.jsx       — handles both OTP path and email link (PASSWORD_RECOVERY)
    SetPassword.jsx         — new user invite acceptance + password setup
    Dashboard.jsx           — collapsible accounts, shared portfolio tabs,
                              filter panel (institution, account, sort)
    Accounts.jsx            — full CRUD + expandable positions + delete position
                              column sorts: name, institution, type
    Import.jsx              — 3-step wizard, file + manual entry
    Watchlist.jsx           — sparkline charts, symbol search
    Profile.jsx             — profile, privacy toggle, portfolio sharing,
                              upgrade request, delete account with data export
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

### Password Reset — Three modes in Login.jsx
- `login` — email + password
- `forgot` — enter email → calls Express API `/auth/forgot-password`
  API uses `generateLink` + nodemailer (GoTrue silently skips emails)
  Email contains branded HTML with Reset button + 6-digit OTP code
- `otp` — enter 6-digit code → `supabaseAuth.auth.verifyOtp()` → navigate to /reset-password

### ResetPassword.jsx — Two paths
- **OTP path:** token in localStorage from verifyOtp → `setSession()` → show form
- **Email link path:** listen for `PASSWORD_RECOVERY` event from supabaseAuth

### Invite Token Detection
Module-level in `App.jsx` (before React renders):
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

### Dev Email Issues
- Password reset/invite links: `https://10.0.10.60` → change to `http://10.0.10.60:8100`
- Fixed in `admin.controller.js` and `auth.controller.js` with `.replace()`

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

### Nav filtering in AppLayout.jsx
```javascript
const isAdmin  = user?.role === 'admin'  || user?.user_metadata?.role === 'admin';
const isViewer = user?.role === 'viewer' || user?.user_metadata?.role === 'viewer';
```

---

## Component Rules

**Never define components inside other components.**
**Never call setState synchronously in useEffect — wrap in async function.**
**Never use Date.now() in render — use new Date().getTime().**
**Use useCallback for functions in useEffect dependency arrays.**

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
- Shows tabs when user has shared portfolios
- Viewers with no own accounts: empty state with Request Upgrade button, auto-switches to first shared tab
- `PortfolioView` reusable for own and shared portfolios
- `readOnly=true` on shared views hides Refresh Prices button
- `isOwn=true` + `isViewer=true` + no accounts → empty state

### Filter Panel (in PortfolioView)
- Sort by: Value desc, Gain/Loss desc, Name asc
- Filter by institution (checkboxes)
- Filter by account (checkboxes — filtered by selected institutions)
- When institution deselected, clears accounts from that institution
- Filter button turns gold when active, shows "Filtered" label
- Clear filters button resets all

### Cash Account Display Rules
Checking/savings accounts show `—` for Gain/Loss and Today in both header and summary row.

---

## Accounts Page

- Full CRUD with Popconfirm on delete
- Expandable rows show positions (lazy loaded)
- Delete individual positions via `positionService.remove(id)`
- Column sorts: name (`a.name`), institution (`institutionName(a.institution)`), type (`a.type` not `a.account_type`)
- `showSorterTooltip={false}` on Table

---

## Profile / Settings Page

- Display name edit
- Privacy toggle: `discoverable` field — controls visibility in sharing dropdown
- Portfolio Sharing:
  - "Existing user" mode: dropdown of discoverable users (name only, not email)
  - "Invite someone new" mode: email input → auto-invite as viewer + share created
- Request Upgrade section (viewers only)
- Delete Account flow:
  1. Modal opens with Download My Data button
  2. Checkbox: "I understand this cannot be undone"
  3. Delete button only enabled after checkbox checked
  4. Download exports JSON via `GET /api/v1/user/export`

---

## Admin Page

- User list with role change dropdown and delete (trash) button
- Cannot delete self or last admin
- Invite user modal (email + role)
- Role upgrade requests with approve/deny
- Notification settings: Ntfy + Email, collapsible panels, Send test button

### Notification Settings stored in profiles.notification_settings JSONB:
```json
{
  "ntfy":  {"enabled": true, "url": "https://ntfy.schoepels.com", "topic": "ptraker", "token": ""},
  "email": {"enabled": true, "recipient": "dave@theschoepels.com"}
}
```

---

## Import Page

### Manual Entry modes
- **Cash Balance** — CASH position, balance = shares, cost basis = 0
- **Fund/Stock** — ticker autocomplete, market value → shares back-calculated,
  price auto-refreshed after save, cost basis from statement

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ | Three modes: login/forgot/otp |
| Reset Password | ✅ | OTP + email link paths |
| Set Password | ✅ | Invite acceptance |
| Dashboard | ✅ | Tabs, filter panel, viewer empty state |
| Accounts | ✅ | CRUD, positions, column sorts |
| Import | ✅ | File + manual, sync-delete |
| Watchlist | ✅ | Sparklines, symbol search |
| Profile/Settings | ✅ | Privacy, sharing, export, delete |
| Admin | ✅ | Users, invite, roles, notifications |

---

## TODO

- [ ] Mobile view for Accounts page
- [ ] Merrill Lynch CSV importer
- [ ] Schwab CSV importer
- [ ] LPL QFX importer
- [ ] Production deployment (Jupiter VPS + ptraker.com)
