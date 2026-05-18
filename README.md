# ptraker-client

React frontend for **portfolioTraker** — a personal investment portfolio tracker.

## Overview

ptraker-client is a React + Vite + Ant Design v6 single-page application that:

- Authenticates users via the ptraker-api (Supabase Auth JWT)
- Displays a consolidated portfolio dashboard with live Yahoo Finance prices
- Shows net worth summary, per-account breakdowns, and position-level detail
- Supports CSV/QFX file import for position data from multiple institutions
- Works on desktop and mobile (iPhone)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| UI Library | Ant Design v6 |
| Routing | React Router v7 |
| HTTP | Axios |
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
npm run preview # preview production build locally
```

## Features

- Dark/light mode based on system preference
- Brand colors from portfolioTraker logo (gold `#f5a623` on dark `#1a1d23`)
- Responsive — desktop sidebar, mobile bottom tab bar
- Dashboard with collapsible account sections
- Last import timestamp per account with freshness indicator
- Real-time price refresh with live UI update
- Color-coded gain/loss (green/red)
- Full account management (create, edit, deactivate, delete)
- 3-step import wizard with history log
- Password reset via email flow

## Pages

| Page | Path | Description |
|---|---|---|
| Login | `/login` | Email/password sign in |
| Reset Password | `/reset-password` | Set new password from email link |
| Dashboard | `/dashboard` | Portfolio overview |
| Accounts | `/accounts` | Manage financial accounts |
| Import | `/import` | Import CSV/QFX position files |

## Production Deployment

```bash
npm run build
```

Copy `dist/` to your web server. Served as static files — no Node.js needed.
On Jupiter VPS, served via Swag/Nginx for `ptraker.com`.

## Related

- [ptraker-api](https://github.com/dschoepel/ptraker-api) — Express/Node.js backend
