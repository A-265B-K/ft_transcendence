import { query } from "../auth/db.js";

export async function insertSessionById(session_id_hash: string, userId: number) {
	await query(
		`
		INSERT INTO session_
		(
			session_id_hash,
			user_id,
			expires_at
		)
		VALUES
		(
			$1,
			$2,
			NOW() + INTERVAL '1 day'
		)
		`,
		[
			session_id_hash,
			userId
		]
	);
	return session_id_hash;
}

export async function insertTemporary2FAstate(temporary_auth_hash: string, userId: number) {
	await query(
		`
		INSERT INTO session_
		(
			temporary_auth_hash,
			user_id,
			temporary_auth_expires_at
		)
		VALUES
		(
			$1,
			$2,
			NOW() + INTERVAL '5 minutes'
		)
		`,
		[
			temporary_auth_hash,
			userId
		]
	);
	return temporary_auth_hash;
}

export async function selectTemporary2FAFromSession(temporary_auth_hash: string) {
	const result = await query(
		`
		SELECT
			users.id,
			users.username,
			users.email
		FROM session_
		JOIN users
			ON users.id = session_.user_id
		WHERE session_.temporary_auth_hash = $1
		AND session_.temporary_auth_expires_at > NOW()
		`,
		[
			temporary_auth_hash
		]
	);
	return result.rows[0] || null;
}

export async function selectFromSession(session_id_hash: string) {
	const result = await query(
		`
		SELECT
			users.id,
			users.username,
			users.email
		FROM session_
		JOIN users
			ON users.id = session_.user_id
		WHERE session_.session_id_hash = $1
		AND session_.expires_at > NOW()
		`,
		[
			session_id_hash
		]
	);
	return result.rows[0] || null;
}

export async function deleteSessionById(session_id_hash: string) {
	await query(
		`
		DELETE FROM session_
		WHERE session_id_hash = $1
		`,
		[
			session_id_hash
		]
	);
	return true;
}

export async function deleteTemporary2FA(temporary_auth_hash: string) {
	await query(
		`
		DELETE FROM session_
		WHERE temporary_auth_hash = $1
		`,
		[
			temporary_auth_hash
		]
	);
	return true;
}

export async function deleteTemporary2FAByUserId(userId: string) {
	await query(
		`
		DELETE FROM session_
		WHERE user_id = $1
		  AND temporary_auth_hash IS NOT NULL
		  AND temporary_auth_expires_at > NOW()
		`,
		[userId]
	);
}