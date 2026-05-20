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
- Dashboard with collapsible account sections and filter panel
- Shared portfolio tabs (viewer sees owner's portfolio)
- Real-time price refresh via Yahoo Finance
- Account management with column sorts (admin/user only)
- Import wizard: CSV/QFX + manual balance/position entry with ticker autocomplete
- Sync-delete with watchlist integration
- Watchlist with 30-day sparkline charts and symbol search
- Admin: invite users, manage roles, notification settings (Ntfy + email)
- Profile: privacy toggle, portfolio sharing, request upgrade, data export, delete account
- Password reset via email link or 6-digit OTP code
- Branded invite acceptance flow

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

## Supported Institutions

| Institution | Import Method |
|---|---|
| LPL Financial | CSV export |
| Community First CU | CSV transaction history |
| Associated Bank (NJSD plans) | Manual entry by market value |
| Any cash account | Manual balance entry |

## Production

```bash
npm run build
```

Static files served via Swag/Nginx on Jupiter VPS for `ptraker.com`.

## Related

- [ptraker-api](https://github.com/dschoepel/ptraker-api) — Express/Node.js backend
