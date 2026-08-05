import bcrypt from "bcrypt";
import { insertUser } from "../repository/userRepository.js";
import { randomUUID } from 'crypto'
import nodemailer from "nodemailer";

export const emailTransporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});


export async function registerUser(payload) {

	const { username, email, password } = payload;
	if (!username || !email || !password) {

		return {
			ok:false,
			statusCode:400,
			message:"Missing fields",
		};
	}

	try {
		const passwordHash = await bcrypt.hash(
			password,
			12
		);

		const verification_token = randomUUID();
		const user = await insertUser(
			username,
			email,
			passwordHash,
			verification_token,
			'tomorrow'
		);

		const baseUrl = "https://localhost:8443";
		const verificationUrl =
		`${baseUrl}/verify-email?token=${verification_token}`;

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
			console.log("Email sent!");
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


		if (error.code === "23505") {

			return {
				ok:false,
				statusCode:409,
				message:"Email already exists",
			};
		}


		console.error(
			"[auth.registerUser] failed:",
			error
		);


		return {
			ok:false,
			statusCode:500,
			message:"Database insert failed",
		};
	}
}