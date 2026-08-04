/* 1. Create the Fastify server
	Initializes the HTTP framework with base configuration (logging, etc).
2. Define basic HTTP routes
	Only the essentials for Sprint 1 — a health check to confirm the server is alive.
3. Start the server
	Listen on a port and connect to the database.
*/

import Fastify  from 'fastify'
import cookie from "@fastify/cookie";
import staticFiles from '@fastify/static'
import { Server } from 'socket.io'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import onConnection from './onConnection.js'
import { registerUser } from './security/auth/registration.js'
import { SignInUser } from './security/auth/signin.js'
import { getCurrentUser } from "./security/session/session.js";
import { query } from "./security/auth/db.js";

const fastify = Fastify()
await fastify.register(cookie);
const io = new Server(fastify.server)

const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(staticFiles, { root: join(__dirname, 'public')})
fastify.get('/ping', () => ({ok: true}))



// Registration logic for user creation
fastify.post('/register', async (request, reply) => {

  console.log('[register] route reached')

  const result = await registerUser(request.body ?? {});
  return reply.code(result.statusCode).send({
    message: result.message,
    user: result.user,
  });
});



// Sign In logic here
fastify.post('/signin', async (request, reply) => {
  console.log('[signin] route reached')

	const result = await SignInUser(request.body ?? {});

	if (result.ok)	{
		console.log("[signin] setting cookie:", result.sessionId);

		reply.setCookie("session_id", result.sessionId, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: 60 * 60 * 24, // = 1 day in sec
			path: "/"
		});
	}

	return reply.code(result.statusCode).send({
		message: result.message,
		user: result.user,
  });
});


io.use(async (socket, next) => {

	const cookie = socket.handshake.headers.cookie;
	console.log("Socket cookies:", cookie);

	console.log("=== SOCKET AUTH TEST ===");
	console.log("Received cookie:", cookie);

	const sessionId = cookie
		?.split("; ")
		.find(row => row.startsWith("session_id="))
		?.split("=")[1];

	const user = await getCurrentUser(sessionId);

	console.log("Database user:", user);


	if (!user) {
		console.log("Socket rejected: no valid session");
		return next(new Error("Unauthorized"));
	}
	socket.user = user;

	console.log(
		"Socket authenticated:",
		socket.user.username
	);

	next();
});

// session check
fastify.get("/me", async (request, reply) => {

	console.log("ME ROUTE HIT");
	console.log(
		"COOKIE:",
		request.headers.cookie
	);

	const cookie = request.headers.cookie;

	if (!cookie) {
		return reply.code(401).send({
			message: "Not logged in"
		});
	}


	const sessionId = cookie
		.split("; ")
		.find(row => row.startsWith("session_id="))
		?.split("=")[1];


	const user = await getCurrentUser(sessionId);


	if (!user) {
		return reply.code(401).send({
			message: "Invalid session"
		});
	}


	return {
		user
	};
});

fastify.post("/logout", async (request, reply) => {

	console.log("=== LOGOUT ROUTE HIT ===");

	const cookie = request.headers.cookie;

	console.log("COOKIE:", cookie);


	const sessionId = cookie
		?.split("; ")
		.find(row => row.startsWith("session_id="))
		?.split("=")[1];


	if (sessionId) {

		await query(
			"DELETE FROM session_ WHERE session_id = $1",
			[sessionId]
		);

		console.log("Deleted session:", sessionId);
	}


	reply.clearCookie("session_id", {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		path: "/",
	});


	return {
		message: "Logged out"
	};
});


// socket
io.on('connection', onConnection);

// start server
await fastify.listen({ port: 3000, host: '0.0.0.0' })
console.log("server running on port 3000")
