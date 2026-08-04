import { query } from "../auth/db.js";

export async function insertUser(username, email, passwordHash) {

	const result = await query(
		`
		INSERT INTO users
		(
			username,
			email,
			password_hash
		)
		VALUES
		(
			$1,
			$2,
			$3
		)
		RETURNING
			id,
			username,
			email
		`,
		[
			username,
			email,
			passwordHash
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