import { query } from "../auth/db.js";

export async function insertSessionById(sessionId: string, userId: number) {
	await query(
		`
		INSERT INTO session_
		(
			session_id,
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
			sessionId,
			userId
		]
	);
	return sessionId;
}

export async function insertTemporary2FAstate(temporary_auth: string, userId: number) {
	await query(
		`
		INSERT INTO session_
		(
			temporary_auth,
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
			temporary_auth,
			userId
		]
	);
	return temporary_auth;
}

export async function selectTemporary2FAFromSession(temporary_auth: string) {
	const result = await query(
		`
		SELECT
			users.id,
			users.username,
			users.email
		FROM session_
		JOIN users
			ON users.id = session_.user_id
		WHERE session_.temporary_auth = $1
		AND session_.temporary_auth_expires_at > NOW()
		`,
		[
			temporary_auth
		]
	);
	return result.rows[0] || null;
}

export async function selectFromSession(sessionId: string) {
	const result = await query(
		`
		SELECT
			users.id,
			users.username,
			users.email
		FROM session_
		JOIN users
			ON users.id = session_.user_id
		WHERE session_.session_id = $1
		AND session_.expires_at > NOW()
		`,
		[
			sessionId
		]
	);
	return result.rows[0] || null;
}

export async function deleteSessionById(sessionId: string) {
	await query(
		`
		DELETE FROM session_
		WHERE session_id = $1
		`,
		[
			sessionId
		]
	);
	return true;
}

export async function deleteTemporary2FA(temporary_auth: string) {
	await query(
		`
		DELETE FROM session_
		WHERE temporary_auth = $1
		`,
		[
			temporary_auth
		]
	);
	return true;
}

export async function deleteTemporary2FAByUserId(userId: string) {
	await query(
		`
		DELETE FROM session_
		WHERE user_id = $1
		  AND temporary_auth IS NOT NULL
		  AND temporary_auth_expires_at > NOW()
		`,
		[userId]
	);
}