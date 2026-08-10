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