
import { query } from "./db.js";
import bcrypt from "bcrypt";

export async function SignInUser(payload) {
	const { email, password } = payload;

	//console.log('[auth.signin] payload:', payload);

	if (!email || !password) {
		//console.log('[auth.signin] missing fields')
		return {
			ok: false,
			statusCode: 400,
			message: 'Missing fields',
		};
	}

	//console.log('[auth.signin] inserting user into db')

	try {
		//console.log("Searching for:", email);
		const passwordHash = await bcrypt.hash(password, 12);
		const result = await query(
			"SELECT id, username, email, password_hash FROM users WHERE email = $1",
			[email]
		);
		const user = result.rows[0];


		if (!user) {
			return {
				statusCode: 401,
				message: "Invalid email or password",
			};
		}
// Here compare passwords
		//console.log('[auth.signin] db result:', result.rows[0])

		return {
			ok: true,
			statusCode: 200,
			message: 'Login successful',
			user: {
			id: user.id,
			username: user.username,
			email: user.email,
		}
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


