# ptraker-client

React frontend for **portfolioTraker** — a personal investment portfolio tracker.

## Overview

Tracks $2M+ across 6 accounts (LPL brokerage/retirement, CFCU bank, Schwab).
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
- Dashboard with collapsible account sections and last import timestamp
- Cash accounts show `—` for gain/loss (not misleading green)
- Real-time price refresh via Yahoo Finance
- Full account management (create, edit, deactivate, delete)
- Import wizard: CSV/QFX file upload + manual balance entry
- Sync-delete: removes positions no longer in export file
- Watchlist with 30-day sparkline charts
- Yahoo Finance symbol autocomplete search
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

## Production

```bash
npm run build
```

Static files served via Swag/Nginx on Jupiter VPS for `ptraker.com`.

## Related

- [ptraker-api](https://github.com/dschoepel/ptraker-api) — Express/Node.js backend
