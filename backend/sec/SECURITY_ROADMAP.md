# Security Roadmap for ft_transcendence

This project should stay self-hosted inside Docker for 42, so the clean path is to add account security first, then secrets management, then edge hardening.

## 1. Establish identity and persistence

Goal: stop treating a websocket `join` payload as identity.

What to do:
- Add a real user model in Postgres with `email`, `password_hash`, `email_verified`, `created_at`, and later `totp_secret`.
- Add a session or refresh-token model so login survives page reloads.
- Replace the current in-memory `mockDB` in `backend/backend/srcs/state/gameState.js` with a repository layer that talks to Postgres.
- Keep the current game room state in memory for now, but make it reference a real authenticated `userId`.

Current files involved:
- [backend/backend/srcs/server.js](backend/backend/srcs/server.js)
- [backend/backend/srcs/onConnection.js](backend/backend/srcs/onConnection.js)
- [backend/backend/srcs/state/gameState.js](backend/backend/srcs/state/gameState.js)
- [docker-compose.yaml](docker-compose.yaml)

## 2. Build email/password auth

Goal: add register/login/logout before touching 2FA.

What to do:
- Add backend routes for register, login, logout, and session refresh.
- Hash passwords with Argon2id or bcrypt; never store raw passwords.
- Use per-password salt through the hashing library, not manual salt storage.
- Verify email before allowing a user into the game.
- Prefer httpOnly secure cookies for session transport in the browser.

Frontend changes:
- Replace the current name-only menu in [frontend/src/pages/Menu.tsx](frontend/src/pages/Menu.tsx) with register/login forms.
- Keep [frontend/src/App.tsx](frontend/src/App.tsx) as the screen switcher, but gate `GameCanvas` behind auth state.
- Only create/connect the socket after auth succeeds.

## 3. Add 2FA

Goal: make 2FA an account property, not a separate login mode.

What to do:
- Add TOTP setup after the password flow works.
- Store the TOTP secret encrypted at rest or in Vault, not in plain DB fields.
- Generate backup codes and store only hashed backup codes.
- Make 2FA optional per account if you want a smoother rollout.
- Require the second factor before issuing the final session or before allowing the websocket join.

Backend files likely to grow:
- new auth routes and service modules under `backend/backend/srcs/`
- session handling inside `backend/backend/srcs/server.js`
- websocket auth gating in `backend/backend/srcs/onConnection.js`

## 4. Introduce Vault for secrets

Goal: move credentials out of compose and into a dedicated secret store.

What to store in Vault:
- database credentials
- session or JWT signing keys
- email provider credentials
- TOTP-related encryption keys
- any future API keys

What to do:
- Add a Vault service with its own persistent volume.
- Use Vault Agent or rendered files so the backend gets secrets at runtime.
- Keep application code reading from environment variables or files only.
- Remove hardcoded secret values from `docker-compose.yaml`.

Important 42 note:
- Keep Vault self-hosted in the Docker stack; do not rely on a third-party hosted secret service.

## 5. Put ModSecurity/WAF at the edge

Goal: harden the public edge after auth exists.

What to do:
- Replace the plain Nginx edge with an Nginx + ModSecurity build.
- Start in detection mode first, then switch to blocking after tuning.
- Keep websocket upgrade paths working for `/socket.io/`.
- Write explicit allow rules for the routes that must accept browser traffic.
- Make login and registration endpoints the main WAF focus.

Files involved:
- [docker/nginx/config.conf](docker/nginx/config.conf)
- [docker-compose.yaml](docker-compose.yaml)

## 6. Add hardening around the auth flow

Goal: reduce brute force and abuse.

What to do:
- Add rate limiting on register/login/2FA endpoints.
- Add login backoff or temporary lockout after repeated failures.
- Log auth events and suspicious websocket joins.
- Add CSRF protection if you use cookies for browser sessions.
- Validate input strictly server-side.

## Recommended order for this repo

1. Add Postgres-backed user/session storage.
2. Implement register/login/logout with password hashing.
3. Add email verification.
4. Add TOTP 2FA and backup codes.
5. Gate websocket joins on authenticated sessions.
6. Add Vault and remove secrets from compose.
7. Add ModSecurity/WAF at the Nginx edge and tune it.
8. Add rate limiting, lockout, and audit logging.

## Practical 42 constraint

For ft_transcendence, the safest approach is to keep the whole stack inside the project Docker environment and avoid external SaaS dependencies unless the project explicitly allows them. That means self-hosted auth, self-hosted Vault, and a WAF in front of your existing Nginx entrypoint.