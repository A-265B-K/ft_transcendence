# NGINX WAF

This directory contains the production-style HTTPS gateway for
ft_transcendence. It combines NGINX, ModSecurity and the OWASP Core Rule Set
(CRS) to protect the application while forwarding frontend, API, Socket.IO
and Grafana traffic to the appropriate services.

The WAF is built by
[`waf_prod.Dockerfile`](waf_prod.Dockerfile) and started as the `nginx_prod`
service in [`docker-compose.yaml`](../../docker-compose.yaml). The local
HTTPS entry point is:

```text
https://localhost:8443
```

## What this configuration does

- Terminates HTTPS and disables NGINX version headers.
- Serves the built React frontend and legal pages.
- Proxies `/api/` and `/socket.io/` to the backend.
- Preserves WebSocket and long-polling headers for Socket.IO.
- Proxies `monitoring.localhost` to Grafana.
- Exposes internal NGINX status on port `3001` for the NGINX exporter.
- Runs ModSecurity with the OWASP CRS in blocking mode.
- Applies a narrowly scoped Socket.IO exception for CRS rule `920420`.

The main configuration files are:

- [`waf_prod.Dockerfile`](waf_prod.Dockerfile) — WAF image and build inputs
- [`prod.conf.template`](prod.conf.template) — NGINX routing and TLS server blocks
- [`modsecurity-override.conf.template`](modsecurity-override.conf.template) — CRS override include
- [`socketio-exclusions.conf`](socketio-exclusions.conf) — Socket.IO compatibility rule

## Running the WAF

Initialize the project and start the production-like stack from the repository
root:

```bash
make init
make prod
```

The normal startup flow starts Vault and the dependent services before
starting `nginx_prod`. Check the service status with:

```bash
docker compose -f docker-compose.yaml ps
```

The commands in this README assume the stack is already running. They are
manual diagnostic checks, not an automated penetration test or a replacement
for application regression testing.

## ModSecurity settings

The Compose configuration currently uses:

- Rule engine: `On`
- Blocking paranoia level: `1`
- Inbound anomaly threshold: `5`
- Audit engine: `RelevantOnly`
- HTTPS port: `8443`

The Socket.IO exception disables **only CRS rule `920420`** for `POST` requests
under `/socket.io/` with a `text/plain` content type, optionally followed by
parameters such as `charset=UTF-8`. All other CRS rules remain active. Treat
[`socketio-exclusions.conf`](socketio-exclusions.conf) as the source of truth
if this description and the rule differ.

## Socket.IO exception

Socket.IO's HTTP long-polling transport sends legitimate POST requests with
`Content-Type: text/plain;charset=UTF-8`. CRS rule `920420` rejects content
types outside its configured allowlist. Without the exception, this produces
anomaly score 5 and triggers rule `949110`, returning HTTP 403 and preventing
room creation.

The exception is intentionally limited to:

1. A URI beginning with `/socket.io/`;
2. The `POST` method;
3. A `text/plain` content type, including optional parameters.

Do not disable ModSecurity, remove `920420` globally, or exempt the entire
Socket.IO endpoint from all CRS rules.

## Verification status

The following manual checks have been performed against the Docker Compose
HTTPS environment. Re-run the relevant checks after changing WAF rules,
routing, proxy headers or application code.

## 1. Configuration under test

- WAF container: `nginx_prod`, built from `nginx/waf/waf_prod.Dockerfile` using the OWASP ModSecurity CRS NGINX image.
- ModSecurity rule engine: `On`.
- Blocking paranoia level: `1` (`BLOCKING_PARANOIA=1`).
- Inbound anomaly threshold: `5` (`ANOMALY_INBOUND=5`).
- Audit engine: `RelevantOnly` (`MODSEC_AUDIT_ENGINE=RelevantOnly`).
- HTTPS entry point: port `8443`.
- Reverse-proxied application routes: `/api/` and `/socket.io/`; frontend served as a React SPA.
- Application-specific exclusions: `nginx/waf/socketio-exclusions.conf`, included before CRS rules via `nginx/waf/modsecurity-override.conf.template`.

The Socket.IO exclusion is intended to disable **only CRS rule `920420`** for **POST** requests under `/socket.io/` whose `Content-Type` is `text/plain` (optionally followed by parameters such as `charset=UTF-8`). All other CRS rules remain active. Check the actual rule file before treating this description as the final source of truth.

## 2. Test matrix

**Legend:** PASS = observed expected behavior; DEFERRED = not currently testable; PARTIAL = endpoint checked but full browser flow not verified.

| ID | Area | Test | Observed result | Status |
| --- | --- | --- | --- | --- |
| SEC-01 | Configuration | `nginx -t` and CRS loading | NGINX configuration valid; 856 rules reported loaded | PASS |
| SEC-02 | SQL injection | SQLi query to `/api/ping` | HTTP 403; audit IDs `942100`, `949110`; inbound score 5 | PASS |
| SEC-03 | XSS | Script payload in `/api/ping` query | HTTP 403; audit IDs `941100`, `941110`, `941160`, `941390`, `949110`; score 20 | PASS |
| SEC-04 | Content type | `text/plain` POST to `/api/ping` | HTTP 403; audit IDs `920420`, `949110` | PASS |
| SEC-05 | Audit logging | Inspect denied-request logs | JSON audit entries contain rule IDs and interruption information | PASS |
| SEC-06 | Audit logging | Normal `/api/ping?waf_log_test=normal` | HTTP 200; no audit entry observed under `RelevantOnly` | PASS |
| EXC-01 | Socket.IO | Legitimate polling POST with `text/plain;charset=UTF-8` | Room creation and joining work after exclusion | PASS |
| EXC-02 | Socket.IO | Unsupported `application/x-waf-test` POST | HTTP 403; `920420` and `949110`; request interrupted | PASS |
| EXC-03 | Socket.IO | `application/xml` POST | HTTP 400 from Engine.IO (`Bad handshake method`), not a WAF block | PASS (expected backend rejection) |
| EXC-04 | Exclusion scope | Narrowed rule to method, path and content type | Legitimate Socket.IO behavior preserved; disallowed content type still blocked | PASS (behavioral) |
| APP-01 | Frontend | GET `/` | HTTP 200; React app served | PASS |
| APP-02 | Frontend | GET `/game-menu` | HTTP 200; React app served | PASS |
| APP-03 | API | GET `/api/ping` | HTTP 200; `{"ok":true}` | PASS |
| APP-04 | Multiplayer | Create and join rooms | Working through WAF | PASS |
| APP-05 | Multiplayer | Full match / gameplay regression | User reported gameplay working | PASS (manual) |
| APP-06 | Email verification | Verify email via application flow | HTTP 302 to `/game-menu`; verification worked | PASS |
| APP-07 | Legal pages | GET `/privacy`, `/terms`, `/legal.css` | All HTTP 200 | PASS |
| APP-08 | 2FA setup | Open `/enable-2fa` | HTTP 200 with no HTTP redirect; browser returns home; route may fall through to SPA | DEFERRED |
| APP-09 | 2FA login | Complete 2FA authentication | Not tested; application route needs investigation | DEFERRED |
| MON-01 | Grafana proxy | GET `https://monitoring.localhost:8443/login` | HTTP 200; Grafana HTML served | PASS |
| MON-02 | Grafana UI | Dashboard assets, login and metric visualization | Not verified end-to-end in browser | PARTIAL |
| MON-03 | NGINX exporter | Read `/metrics` from Compose network | `nginx_up 1`, `nginx_connections_active 5`, `nginx_http_requests_total 441` | PASS |
| MON-04 | Prometheus | Query `nginx_up` through Prometheus API | User reported success; exact JSON value not retained | PASS (reported; verify value `1`) |

## 3. Reproduction commands

Run these from the repository root with the stack already started using the project's normal **Vault-aware startup process**. The commands below are diagnostic and do not replace that startup process.

### 3.1 NGINX configuration

```bash
docker compose -f docker-compose.yaml exec nginx_prod nginx -t
```

### 3.2 Normal application responses

```bash
curl -ki 'https://localhost:8443/'
curl -ki 'https://localhost:8443/game-menu'
curl -ki 'https://localhost:8443/api/ping'
curl -ki 'https://localhost:8443/privacy'
curl -ki 'https://localhost:8443/terms'
curl -ki 'https://localhost:8443/legal.css'
```

Expected: HTTP 200 for these paths. For `/api/ping`, expect `{"ok":true}`.

### 3.3 SQL injection blocking

```bash
curl -ki 'https://localhost:8443/api/ping?id=1%27%20OR%201%3D1--'
```

Expected: HTTP 403; audit rules `942100` and `949110`.

### 3.4 XSS blocking

```bash
curl -ki 'https://localhost:8443/api/ping?name=%3Cscript%3Ealert(1)%3C%2Fscript%3E'
```

Expected: HTTP 403; XSS detection rules and `949110`.

### 3.5 Content-type enforcement on the API

```bash
curl -ki -X POST 'https://localhost:8443/api/ping' \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  --data 'test'
```

Expected: HTTP 403; rules `920420` and `949110`.

### 3.6 Socket.IO exclusion boundary

```bash
curl -ki -X POST \
  'https://localhost:8443/socket.io/?EIO=4&transport=polling' \
  -H 'Content-Type: application/x-waf-test' \
  --data 'test'
```

Expected: HTTP 403; rules `920420` and `949110`. This demonstrates that the Socket.IO path is **not globally exempted** from content-type checks.

Optional comparison:

```bash
curl -ki -X POST \
  'https://localhost:8443/socket.io/?EIO=4&transport=polling' \
  -H 'Content-Type: application/xml' \
  --data 'test'
```

Observed: HTTP 400 from Engine.IO, because `application/xml` was accepted by the CRS content-type policy but rejected by the application protocol. **A backend 400 is not a WAF failure.**

> A standalone Socket.IO polling POST without a valid Engine.IO session is not a reliable success test. Use the real application to verify room creation, joining and gameplay.

### 3.7 Audit logs

```bash
docker compose -f docker-compose.yaml logs --tail=200 nginx_prod
```

For blocked requests, look for JSON ModSecurity audit entries containing `ruleId` / rule IDs and an interrupted transaction. With `RelevantOnly`, ordinary successful requests may not produce audit entries.

### 3.8 Grafana reverse proxy

```bash
curl -ki --resolve monitoring.localhost:8443:127.0.0.1 \
  'https://monitoring.localhost:8443/login'
```

Expected: HTTP 200 and Grafana HTML. This does **not** independently verify dashboard login or data-source queries.

### 3.9 NGINX exporter

The exporter image does not include `wget`. Query it from a container with Node.js on the Compose network:

```bash
docker compose -f docker-compose.yaml run --rm --no-deps \
  --entrypoint sh backend \
  -c 'node -e "
    fetch(\"http://nginx_exporter:9113/metrics\")
      .then(r => r.text())
      .then(t => console.log(
        t.split(\"\\n\")
         .filter(l => /^(nginx_up|nginx_connections_active|nginx_http_requests_total)/.test(l))
         .join(\"\\n\")
      ))
      .catch(e => { console.error(e); process.exit(1); });
  "'
```

Observed during testing:

```text
nginx_connections_active 5
nginx_http_requests_total 441
nginx_up 1
```

Connection and request counts are snapshots and will change. The important health value is `nginx_up 1`.

### 3.10 Prometheus query

```bash
docker compose -f docker-compose.yaml exec prometheus \
  wget -qO- 'http://localhost:9090/api/v1/query?query=nginx_up'
```

Expected: JSON with `"status":"success"` and a non-empty result containing a sample value of `"1"`. An API response with `"status":"success"` **alone** does not prove the exporter is healthy: also check the result value.

### 3.11 2FA route diagnosis

```bash
curl -ks -o /dev/null \
  -w 'HTTP %{http_code}\nRedirect: %{redirect_url}\n' \
  'https://localhost:8443/enable-2fa'
```

Observed:

```text
HTTP 200
Redirect:
```

This shows no HTTP-level redirect or WAF 403 for this request. The subsequent navigation to the home page appears to happen in the frontend, potentially because of SPA fallback, React routing or an application guard. **The precise cause has not been confirmed.** Re-test setup and login once the intended 2FA route is restored.

## Remaining work

- [ ] Verify Grafana assets, authentication and at least one live NGINX metric in a browser dashboard.

## Summary

The observed tests support that the WAF blocks representative SQLi and XSS payloads, enforces content-type policy, records relevant audit events, and allows the tested application and multiplayer flows. The narrowly scoped Socket.IO exception resolves a legitimate protocol compatibility issue without allowing an arbitrary unsupported content type on that endpoint. NGINX metrics are exposed successfully and Prometheus query success was reported. Grafana's interactive dashboard flow remains **partially verified**.
