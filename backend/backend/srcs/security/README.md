# Security

Backend security implementation lives here.

## Suggested layout

- `auth/` for register, login, logout, password hashing, and 2FA flows
- `persistence/` for database access and repositories
- `sessions/` for session or refresh-token handling
- `secrets/` for Vault-backed secret loading and config access
- `guards/` for auth checks and reusable request/socket guards
- `twofa/` for TOTP setup, verification, and backup codes

Keep WAF and ModSecurity outside this tree in `docker/nginx/`.