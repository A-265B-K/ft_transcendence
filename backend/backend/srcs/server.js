import Fastify from "fastify";
import cookie from "@fastify/cookie";
import staticFiles from "@fastify/static";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import onConnection from "./onConnection.js";
import { registerUser } from "./security/auth/registration.js";
import { SignInUser } from "./security/auth/signin.js";
import { getCurrentUser } from "./security/session/session.js";
import { deleteSessionById } from "./security/repository/sessionRepository.js";
import { findUserByVerificationToken, changeEmailVerified } from "./security/repository/userRepository.js";

const fastify = Fastify();

await fastify.register(cookie);

const io = new Server(fastify.server);

const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(staticFiles, {
	root: join(__dirname, "public"),
});

fastify.get("/ping", () => ({ ok: true }));

fastify.post("/register", async (request, reply) => {
	const result = await registerUser(request.body ?? {});

	return reply.code(result.statusCode).send({
		message: result.message,
		user: result.user,
	});
});

fastify.post("/signin", async (request, reply) => {
	console.log("[signin] route reached");

	const result = await SignInUser(request.body ?? {});

	if (result.ok) {

		reply.setCookie("session_id", result.sessionId, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: 60 * 60 * 24,
			path: "/",
		});
	}

	return reply.code(result.statusCode).send({
		message: result.message,
		user: result.user,
	});
});

io.use(async (socket, next) => {
	const cookie = socket.handshake.headers.cookie;

	const sessionId = cookie
		?.split("; ")
		.find(row => row.startsWith("session_id="))
		?.split("=")[1];

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

// still need to check for validated till token
fastify.get("/verify-email", async (request, reply) => {
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
			return reply.redirect("/");
	}
	catch (error) {

		console.error(error);

		return reply.code(500).send({
			message: "Email verification failed",
		});
	}	
});


// Socket
io.on("connection", onConnection);


// Start server
await fastify.listen({
	port: 3000,
	host: "0.0.0.0",
});

console.log("Server running on port 3000");