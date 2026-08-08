import { query } from "../auth/db.js";

export async function insertUser(username, email, passwordHash, verification_token, verification_expires_at) {
	const result = await query(
		`
		INSERT INTO users
		(
			username,
			email,
			password_hash,
			verification_token,
			verification_expires_at
		)
		VALUES
		(
			$1,
			$2,
			$3,
			$4,
			$5
		)
		RETURNING
			id,
			username,
			email,
			email_verified,
			enabled_2FA
		`,
		[
			username,
			email,
			passwordHash,
			verification_token,
			verification_expires_at
		]
	);


	return result.rows[0];
}

export async function findUserByEmail(email) {
	const result = await query(
		`
		SELECT
			id,
			username,
			email,
			password_hash,
			email_verified
		FROM users
		WHERE email = $1
		`,
		[
			email
		]
	);


	return result.rows[0] || null;
}

export async function findUserByVerificationToken(verification_token) {
	const result = await query(
		`
		SELECT
			id,
			username,
			email
		FROM users
		WHERE verification_token = $1
		AND verification_expires_at > NOW();
		`,
		[
			verification_token
		]
	);


	return result.rows[0] || null;
}

export async function changeEmailVerified(userId) {
	const result = await query(
		`
		UPDATE users
		SET
			email_verified = TRUE,
			verification_token = NULL,
			verification_expires_at = NULL
		WHERE id = $1
		RETURNING id, email_verified
		`,
		[userId]
	);

	return result.rows[0];
}

export async function change2FAEnabed(userId, token) {
	const result = await query(
		`
		UPDATE users
		SET
			enabled_2FA = TRUE,
			TOTP_secret = $2
		WHERE id = $1
		RETURNING id, enabled_2FA
		`,
		[userId, token]
	);

	return result.rows[0];
}

export async function change2FATOTP(TOTP, userId) {
	const result = await query(
		`
		UPDATE users
		SET
			TOTP_secret = $2
		WHERE id = $1
		RETURNING id, TOTP_secret
		`,
		[userId, TOTP]
	);

	return result.rows[0];
}