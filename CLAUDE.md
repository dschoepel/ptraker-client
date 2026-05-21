# ptraker-client — Claude Development Guide

## Stack
- React 19 / Vite 6
- Ant Design v6
- React Router v7
- Axios (api.js with auth interceptor + 401 refresh)
- Recharts (charts on Analytics tab)
- @supabase/supabase-js (auth client only — supabaseAuth)

## Ant Design v6 Breaking Changes
- `Space direction="vertical"` → `Space orientation="vertical"`
- `Divider type="vertical"` → `Divider orientation="vertical"`
- `Statistic valueStyle` → `Statistic styles={{ content: {...} }}`
- `Alert message=` for JSX → use `Alert description=` instead
- Never use `<form>` tags in React — use onClick/onChange handlers

## Key Patterns

### Auth Store (3 files for Fast Refresh)
- `src/store/context.js`, `AuthContext.jsx`, `useAuth.js`
- Always import `useAuth` from `../store/useAuth`

### Guard API calls with auth
```javascript
const { user } = useAuth();
useEffect(() => {
  if (!user) return; // wait for auth before API calls
  // ... fetch data
}, [user]);
```

### useEffect with async — never call setState synchronously
```javascript
// WRONG:
useEffect(() => { loadData(); }, [loadData]);
// CORRECT:
useEffect(() => {
  let cancelled = false;
  const load = async () => {
    const data = await fetchSomething();
    if (!cancelled) setState(data);
  };
  load();
  return () => { cancelled = true; };
}, []);
```

### useCallback for functions in useEffect deps
```javascript
const loadAccounts = useCallback(async () => { ... }, []);
useEffect(() => {
  let cancelled = false;
  const run = async () => { await loadAccounts(); };
  run();
  return () => { cancelled = true; };
}, [loadAccounts]);
```

### Never define components inside other components
All sub-components go OUTSIDE the parent component function.

### refreshKey pattern for re-fetching
```javascript
const [refreshKey, setRefreshKey] = useState(0);
useEffect(() => { fetchData(); }, [refreshKey]);
// trigger: setRefreshKey(k => k + 1);
```

## Services
- `api.js` — Axios instance, auto-injects Bearer token, handles 401 refresh
- `auth.service.js` — supabaseAuth client; forgotPassword calls Express API
- `dashboard.service.js` — dashboardService, positionService, accountService, importService, priceService, watchlistService
- `admin.service.js` — adminService, sharesService, userService

## Pages & Access
| Page | Path | Roles |
|---|---|---|
| Dashboard | /dashboard | all |
| Accounts | /accounts | admin, user |
| Import | /import | admin, user |
| Watchlist | /watchlist | all |
| Profile/Settings | /profile | all |
| Admin | /admin | admin only |

## Role Checks
```javascript
const isAdmin  = user?.role === 'admin'  || user?.user_metadata?.role === 'admin';
const isViewer = user?.role === 'viewer' || user?.user_metadata?.role === 'viewer';
```

## Invite Token Detection (App.jsx module level — before React renders)
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

## Mobile / Responsive
- `isMobile = !screens.md` (from `Grid.useBreakpoint()`)
- Accounts page: card list on mobile, table on desktop
- Dashboard: card layout adapts, filter panel collapses
- Header rows: use `flexWrap: 'wrap'` and `gap` for mobile wrapping

## Dashboard Architecture
- `SummaryCards` — net worth, cost basis, gain/loss, gain % stats
- `PortfolioView` — reusable, accepts `isOwn`, `isViewer`, `readOnly` props
- `AnalyticsView` — charts tab: institution donut+bar, account type donut, cash bar
- Tabs: My Portfolio | Analytics | [shared portfolios if any]

## Analytics Charts (Recharts)
Data derived client-side from `accounts[]` and `positions[]`:
- Institution: group accounts by `institution`, sum `total_current_value` / `total_cost_basis`
- Account Type: group by `account_type`
- Cash: cash = checking/savings accounts + CASH-type positions in investment accounts
- Colors: CHART_COLORS array cycles through 10 distinct colors

## Import Page
- Multi-account importers (`multiAccount: true`): no accountId needed, auto-matched
- Single-account: requires accountId selection
- `isMultiAccount` derived from `importers.find(i => i.id === selectedImporter)?.multiAccount`
- Results: multi-account shows Account Breakdown card with per-account row counts
- History: loaded separately (non-fatal — failure never blocks page or import)

## Environment Variables
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=http://10.0.10.60:8100
VITE_SUPABASE_ANON_KEY=<key>
```

## Pending / TODO
- [ ] Production build / deployment to ptraker.com
