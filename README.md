# ptraker-client

React frontend for **portfolioTraker** — a personal investment portfolio tracker.

## Overview

Tracks $2M+ across 8 accounts (LPL brokerage/retirement, CFCU bank, NJSD 403b/457).
Built as a private family application with role-based access.

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
- Dashboard with collapsible account sections, last import timestamp
- Cash accounts show `—` for gain/loss (not misleading)
- Real-time price refresh via Yahoo Finance
- Full account management (create, edit, deactivate, delete)
- Delete individual positions from account
- Import wizard:
  - CSV/QFX file upload with sync-delete
  - Manual cash balance entry
  - Manual fund/stock entry by market value (shares back-calculated)
  - Ticker autocomplete via Yahoo Finance symbol search
- Watchlist with 30-day sparkline charts
- Password reset via email

## Pages

| Page | Path |
|---|---|
| Login | `/login` |
| Reset Password | `/reset-password` |
| Dashboard | `/dashboard` |
| Accounts | `/accounts` |
| Import | `/import` |
| Watchlist | `/watchlist` |

## Supported Institutions

| Institution | Method |
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
