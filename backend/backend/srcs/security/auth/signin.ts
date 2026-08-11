import bcrypt from "bcrypt";
import { randomUUID } from 'crypto';
import { insertSessionById } from "../repository/sessionRepository.js";
import { findUserByEmail } from "../repository/userRepository.js";

type singinPayload = {
	email: string;
	password: string;
};

type SignInSuccess = {
    ok: true;
    statusCode: 200;
    message: "Login successful";
    requireTwoFactor: false;
    sessionId: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
};

type SignIn2FARequired = {
    ok: true;
    statusCode: 200;
    message: "2FA required";
    requireTwoFactor: true;
    userId: string;
};

type SignInFailure = {
    ok: false;
    statusCode: number;
    message: string;
};

type SignInResult =
    | SignInSuccess
    | SignIn2FARequired
    | SignInFailure;

export async function SignInUser(payload: singinPayload): Promise<SignInResult> {
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
				message: "Invalid email",
			};
		}
		const validPassword = await bcrypt.compare(password, user.password_hash);
		if (!validPassword) {
			return {
				ok: false,
				statusCode: 401,
				message: "Invalid password",
			};
		}
		if (!user.email_verified) {
			return {
				ok: false,
				statusCode: 401,
				message: "Please verify your email address",
			};
		}
		// doesnt check well
		if (user.enabled_2fa) {
			return {
				ok: true,
				statusCode: 200,
				message: "2FA required",
				requireTwoFactor: true,
				userId: user.id,
			};
		}
		const sessionId = randomUUID();
		await insertSessionById(sessionId, user.id);
		return {
			ok: true,
			statusCode: 200,
			message: "Login successful",
			requireTwoFactor: false,
			sessionId,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			},
		};
	} catch (error) {
		console.error("[auth.signin] failed:", error);
		return {
			ok: false,
			statusCode: 500,
			message: "Database access failed",
		};
	}
}