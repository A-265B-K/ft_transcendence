import bcrypt from "bcrypt";
import { insertUser } from "../repository/userRepository.js";
import { randomBytes, createHash } from "node:crypto";
import nodemailer from "nodemailer";

export const emailTransporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

// function validatePassword(password: string): string | null {
// 	if (password.length < 8)
// 		return "Password must be at least 8 characters";

// 	if (!/[A-Z]/.test(password))
// 		return "Password must contain an uppercase letter";

// 	if (!/[a-z]/.test(password))
// 		return "Password must contain a lowercase letter";

// 	if (!/[0-9]/.test(password))
// 		return "Password must contain a number";

// 	if (!/[^A-Za-z0-9]/.test(password))
// 		return "Password must contain a special character";

// 	return null;
// }

type registerPayload = {
	username : string;
	email: string;
	password: string;
};
export async function registerUser(payload: registerPayload) {
	const { username, email, password } = payload;
	if (!username || !email || !password) {
		return {
			ok:false,
			statusCode:400,
			message:"Missing fields",
		};
	}
	// const check = validatePassword(password);
	// if (check) {
	// 	return {
	// 		ok: false,
	// 		statusCode: 400,
	// 		message: check
	// 	};
	// }
	try {
		const passwordHash = await bcrypt.hash(
			password,
			12
		);

		const verification_token = randomBytes(32).toString("hex");
		const verification_token_hash = createHash("sha256")
		.update(verification_token)
		.digest("hex");
		const user = await insertUser(
			username,
			email,
			passwordHash,
			verification_token_hash
		);

		const baseUrl = process.env.HOSTNAME;
		const verificationUrl =
		`https://${baseUrl}:8443/verify-email?token=${verification_token}`;

		try {
			await emailTransporter.verify();
    		console.log("SMTP server is ready");

			await emailTransporter.sendMail({
				from: process.env.EMAIL_USER,
				to: user.email,
				subject: "Verify your email",

			html: `
				<h2>Welcome!</h2>

				<p>Please verify your email.</p>

				<p>
					<a href="${verificationUrl}">
						Verify Email
					</a>
				</p>
			`,
			});
			console.log("Email sent successfully!");
		} catch (err) {
			console.error("Failed to send email:", err);
		}
		return {
			ok:true,
			statusCode:201,
			message:"User registered",
			user,
		};
	} catch(error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "23505"
		) {
			return {
				ok: false,
				statusCode: 409,
				message: "Email already exists",
			};
		}
		console.error("[auth.registerUser] failed:", error);
		return {
			ok:false,
			statusCode:500,
			message:"Database insert failed",
		};
	}
}