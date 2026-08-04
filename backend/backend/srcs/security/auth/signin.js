import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { insertSessionById } from "../repository/sessionRepository.js";
import { findUserByEmail } from "../repository/userRepository.js";


export async function SignInUser(payload) {

	const { email, password } = payload;


	if (!email || !password) {

		return {
			ok: false,
			statusCode: 400,
			message: "Missing fields",
		};
	}


	try {

		console.log("Searching for:", email);


		const user = await findUserByEmail(email);


		if (!user) {

			return {
				ok: false,
				statusCode: 401,
				message: "Invalid email or password",
			};
		}


		const validPassword = await bcrypt.compare(
			password,
			user.password_hash
		);


		if (!validPassword) {

			return {
				ok: false,
				statusCode: 401,
				message: "Invalid email or password",
			};
		}


		const sessionId = crypto.randomUUID();


		await insertSessionById(
			sessionId,
			user.id
		);


		return {
			ok: true,
			statusCode: 200,
			message: "Login successful",

			sessionId,

			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			}
		};


	} catch (error) {

		console.error(
			"[auth.signin] failed:",
			error
		);


		return {
			ok: false,
			statusCode: 500,
			message: "Database access failed",
		};
	}
}