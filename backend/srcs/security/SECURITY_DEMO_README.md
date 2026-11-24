# ft_transcendence — Security Architecture & Demo Guide

A quick reference for presenting the project's security framework, reproducing
WAF tests, and locating logs. Run commands from the repository root
(`~/Codam/ft_transcendence_main_backup`) with the Docker Compose stack running.

## 1. Framework and architecture

| Layer      | Technology                              | Purpose                                        |
| ---------- | --------------------------------------- | ---------------------------------------------- |
| Frontend   | React + Vite                            | Browser UI and multiplayer game                |
| Backend    | Fastify 5 + TypeScript                  | REST API, authentication and game server       |
| Real-time  | Socket.IO                               | Multiplayer communication                      |
| Database   | PostgreSQL 18                           | Users, sessions, failed-attempt counters       |
| Secrets    | HashiCorp Vault                         | Database credentials and secret management     |
| Edge       | NGINX HTTPS reverse proxy               | Public entry point on `https://localhost:8443` |
| WAF        | ModSecurity + OWASP Core Rule Set (CRS) | Blocks malicious HTTP requests                 |
| Metrics    | NGINX exporter + Prometheus             | NGINX health and traffic metrics               |
| Dashboards | Grafana                                 | Monitoring UI                                  |
| Deployment | Docker Compose                          | Service isolation and networking               |

**Traffic path:** Browser → HTTPS NGINX + ModSecurity/CRS → Fastify/Socket.IO →
PostgreSQL/Vault. Prometheus collects metrics from exporters, and Grafana
displays them.

**Docker networks:** `edge`, `database` (internal), `monitoring`, `secrets`
(internal). Internal networks restrict external connectivity; they do not make
every container or request inherently trusted.

### Security controls implemented

- WAF in blocking mode, CRS paranoia level 1, inbound anomaly threshold 5.
- SQL injection, XSS, and disallowed content-type blocking tested.
- Narrow Socket.IO exception for CRS rule `920420` on legitimate polling
  `text/plain` POSTs; other rules remain active.
- Identity-based rate limiting for sign-in, registration, and four 2FA
  endpoints, with an IP fallback when the identity is unavailable.
- Five failed passwords → 5-minute account cooldown (sequential tests validated;
  concurrent-login race hardening deferred).
- Five incorrect 2FA codes → temporary authentication token locked;
  transaction-safe consumption of successful temporary token.
- Structured Fastify security logs.

## 2. Basic service checks

```bash
docker compose -f docker-compose.yaml ps
docker compose -f docker-compose.yaml exec nginx_prod nginx -t
curl -ki 'https://localhost:8443/api/ping'
```

Expected: running services, valid NGINX configuration, and HTTP **200** with
`{"ok":true}`. `curl -k` accepts the local development certificate; do not use
`-k` as a production TLS validation strategy.

## 3. Live WAF demonstrations

Run each command individually, then immediately inspect the WAF logs (section
4).

### A. Normal request — allowed

```bash
curl -ki 'https://localhost:8443/api/ping?waf_log_test=normal'
```

**Expected:** HTTP **200**. With ModSecurity audit logging set to
`RelevantOnly`, a successful normal request may **not** appear in the audit log.

### B. SQL injection — blocked

```bash
curl -ki 'https://localhost:8443/api/ping?id=1%27%20OR%201%3D1--'
```

**Expected:** HTTP **403**. Previously observed CRS IDs: **942100** (SQLi) and
**949110** (inbound anomaly blocking).

### C. Cross-site scripting (XSS) — blocked

```bash
curl -ki 'https://localhost:8443/api/ping?name=%3Cscript%3Ealert(1)%3C%2Fscript%3E'
```

**Expected:** HTTP **403**. Previously observed XSS rule IDs **941100**,
**941110**, **941160**, **941390**, plus **949110**.

### D. Unsupported API content type — blocked

```bash
curl -ki -X POST 'https://localhost:8443/api/ping' \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  --data 'test'
```

**Expected:** HTTP **403**. Previously observed rules **920420** and **949110**.

### E. Socket.IO exception is narrow — unsupported content type still blocked

```bash
curl -ki -X POST \
  'https://localhost:8443/socket.io/?EIO=4&transport=polling' \
  -H 'Content-Type: application/x-waf-test' \
  --data 'test'
```

**Expected:** HTTP **403** (rules **920420** and **949110**). This shows
Socket.IO is **not globally excluded** from WAF inspection.

**Legitimate Socket.IO test:** Use the real application to create/join a
multiplayer room and play through the HTTPS proxy. A standalone polling POST
without a valid Engine.IO session is _not_ a reliable successful-handshake test.

**Optional distinction:** A Socket.IO POST with `Content-Type: application/xml`
previously returned HTTP **400** from Engine.IO (`Bad handshake method`), rather
than a WAF 403. Application rejection and WAF blocking are different.

## 4. Where to find every log

All examples use `docker compose -f docker-compose.yaml` and show container
stdout/stderr; whether separate log files exist depends on the running container
configuration.

| What you want to show                     | Service          | Command / event                                                                                 |
| ----------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **WAF rule matches / blocked requests**   | `nginx_prod`     | `docker compose -f docker-compose.yaml logs --tail=200 nginx_prod`                              |
| **Live WAF logs**                         | `nginx_prod`     | `docker compose -f docker-compose.yaml logs -f nginx_prod`                                      |
| **Fastify API requests / response codes** | `backend`        | `docker compose -f docker-compose.yaml logs --tail=100 backend`                                 |
| **Live API logs**                         | `backend`        | `docker compose -f docker-compose.yaml logs -f backend`                                         |
| **Login rate-limit event**                | `backend`        | `auth.login.rate_limited`                                                                       |
| **Registration rate-limit event**         | `backend`        | `auth.register.rate_limited`                                                                    |
| **2FA verify rate-limit event**           | `backend`        | `auth.2fa.rate_limited`                                                                         |
| **2FA setup / confirm / disable limits**  | `backend`        | `auth.2fa.setup.rate_limited`, `auth.2fa.confirm.rate_limited`, `auth.2fa.disable.rate_limited` |
| **Five incorrect 2FA codes**              | `backend`        | `auth.2fa.temporary_auth_locked`                                                                |
| **Failed sign-in**                        | `backend`        | `auth.login.failed`                                                                             |
| **PostgreSQL server messages**            | `postgres`       | `docker compose -f docker-compose.yaml logs --tail=100 postgres`                                |
| **Vault server messages**                 | `vault`          | `docker compose -f docker-compose.yaml logs --tail=100 vault`                                   |
| **Prometheus server messages**            | `prometheus`     | `docker compose -f docker-compose.yaml logs --tail=100 prometheus`                              |
| **Grafana server messages**               | `grafana`        | `docker compose -f docker-compose.yaml logs --tail=100 grafana`                                 |
| **NGINX exporter messages**               | `nginx_exporter` | `docker compose -f docker-compose.yaml logs --tail=100 nginx_exporter`                          |
| **Backup service messages**               | `backups`        | `docker compose -f docker-compose.yaml logs --tail=100 backups`                                 |

### WAF logs: find the rule IDs

```bash
docker compose -f docker-compose.yaml logs --since=5m nginx_prod \
  | grep -E '942100|941100|920420|949110|ModSecurity|ruleId'
```

Look for the matching CRS rule ID, anomaly score, and an interrupted/denied
transaction. WAF logs may contain request details: redact sensitive data before
sharing screenshots. `RelevantOnly` means successful traffic is not necessarily
audited.

### Backend logs: find HTTP 401, 403, 429, or 500

```bash
docker compose -f docker-compose.yaml logs --since=10m backend \
  | grep -E '"statusCode":(401|403|429|500)'
```

Fastify logs `incoming request` and `request completed` separately. Match their
**`reqId`** values to link a request to its response. A request blocked by
NGINX/WAF might never reach Fastify, so it may **not** appear in backend logs.

### Backend security events

```bash
docker compose -f docker-compose.yaml logs backend \
  | grep -E 'auth\.(login|register|2fa)\.'
```

For only temporary 2FA lockouts:

```bash
docker compose -f docker-compose.yaml logs backend \
  | grep 'auth.2fa.temporary_auth_locked'
```

For rate-limit violations:

```bash
docker compose -f docker-compose.yaml logs backend \
  | grep 'rate_limited'
```

**Important:** Five incorrect 2FA codes trigger the **temporary-token lockout**,
not necessarily the request limiter. The **sixth** request within one minute is
the one expected to hit the verify endpoint's limit and return **429**. An
account login cooldown currently has database state but no confirmed dedicated
`auth.login.account_locked` event.

## 5. Authentication demo (use a test account)

| Mechanism         | Test                                                                 | Expected evidence                                                                          |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Login rate limit  | More than 5 sign-in requests in 1 minute for one account             | HTTP **429**, `auth.login.rate_limited` in backend logs                                    |
| Account cooldown  | 5 incorrect passwords, then correct password after rate-limit window | Login still rejected for 5 minutes; database lock timestamp                                |
| 2FA token lockout | Sign in to a 2FA-enabled test account; enter 5 incorrect codes       | Five HTTP **401** responses; fifth prompts sign-in again; `auth.2fa.temporary_auth_locked` |
| 2FA rate limit    | More than 5 verify requests in 1 minute for one temporary login      | HTTP **429**, `auth.2fa.rate_limited`                                                      |

**Do not confuse 401 with 429:** **401** means authentication was rejected;
**429** means the request rate limit was exceeded. Avoid real users' accounts
and don't log passwords, TOTP codes, session cookies, or temporary tokens.

### Read lockout state in PostgreSQL (read-only)

```bash
docker compose -f docker-compose.yaml exec postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
    SELECT failed_login_attempts,
           login_locked_until,
           login_locked_until > NOW() AS currently_locked
    FROM users
    WHERE failed_login_attempts > 0 OR login_locked_until IS NOT NULL;
  "'
```

```bash
docker compose -f docker-compose.yaml exec postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
    SELECT temporary_auth_failed_attempts,
           temporary_auth_expires_at
    FROM session_
    WHERE temporary_auth_failed_attempts > 0
    ORDER BY temporary_auth_expires_at DESC
    LIMIT 5;
  "'
```

The second query may show expired temporary records; expiration and
failed-attempt checks prevent their use. Avoid showing email addresses or
session hashes during a demo.

## 6. Monitoring demonstration

**Grafana via HTTPS proxy:**

```bash
curl -ki --resolve monitoring.localhost:8443:127.0.0.1 \
  'https://monitoring.localhost:8443/login'
```

Previously observed: HTTP **200** with Grafana HTML. This alone does not prove
the dashboard's data sources work.

**Prometheus: query the NGINX exporter health metric:**

```bash
docker compose -f docker-compose.yaml exec prometheus \
  wget -qO- 'http://localhost:9090/api/v1/query?query=nginx_up'
```

Expected: a successful JSON response containing a sample value of **`1`**
(`nginx_up 1`). Request and connection counts vary.

## 7. Useful code and configuration locations

| Path                                                    | What it contains                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| `backend/srcs/server.ts`                                | Fastify setup, cookie and rate-limit plugins, route registration |
| `backend/srcs/server/auth.ts`                           | Sign-in/registration endpoints and rate limits                   |
| `backend/srcs/server/twoFactor.ts`                      | 2FA endpoints, rate limits, token lockout log                    |
| `backend/srcs/security/auth/signin.ts`                  | Password check, account cooldown, session/2FA branch             |
| `backend/srcs/security/repository/userRepository.ts`    | Failed-login counters and lock timestamp SQL                     |
| `backend/srcs/security/repository/sessionRepository.ts` | Temporary 2FA attempts and transactional session creation        |
| `backend/srcs/security/auth/db.ts`                      | PostgreSQL connection pool                                       |
| `postgres/init/01_schema.sql`                           | Database schema for fresh initialization                         |
| `nginx/waf/waf_prod.Dockerfile`                         | WAF image configuration                                          |
| `nginx/waf/socketio-exclusions.conf`                    | Narrow Socket.IO CRS exception                                   |
| `nginx/waf/modsecurity-override.conf.template`          | ModSecurity override configuration                               |
| `docker-compose.yaml`                                   | Services and networks                                            |

## 8. Known limitations / demo notes

- The account cooldown has been tested sequentially, **not** hardened against
  concurrent login races.
- Password-reset rate limiting is not yet implemented.
- CSRF, Socket.IO event-level authorization, comprehensive input validation,
  security headers, and container least-privilege hardening still require
  review.
- The existing WAF integration report predates the later 2FA fixes; its deferred
  2FA status is historical, not the current authentication-test status.
- Re-run these commands after changes. Exact CRS rule IDs and behavior may
  change with rule updates.
- Avoid `make fclean` for a demonstration: it can delete named database/Vault
  volumes.

**Demo sequence:** Show normal `200` → SQLi `403` + WAF rule ID → XSS `403` +
WAF rule ID → unsupported Socket.IO content type `403` → backend `429` security
event → 2FA temporary-token lockout event → database counter → Prometheus
`nginx_up`.
