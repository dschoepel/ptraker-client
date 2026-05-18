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
    auth.service.js   — login, logout, profile, forgotPassword
    dashboard.service.js — dashboard, positions, accounts, import, prices
  utils/
    formatters.js     — formatCurrency, formatPercent, formatShares, formatDate,
                        formatDateTime, gainLossColor, institutionName,
                        accountTypeName, assetTypeName
  layouts/
    AppLayout.jsx     — responsive shell: desktop sidebar + mobile bottom tab bar
  pages/
    Login.jsx         — login form with forgot password
    Dashboard.jsx     — portfolio overview with collapsible account sections
    Accounts.jsx      — account management (placeholder — not yet built)
    Import.jsx        — file import wizard (placeholder — not yet built)
  App.jsx             — routing, theme, auth provider
  main.jsx            — entry point
  index.css           — minimal reset only, ANTD handles component styles
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

---

## Component Rules

**Never define components inside other components** — causes recreation on every render.
All sub-components must be defined at module level and receive props.

```javascript
// WRONG — defined inside Dashboard
const Dashboard = () => {
  const SummaryCards = () => ...   // recreated every render
}

// CORRECT — defined outside
const SummaryCards = ({ netWorth, isMobile }) => ...
const Dashboard = () => <SummaryCards netWorth={...} isMobile={...} />
```

**Never call setState synchronously in useEffect** — use lazy useState initializer instead:
```javascript
// WRONG
useEffect(() => { setCollapsed(true); }, [screens.md]);

// CORRECT
const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
```

---

## Responsive Design

- `useBreakpoint()` from ANTD Grid for breakpoint detection
- `isMobile = !screens.md` (breakpoint: 768px)
- Desktop: collapsible sidebar (220px), full data table
- Mobile: fixed header (56px) + bottom tab bar (60px), card-based lists
- iOS safe area: `paddingBottom: 'env(safe-area-inset-bottom)'`

---

## Dashboard Page

- Single API call to `GET /api/v1/dashboard` on mount
- Net worth summary cards (4 cards: Total Value, Cost, Gain/Loss, Today's Change)
- Positions grouped by account in collapsible ANTD Collapse panels
- All panels collapsed by default — click arrow to expand
- Each panel header shows: account name, institution tag, value, cost, gain/loss, today, holdings count
- Expanded panel shows positions table with Account Total summary row
- Refresh Prices button in Dashboard (not AppLayout) so it can reload dashboard state after refresh
- CASH positions show `—` for gain/loss and today's change
- Price timestamp shown right-aligned next to Accounts heading

### Table columns (desktop)
Ticker (with truncated name below) | Type | Shares | Price (with % change) | Value | Cost | Gain/Loss (with %) | Today

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Complete | Email/password, forgot password link |
| Dashboard | ✅ Complete | Collapsible accounts, live prices, refresh |
| Accounts | 🔜 Planned | List/edit/deactivate accounts |
| Import | 🔜 Planned | File upload wizard with institution selector |
| Profile | 🔜 Planned | Edit display name, avatar |

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
```

In production, set to the deployed API URL.

---

## Production Build

```bash
npm run build   # outputs to dist/
```

The `dist/` folder is served as static files by Nginx/Swag on Jupiter VPS.
No Node.js needed in production for the client.

---

## Production Deployment (when ready)

- Build: `npm run build`
- Copy `dist/` to Jupiter VPS
- Serve via Swag/Nginx as static files for `ptraker.com`
- Swag proxy conf: `ptraker.subdomain.conf` → static files
- Update `VITE_API_URL` to `https://api.ptraker.com` before building

---

## Known Issues / TODO

- [ ] Accounts page not yet built
- [ ] Import wizard not yet built
- [ ] Profile/settings page not yet built
- [ ] System theme change at runtime not reactive (requires page reload)
- [ ] Mobile view not fully tested on real iPhone yet
- [ ] No loading skeleton — just Spin component while data loads
- [ ] No error boundary component yet
