
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

		const validPassword = await bcrypt.compare(password, user.password_hash);
		if (!validPassword) {
				return {
					ok: false,
					statusCode: 401,
					message: "Invalid email or password",
				};
			}

		const sessionId = crypto.randomUUID();

		await query(
			"INSERT INTO session_ (session_id, user_id, expires_at) VALUES ($1, $2, (NOW() + INTERVAL '1 day'))",
			[sessionId, user.id]
		);


		return {
			ok: true,
			statusCode: 200,
			message: 'Login successful',
			sessionId,
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


