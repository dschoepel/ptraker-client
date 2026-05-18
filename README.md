# ptraker-client

React frontend for **portfolioTraker** — a personal investment portfolio tracker.

## Overview

ptraker-client is a React + Vite + Ant Design v6 single-page application that:

- Authenticates users via Supabase Auth JWT
- Displays a consolidated portfolio dashboard with live Yahoo Finance prices
- Shows net worth summary, per-account breakdowns, and position-level detail
- Supports CSV/QFX file import with sync-delete for removed positions
- Watchlist with 30-day sparkline charts and symbol search
- Works on desktop and mobile (iPhone)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| UI Library | Ant Design v6 |
| Routing | React Router v7 |
| HTTP | Axios |
| Charts | Recharts |
| Auth (direct) | @supabase/supabase-js |

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

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=http://your-supabase-host:8100
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running

```bash
npm run dev     # development — http://localhost:5173
npm run build   # production build → dist/
npm run preview # preview production build
```

## Features

- Dark/light mode based on system preference
- Brand colors: gold `#f5a623` on dark `#1a1d23`
- Responsive — desktop sidebar, mobile bottom tab bar
- Dashboard with collapsible account sections and last import timestamp
- Real-time price refresh
- Color-coded gain/loss
- Full account management (create, edit, deactivate, delete)
- 3-step import wizard with sync-delete and watchlist integration
- Watchlist with 30-day sparkline charts and Yahoo Finance symbol search
- Password reset via email

## Pages

| Page | Path | Description |
|---|---|---|
| Login | `/login` | Email/password sign in |
| Reset Password | `/reset-password` | Set new password |
| Dashboard | `/dashboard` | Portfolio overview |
| Accounts | `/accounts` | Manage financial accounts |
| Import | `/import` | Import CSV/QFX files |
| Watchlist | `/watchlist` | Track securities of interest |

## Production Deployment

```bash
npm run build
```

Copy `dist/` to your web server. Static files — no Node.js needed.
Served via Swag/Nginx on Jupiter VPS for `ptraker.com`.

## Related

- [ptraker-api](https://github.com/dschoepel/ptraker-api) — Express/Node.js backend
