# ptraker-client

React frontend for **portfolioTraker** — personal investment portfolio tracker.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| UI Library | Ant Design v6 |
| Routing | React Router v7 |
| HTTP | Axios (auth interceptor + 401 refresh) |
| Charts | Recharts |
| Auth | @supabase/supabase-js |

## Quick Start
```bash
git clone https://github.com/dschoepel/ptraker-client
cd ptraker-client
npm install
cp .env.example .env   # fill in values
npm run dev            # port 5173
```

## Pages
| Page | Access | Notes |
|---|---|---|
| Dashboard | All | Portfolio view + Analytics charts tab |
| Accounts | admin, user | Desktop table + mobile card view |
| Import | admin, user | Multi-account file import + manual entry |
| Watchlist | All | Tickers with 30-day sparklines |
| Profile | All | Privacy, sharing, upgrade request, export |
| Admin | admin | User management, invites, notifications |

## Related
- [ptraker-api](https://github.com/dschoepel/ptraker-api) — Express/Node.js backend
- [ARCHITECTURE.md](../ptraker-api/ARCHITECTURE.md) — full system design and developer guide
