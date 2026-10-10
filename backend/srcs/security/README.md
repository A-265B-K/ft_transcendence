# Backend Security

This module contains the authentication, session, and 2FA logic for the ft_transcendence backend.

## Scope

The security code currently covers:

- user registration and login
- password hashing with bcrypt
- session creation and validation
- secure cookie handling
- TOTP-based two-factor authentication
- email verification flow
- Vault-backed credential retrieval for database and email providers

The code is organized under:

- `auth/` — registration and login logic
- `session/` — session lookup and authenticated-user checks
- `2FA/` — TOTP setup / verification flow
- `repository/` — database access for users and sessions
- `vault/` — Vault client used to fetch secrets at runtime
- `sec/` — security notes and roadmap

## Main security flows

### 1. Registration flow

The registration flow starts from the backend route `/api/auth/register` and goes through `registerUser()`.

What happens:

1. The server receives a username, email, and password.
2. The password is hashed with bcrypt.
3. A verification token is generated and hashed before being stored.
4. The user is inserted into the database via `insertUser()`.
5. A verification email is sent to the user with a link containing the raw token.

This ensures that the application never stores the password in plain text and that the verification token is not stored directly in the database.

Relevant code:

- `backend/srcs/security/auth/registration.ts`
- `backend/srcs/security/repository/userRepository.ts`
- `backend/srcs/security/vault/client.ts`

### 2. Sign-in flow

The sign-in flow is implemented in `SignInUser()`.

What happens:

1. The user submits an email and password.
2. The server fetches the user record by email.
3. The password is checked with `bcrypt.compare()`.
4. If the password is valid and 2FA is enabled, the backend issues a short-lived `temporary_auth` cookie and requires the user to confirm a TOTP code.
5. If 2FA is not enabled, the backend creates a session and stores a hashed session identifier in the database.
6. The client receives a secure `session_id` cookie.

This makes the browser session state explicit and allows the server to check whether the user is currently authenticated.

### 3. Session validation

Once a user is logged in, the backend validates the cookie on protected requests such as `/api/auth/me` and Socket.IO authentication.

The flow is:

1. Read `session_id` from the browser cookie.
2. Hash it with SHA-256.
3. Query the database for a valid session matching the hashed value.
4. Return the user context if the session is active.

This is an important security pattern because it avoids storing raw session identifiers in plain form and allows the backend to reject invalid or expired sessions.

### 4. Logout flow

The `/api/auth/logout` endpoint does two things:

- removes the current session record from the database
- clears the browser cookie

This ensures that the session cannot continue to be valid after logout.

### 5. 2FA flow

The TOTP system is implemented in `backend/srcs/security/2FA/twoFA.ts`.

The flow works like this:

1. The backend generates a TOTP secret.
2. The secret is stored in the user record.
3. A QR code is generated using the otplib library.
4. The user scans it in an authenticator app.
5. The user submits a code during login or setup confirmation.
6. The server verifies it with `otplib.verify()`.

The project currently stores the TOTP secret in the database and enables it per-user.

### 6. Email verification

The registration code also creates a verification token and sends an email with a link to verify the account.

The flow is designed to ensure that the user proves control of the email address before being treated as a valid account.

## Secure transport and cookie handling

The backend sets cookies with important security attributes:

- `httpOnly: true`
- `secure: true`
- `sameSite: 'strict'`
- limited lifetime for temporary codes or sessions

This reduces the risk of session cookies being exposed to JavaScript or cross-site abuse.

## Password and session hashing

The current implementation uses:

- `bcrypt.hash(password, 12)` for password storage
- `createHash('sha256')` for session-token hashing before DB persistence

This is a good baseline because it avoids comparing or storing raw session values directly. It also keeps password storage out of plain text.

## Vault integration

The backend reads secrets from HashiCorp Vault through `backend/srcs/security/vault/client.ts`.

Some examples:

- database credentials for Postgres
- email credentials for SMTP

The client reads the token from a mounted file and fetches secret data from Vault endpoints such as:

- `/v1/app/data/postgres-app`
- `/v1/app/data/email`

This keeps sensitive values out of source code and Docker compose files and is aligned with the repo’s broader Vault setup.

## Practical authentication model in this repo

The current flow matches the project’s intended architecture:

- register a user with email + password
- hash password with bcrypt
- verify email
- optionally enable TOTP
- create HTTP-only secure session cookies
- authorize the websocket only after a valid session is found

This creates a solid foundation for a more robust game authentication system.

## Summary

The backend security module is the authentication core of the app. It already covers the fundamental pieces of a browser-based auth flow: registration, password hashing, session cookies, session validation, and 2FA.