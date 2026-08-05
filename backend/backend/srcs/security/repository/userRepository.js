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
			email_verified
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
			password_hash
		FROM users
		WHERE email = $1
		`,
		[
			email
		]
	);


	return result.rows[0] || null;
}

export async function changeEmailVerified(email_verified) {

	const result = await query(
		`
		INSERT INTO users
		(
			email_verified,
		)
		VALUES
		(
			$1
		)
		RETURNING
			id,
			username,
			email,
			email_verified
		`,
		[
			email_verified,
		]
	);


	return result.rows[0];
}