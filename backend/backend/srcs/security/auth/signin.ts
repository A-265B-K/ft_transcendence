import bcrypt from "bcrypt";
import { randomBytes, createHash } from "node:crypto";
import { insertSessionById, insertTemporary2FAstate, deleteTemporary2FAByUserId } from "../repository/sessionRepository.js";
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
	session_id: string;
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
	temporary_auth: string;
	user: {
		id: string;
		username: string;
		email: string;
	};
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
		if (!user.email_verified) {
			return {
				ok: false,
				statusCode: 401,
				message: "Please verify your email address",
			};
		}
		if (user.enabled_2fa) {
			await deleteTemporary2FAByUserId(user.id);
			const temporary_auth = randomBytes(32).toString("hex");
			const temporary_auth_hash = createHash("sha256")
				.update(temporary_auth)
				.digest("hex");
			await insertTemporary2FAstate(temporary_auth_hash, user.id);
			return {
				ok: true,
				statusCode: 200,
				message: "2FA required",
				requireTwoFactor: true,
				temporary_auth,
				user: {
				id: user.id,
				username: user.username,
				email: user.email,
				},
			};
		}

		const session_id = randomBytes(32).toString("hex");
		const session_id_hash = createHash("sha256")
			.update(session_id)
			.digest("hex");
		await insertSessionById(session_id_hash, user.id);
		return {
			ok: true,
			statusCode: 200,
			message: "Login successful",
			requireTwoFactor: false,
			session_id,
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