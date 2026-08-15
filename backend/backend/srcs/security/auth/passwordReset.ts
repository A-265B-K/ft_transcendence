//import bcrypt from "bcrypt";
//import { insertUser } from "../repository/userRepository.js";
//import nodemailer from "nodemailer";

//export const emailTransporter = nodemailer.createTransport({
//	service: "gmail",
//	auth: {
//		user: process.env.EMAIL_USER,
//		pass: process.env.EMAIL_PASSWORD,
//	},
//});

//type passwordResetPayload = {
//	username: string;
//	email: string;
//}
//export async function passwordReset(payload: passwordResetPayload) {
//	const { username, email } = payload;
//	if (!username || !email) {
//		return {
//			ok:false,
//			statusCode:400,
//			message:"Missing fields",
//		};
//	}
//	const baseUrl = process.env.HOSTNAME;
//	const verificationUrl =
//	`https://${baseUrl}:8443/verify-email?token=${verification_token}`;

//	try {
//		await emailTransporter.verify();
//		console.log("SMTP server is ready");

//		await emailTransporter.sendMail({
//			from: process.env.EMAIL_USER,
//			to: email,
//			subject: "Verify your email",

//		html: `
//			<h2>Welcome!</h2>

//			<p>Please verify your email.</p>

//			<p>
//				<a href="${verificationUrl}">
//					Verify Email
//				</a>
//			</p>
//		`,
//		});
//		console.log("Email sent successfully!");
//	} catch (err) {
//		console.error("Failed to send email:", err);
//	}
//}