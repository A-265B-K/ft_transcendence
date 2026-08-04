
import { query } from "./db.js";
import bcrypt from "bcrypt";

export async function registerUser(payload) {
	const { username, email, password } = payload;

	// console.log('[auth.registerUser] payload:', payload);

	if (!username || !email || !password) {
		console.log('[auth.registerUser] missing fields')
		return {
			ok: false,
			statusCode: 400,
			message: 'Missing fields',
		};
	}
	// console.log('[auth.registerUser] inserting user into db')

	try {
		const passwordHash = await bcrypt.hash(password, 12);

		const result = await query(
			'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
			[username, email, passwordHash]
		);

		// console.log('[auth.registerUser] db result:', result.rows[0])

		return {
			ok: true,
			statusCode: 200,
			message: 'User registered',
			user: result.rows[0],
		};
		
	} catch (error) {
		// console.error('[auth.registerUser] db insert failed:', error)

		return {
			ok: false,
			statusCode: 500,
			message: 'Database insert failed',
		};
	}
}


