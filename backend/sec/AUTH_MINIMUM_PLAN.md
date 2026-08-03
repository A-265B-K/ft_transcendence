# Minimum Auth Plan for ft_transcendence

This is the smallest version of auth that still counts as a real security feature.

## Minimum version

Build this first:

<!--- email/password registration-->
<!--- email/password login-->
<!--- password hashing with Argon2id or bcrypt-->
<!--- a Postgres user table-->
- session-based auth with `httpOnly` cookies
- basic email verification
- websocket join protected by the authenticated session

Optional later:

- 2FA with TOTP
- Vault-backed secret storage
- ModSecurity / WAF hardening

## Recommended build order

<!--1. Create the Postgres user table.-->
<!--2. Implement register.-->
<!--3. Implement login.-->
4. Add session or cookie auth.
5. Add email verification.
6. Protect websocket join so only logged-in users can enter the game.
7. Add 2FA.
8. Add Vault integration.
9. Add WAF tuning.

## What to learn first

Start here and move down the stack:

1. **Password hashing**
   Learn the difference between hashing and encryption, and why bcrypt or Argon2id are used.

2. **Sessions vs JWTs**
   Learn how browser auth works, especially cookies, `httpOnly`, `secure`, and `sameSite`.

3. **SQL basics**
   Learn how to design tables for users, sessions, verification tokens, and 2FA data.

4. **TOTP 2FA**
   Learn how authenticator apps generate codes and how the server verifies them.

5. **Secrets management**
   Learn why secrets should not live in code or `.env` files long-term, and what Vault solves.

6. **Reverse proxy / WAF basics**
   Learn where Nginx sits, what ModSecurity does, and why websocket routes need special handling.

7. **CSRF and rate limiting**
   Learn how to protect cookie-based auth from brute force and abuse.

## Fastest useful focus

If the goal is to get a working secure auth system quickly, focus first on:

- password hashing
- sessions and cookies
- SQL schema design
- basic 2FA

Vault and WAF can come after the auth core is working.

## Day-by-day checklist

### Day 1: Model the data

- define the users table
- decide which fields are required and which are optional
- add a sessions table if you use cookie-based auth

### Day 2: Build registration

- create the register endpoint
- hash the password before storage
- store the new user in Postgres

### Day 3: Build login

- create the login endpoint
- verify the password hash
- issue a session or signed cookie

### Day 4: Protect the game entry

- require authentication before websocket join
- stop trusting the client-supplied user id
- load the authenticated user from the session

### Day 5: Add email verification

- generate a verification token
- send a verification email
- block gameplay until the email is verified

### Day 6: Add basic 2FA

- generate a TOTP secret
- show a QR code or manual setup key
- verify the one-time code during login

### Day 7: Harden the basics

- add rate limiting on login and registration
- add logout and session cleanup
- review any remaining plain-text secrets

### Later

- move secrets to Vault
- add ModSecurity / WAF tuning
- review CSRF and cookie settings