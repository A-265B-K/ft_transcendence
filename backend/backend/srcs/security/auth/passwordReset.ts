import { insertUserPasswordVerification } from "../repository/userRepository.js";
import { randomBytes, createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { readFileSync } from 'node:fs';

export const emailTransporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

export async function passwordResetRequest(email: string) {
	if (!email) {
		return {
			ok:false,
			statusCode:400,
			message:"Missing fields",
		};
	}
	const password_verification_token = randomBytes(32).toString("hex");
	const password_verification_token_hash = createHash("sha256")
		.update(password_verification_token)
		.digest("hex");

	const user = await insertUserPasswordVerification(
		email,
		password_verification_token_hash
	);

	const baseUrl = readFileSync('/hostname', 'utf8').trim();
	const verificationUrl =
	`https://${baseUrl}:8443/reset-password?token=${password_verification_token}`;

	try {
		await emailTransporter.verify();
		await emailTransporter.sendMail({
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Reset your password",

		html: `
			<h2>Hi!</h2>

			<p>Here is a link to reset your password.</p>

			<p>
				<a href="${verificationUrl}">
					Reset password
				</a>
			</p>
		`,
		});
		console.log("Email sent successfully!");
		return {
			ok: true,
			statusCode: 200,
			message:
				"If that email exists, a password reset link has been sent.",
		};
	} catch (err) {
		console.error("Failed to send email:", err);
		return {
			ok: false,
			statusCode: 500,
			message: "Could not send password reset email",
		};
	}
}