# ptraker-client

React frontend for **portfolioTraker** — a personal investment portfolio tracker.

## Overview

ptraker-client is a React + Vite + Ant Design v6 single-page application that:

- Authenticates users via the ptraker-api (Supabase Auth JWT)
- Displays a consolidated portfolio dashboard with live prices
- Shows net worth summary, per-account breakdowns, and position-level detail
- Supports CSV/QFX file import for position data
- Works on desktop and mobile (iPhone)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| UI Library | Ant Design v6 |
| Routing | React Router v7 |
| HTTP | Axios |
| State | React Context |

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
- Responsive — desktop sidebar collapses, mobile uses bottom tab bar
- Dashboard with collapsible account sections showing summary when collapsed
- Real-time price refresh with live UI update
- Color-coded gain/loss (green/red)

## Production Deployment

```bash
npm run build
```

Copy the `dist/` folder to your web server. Served as static files — no Node.js needed in production. On Jupiter VPS, served via Swag/Nginx for `ptraker.com`.

## Related

- [ptraker-api](https://github.com/dschoepel/ptraker-api) — Express/Node.js backend
