# ptraker-client

React frontend for **portfolioTraker** — a personal investment portfolio tracker.

## Overview

Tracks $2M+ across 8 accounts (LPL brokerage/retirement, CFCU bank, NJSD 403b/457).
Multi-user with role-based access (admin/user/viewer) and portfolio sharing.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| UI Library | Ant Design v6 |
| Routing | React Router v7 |
| HTTP | Axios |
| Charts | Recharts |
| Auth | @supabase/supabase-js |

## Prerequisites

- Node.js 20+
- ptraker-api running (see [ptraker-api](https://github.com/dschoepel/ptraker-api))

## Installation

```bash
git clone https://github.com/dschoepel/ptraker-client
cd ptraker-client
npm install
```

## Configuration

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=http://your-supabase-host:8100
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running

```bash
npm run dev     # http://localhost:5173
npm run build   # production → dist/
```

## Features

- Dark/light mode (system preference)
- Responsive — desktop sidebar + mobile bottom tab bar
- Role-based navigation (viewer sees fewer options)
- Dashboard with collapsible account sections
- Shared portfolio tabs (viewer can see owner's portfolio)
- Real-time price refresh via Yahoo Finance
- Full account management (admin/user only)
- Import wizard: CSV/QFX + manual balance/position entry
- Sync-delete with watchlist integration
- Watchlist with 30-day sparkline charts
- Admin: invite users, manage roles, notification settings (Ntfy + email)
- Profile: share portfolio, request upgrade, delete account
- Password reset + invite acceptance flows

## User Roles

| Role | Accounts | Import | Watchlist | Settings | Admin |
|---|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| user | ✅ | ✅ | ✅ | ✅ | ❌ |
| viewer | ❌ | ❌ | ✅ | ✅ | ❌ |

## Pages

| Page | Path | Access |
|---|---|---|
| Login | `/login` | Public |
| Reset Password | `/reset-password` | Public |
| Set Password | `/set-password` | Public (invite flow) |
| Dashboard | `/dashboard` | All roles |
| Accounts | `/accounts` | admin, user |
| Import | `/import` | admin, user |
| Watchlist | `/watchlist` | All roles |
| Profile/Settings | `/profile` | All roles |
| Admin | `/admin` | admin only |

## Production

```bash
npm run build
```

Static files served via Swag/Nginx on Jupiter VPS for `ptraker.com`.

## Related

- [ptraker-api](https://github.com/dschoepel/ptraker-api) — Express/Node.js backend
