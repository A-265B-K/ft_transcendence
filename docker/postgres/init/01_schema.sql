CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	username TEXT NOT NULL UNIQUE,
	email TEXT NOT NULL UNIQUE,
	email_verified BOOLEAN NOT NULL DEFAULT FALSE,
	verification_token_hash TEXT,
	verification_expires_at TIMESTAMPTZ,
	password_hash TEXT NOT NULL,
	enabled_2fa BOOLEAN NOT NULL DEFAULT FALSE,
	totp_secret TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_ (
    session_id_hash TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
	temporary_auth_hash TEXT,
	temporary_auth_expires_at TIMESTAMPTZ
);
