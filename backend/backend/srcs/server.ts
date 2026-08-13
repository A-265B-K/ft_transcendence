import Fastify from "fastify";
import cookie from "@fastify/cookie";
import staticFiles from "@fastify/static";
import { randomUUID } from 'crypto';
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import onConnection from "./onConnection.js";
import { registerUser } from "./security/auth/registration.js";
import { SignInUser } from "./security/auth/signin.js";
import { getCurrentUser, getCurrentUserByTemporary2FA } from "./security/session/session.js";
import { deleteSessionById, insertSessionById, deleteTemporary2FA } from "./security/repository/sessionRepository.js";
import { findUserByVerificationToken, changeEmailVerified } from "./security/repository/userRepository.js";
import { enableUser2FA, disableUser2FA, confirm2FASetup, verify2FALogin } from "./security/2FA/twoFA.js";

const fastify = Fastify();

await fastify.register(cookie);

const io = new Server(fastify.server);

const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(staticFiles, {
	root: join(__dirname, "public"),
});

fastify.get("/ping", () => ({ ok: true }));

type RegisterBody = {
	username : string;
	email: string;
	password: string;
};

fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
	const result = await registerUser(request.body);

	return reply.code(result.statusCode).send({
		message: result.message,
		user: result.user,
	});
});

type SignInBody = {
	email: string;
	password: string;
};

fastify.post<{ Body: SignInBody }>(
	"/signin",
	async (request, reply) => {
		console.log("[signin] route reached");

		const result = await SignInUser(request.body);
		console.log("[signin] result:", result);
		
		if (!result.ok) {
			return reply.code(result.statusCode).send({
				message: result.message,
			});
		}

		if (result.requireTwoFactor) {
			console.log("[signin] requireTwoFactor activated");
			reply.setCookie("temporary_auth", result.temporary_auth, {
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: 60 * 5, // 5 minutes
				path: "/",
			});
			return reply.code(200).send({
				message: result.message,
				requireTwoFactor: true,
				userId: result.user.id,
			});
		}

		reply.setCookie("session_id", result.sessionId, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: 60 * 60 * 24, // 24h
			path: "/",
		});

		return reply.code(result.statusCode).send({
			message: result.message,
			requireTwoFactor: false,
			user: result.user,
		});
	}
);

io.use(async (socket, next) => {
	const cookie = socket.handshake.headers.cookie;

	const sessionId = cookie
		?.split("; ")
		.find(row => row.startsWith("session_id="))
		?.split("=")[1];

	if (!sessionId) {
		console.log("Socket rejected: no session");
		return next(new Error("Unauthorized"));
	}
	const user = await getCurrentUser(sessionId);

	if (!user) {
		console.log("Socket rejected: no valid session");
		return next(new Error("Unauthorized"));
	}

	socket.user = user;

	console.log("Socket authenticated:", user.username);

	next();
});

fastify.get("/me", async (request, reply) => {
	const sessionId = request.cookies.session_id;

	if (!sessionId) {
		return reply.code(401).send({
			message: "Not logged in",
		});
	}

	const user = await getCurrentUser(sessionId);

	if (!user) {
		return reply.code(401).send({
			message: "Invalid session",
		});
	}

	return {
		user,
	};
});


fastify.post("/logout", async (request, reply) => {
	try {

		const sessionId = request.cookies.session_id;

		if (sessionId) {
			await deleteSessionById(sessionId);
		}

		reply.clearCookie("session_id", {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			path: "/",
		});

		return {
			message: "Logged out",
		};

	} catch (error) {

		console.error(error);

		return reply.code(500).send({
			message: "Logout failed",
		});
	}
});

type VerifyEmailQuery = {
	token: string;
};

fastify.get<{ Querystring: VerifyEmailQuery }>("/verify-email", async (request, reply) => {
	console.log("[verify-email] route reached");

	const { token } = request.query;
		if (!token) {
		return reply.code(400).send({
			message: "Missing token",
		});
	}
	console.log("[verify-email] token:", token);
	try {
		const user = await findUserByVerificationToken(token);
		if (!user) {
			return reply.code(400).send({
				message: "Invalid or expired verification token",
			});
		}
			await changeEmailVerified(user.id);
			console.log("[verify-email] user verified_email changed to true");

			const sessionId = randomUUID();
			await insertSessionById(sessionId, user.id);
			reply.setCookie("session_id", sessionId, {
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: 60 * 60 * 24,
				path: "/",
			});

		return reply.redirect("/");
	}
	catch (error) {

		console.error(error);

		return reply.code(500).send({
			message: "Email verification failed",
		});
	}	
});

type twoFAenable = {
	email: string;
};
fastify.post<{ Body: twoFAenable }>("/api/2fa/setup", async (request, reply) => {
	const { email } = request.body;
	return await enableUser2FA(email);
});

type twoFAconfirmBody = {
	email: string;
	token: string;
};
fastify.post<{ Body: twoFAconfirmBody }>("/api/2fa/confirm", async (request, reply) => {
	const { email, token } = request.body;
	return await confirm2FASetup(
		email,
		token
	);

});

type twoFAdisable = {
	email: string;
};
fastify.post<{ Body: twoFAdisable }>("/api/2fa/disable", async (request, reply) => {
	const { email } = request.body as {email: string};

	const result = await disableUser2FA(email);
	return {
		ok: true,
		message: "2FA disabled"
	};
});

type twoFAlogin = {
	token: string
};
fastify.post<{ Body: twoFAlogin }>("/api/2fa/login", async (request, reply) => {
	const twoFAId = request.cookies.temporary_auth;
	if (!twoFAId) {
		return reply.code(401).send({
			ok: false,
			message: "2FA authentication expired",
		});
	}
	const { token } = request.body;
	const user = await getCurrentUserByTemporary2FA(twoFAId);

	if (!user) {
		return reply.code(401).send({
			ok: false,
			message: "Invalid authentication state",
		});
	}

	const result = await verify2FALogin(user.email, token);
	if (!result.ok) {
		return reply
			.code(result.statusCode)
			.send({
				ok: false,
				message: result.message,
			});
	}
	const sessionId = randomUUID();
	await insertSessionById(sessionId, user.id);
	reply.setCookie(
		"session_id",
		sessionId,
		{
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: 60 * 60 * 24,
			path: "/",
		}
	);
	reply.clearCookie("temporary_auth", {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			path: "/",
		}
	);
	await deleteTemporary2FA(twoFAId);

	return reply.send({
		ok: true,
		message: "2FA verified",
	});
});

fastify.get("/setup-2fa", async (request, reply) => {
	console.log("SETUP 2FA ROUTE REACHED");
	return reply.sendFile("setup-2fa.html");
});
fastify.get("/verify-2fa", async (request, reply) => {
	const twoFAId = request.cookies.temporary_auth;
	if (!twoFAId) {
		return reply.redirect("/");
	}
	const user = await getCurrentUserByTemporary2FA(twoFAId);
	if (!user) {
		return reply.redirect("/");
	}
	return reply.sendFile("verify-2fa.html");
});

// Socket
io.on("connection", onConnection);


// Start server
await fastify.listen({
	port: 3000,
	host: "0.0.0.0",
});

console.log("Server running on port 3000");