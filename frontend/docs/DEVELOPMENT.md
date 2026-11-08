# Frontend Development

## Local commands

Run from `frontend/`:

```bash
npm ci
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run preview
```

There is no configured test script or test framework.

## Docker development

The frontend Dockerfile uses `node:26.7.0-alpine`, installs the lockfile with
`npm ci`, changes to `/workspace/app`, and starts Vite on all interfaces. The
repository development compose file mounts the local frontend source at
`/workspace/app` and health-checks `http://127.0.0.1:5173/`.

From the repository root:

```bash
docker compose -f docker-compose-dev.yaml up --build frontend backend nginx_dev
```

The Vite proxy forwards `/api`, `/verify-email`, and `/setup-2fa` to
`http://backend:3000`. The frontend uses relative URLs, so proxy and
reverse-proxy routing must preserve both HTTP and Socket.IO traffic.

## TypeScript and lint conventions

`tsconfig.app.json` uses bundler resolution, React JSX, `noEmit`,
`noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
`tsconfig.node.json` covers `vite.config.ts`. `npm run build` uses the
TypeScript project references before Vite.

ESLint is configured in `eslint.config.js`; Prettier is invoked by package
scripts, with no separate Prettier config file tracked under `frontend/`.

## Troubleshooting

- If `/api` requests fail, run the backend and confirm the Vite proxy target
  `backend:3000` is reachable from the running frontend.
- If the app enters `/disconnected`, inspect the backend health endpoint
  `/api/ping`; three consecutive failures trigger the transition.
- If a game canvas is empty, inspect texture loading and confirm the route has a
  complete `JoinedPayload`.
- If socket handlers duplicate, check that the owning page's effect cleanup runs
  and that all code uses the singleton from `src/socket.ts`.
- If a translation key is missing, add it to all four locale files.
