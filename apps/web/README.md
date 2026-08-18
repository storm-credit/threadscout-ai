# apps/web

The application server and the mobile-first client.

- `server.mjs` — local single process; static assets from an allowlist; no outbound network call on any path
- `src/service.mjs` — the only place a client value becomes durable state; enforces the command rule
- `src/api.mjs` — pure request router, testable without a socket
- `public/` — the Opportunity Inbox, verified at 360 px

The browser holds no durable decision. Closing a tab, reloading, or opening a second window cannot lose or fork one.

```bash
npm start
```
