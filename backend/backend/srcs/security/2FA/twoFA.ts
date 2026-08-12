import QRCode from "qrcode";
import { generateSecret, verify, generateURI } from "otplib";
import { enable2FA, disable2FA, addTOTP, findUserByEmail } from "../repository/userRepository.js";

export async function enableUser2FA(email: string) {
	try {
		const totp_secret = generateSecret();

		await addTOTP(email, totp_secret);

		const otpauth = generateURI({
			issuer: "SurvivalGame42",
			label: email,
			secret: totp_secret
		});

		const qrCode = await QRCode.toDataURL(otpauth);

		return {
			ok: true,
			qrCode
		};

	} catch (error) {
		console.error("[2FA.setup] failed:", error);

		return {
			ok: false,
			statusCode: 500,
			message: "2FA setup failed"
		};
	}
}

export async function disableUser2FA(email: string) {
	try {
		const result = await disable2FA(email);

		return {
			ok: true,
			user: result
		};

	} catch (error) {
		console.error("[2FA.disable] failed:", error);

		return {
			ok: false,
			statusCode: 500,
			message: "2FA disable failed"
		};
	}
}

export async function confirm2FASetup(
	email: string,
	token: string
) {
	try {
		const user = await findUserByEmail(email);

		if (!user || !user.totp_secret) {
			return {
				ok: false,
				statusCode: 400,
				message: "2FA setup has not been started"
			};
		}

		const result = await verify({
			token,
			secret: user.totp_secret
		});

		if (!result.valid) {
			return {
				ok: false,
				statusCode: 400,
				message: "Invalid code"
			};
		}

		await enable2FA(email);

		return {
			ok: true,
			message: "2FA enabled"
		};

	} catch (error) {
		console.error("[2FA.confirm] failed:", error);

		return {
			ok: false,
			statusCode: 500,
			message: "2FA confirmation failed"
		};
	}
}

export async function verify2FALogin(email: string, token: string) {
	try {
		const user = await findUserByEmail(email);

		if (!user || !user.enabled_2fa || !user.totp_secret) {
			return {
				ok: false,
				statusCode: 400,
				message: "2FA is not enabled"
			};
		}
		const result = await verify({
			token,
			secret: user.totp_secret
		});

		if (!result.valid) {
			return {
				ok: false,
				statusCode: 401,
				message: "Invalid code"
			};
		}
		return {
			ok: true,
			statusCode: 200,
			message: "2FA verified"
		};

	} catch (error) {
		console.error("[2FA.login] failed:", error);

		return {
			ok: false,
			statusCode: 500,
			message: "2FA verification failed"
		};
	}
}