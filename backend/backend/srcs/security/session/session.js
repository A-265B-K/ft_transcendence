import { query } from "../auth/db.js";

export async function getCurrentUser(sessionId) {

	if (!sessionId) {
		return null;
	}


	const result = await query(
		`
		SELECT users.id, users.username, users.email
		FROM session_
		JOIN users ON users.id = session_.user_id
		WHERE session_.session_id = $1
		AND session_.expires_at > NOW()
		`,
		[sessionId]
	);


	return result.rows[0] || null;
}