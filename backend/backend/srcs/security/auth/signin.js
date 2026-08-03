
import { query } from "./db.js";

export async function SignInUser(payload) {
	const { username, email, password } = payload;

	console.log('[auth.signin] payload:', payload);

	if (!username || !email || !password) {
		console.log('[auth.signin] missing fields')
		return {
			ok: false,
			statusCode: 400,
			message: 'Missing fields',
		};
	}

	console.log('[auth.signin] inserting user into db')

	try {
		console.log("Searching for:", email);
		const result = await query(
			"SELECT id, username, email, password_hash FROM users WHERE email = $1",
			[email]
		);
		const user = result.rows[0];

		console.log('[auth.signin] db result:', result.rows[0])

		return {
			ok: true,
			statusCode: 201,
			message: 'User Signed In',
			user: result.rows[0],
		};
	} catch (error) {
		console.error('[auth.signin] db access failed:', error)

		return {
			ok: false,
			statusCode: 500,
			message: 'Database access failed',
		};
	}
}


