import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { randomBytes, createHash } from 'node:crypto';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import onConnection from './onConnection.js';
import { registerUser } from './security/auth/registration.js';
import { SignInUser } from './security/auth/signin.js';
import {
	getCurrentUser,
	getCurrentUserByTemporary2FA
} from './security/session/session.js';
import {
	deleteSessionById,
	insertSessionById,
	deleteTemporary2FA
} from './security/repository/sessionRepository.js';
import {
	findUserByEmail,
	findUserByVerificationToken,
	changeEmailVerified,
	findUserByPasswordResetRequestToken,
	updatePassword,
	deletePasswordResetToken
} from './security/repository/userRepository.js';
import {
	enableUser2FA,
	disableUser2FA,
	confirm2FASetup,
	verify2FALogin,
	get2FAstatus
} from './security/2FA/twoFA.js';
import { passwordResetRequest } from './security/auth/passwordReset.js';
import bcrypt from 'bcrypt';
import { RoomManager } from './roomManager.js';
import rateLimit from '@fastify/rate-limit';

const fastify = Fastify({
	logger: true,
	trustProxy: (address, hop) => hop === 1,
});

await fastify.register(rateLimit, {
	global: false,
});

await fastify.register(cookie);

const io = new Server(fastify.server);

const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(staticFiles, {
	root: join(__dirname, 'public')
});

// API .................................................................................
fastify.get('/api/ping', () => ({ ok: true }));

type RegisterBody = {
	username: string;
	email: string;
	password: string;
};
fastify.post<{ Body: RegisterBody }>(
	'/api/auth/register',
	{
		config: {
			rateLimit: {
				max: 3,
				timeWindow: '10 minutes',
				onExceeded: (request) => {
					request.log.warn({
						event: 'auth.register.rate_limited',
						ip: request.ip
					}, 'Registration rate limit exceeded');
				}
			}
		}
	},
	async (request, reply) => {
		const result = await registerUser(request.body);

		return reply.code(result.statusCode).send({
			message: result.message,
			user: result.user
		});
	}
);

function registerStatsRoutes(
	fastify: FastifyInstance,
	roomManager: RoomManager
) {
	fastify.get('/stats', async () => {
		return {
			activeRooms: roomManager.getActiveRoomCount()
		};
	});
}

type SignInBody = {
	email: string;
	password: string;
};
fastify.post<{ Body: SignInBody }>(
	'/api/auth/signin',
	{
		config: {
			rateLimit: {
				max: 5,
				timeWindow: '1 minute',
				onExceeded: (request) => {
					request.log.warn({
						event: 'auth.login.rate_limited',
						ip: request.ip
					}, 'Login rate limit exceeded');
				}
			}
		}
	},
	async (request, reply) => {
		const result = await SignInUser(request.body);

		// Log the authentication result
		if (!result.ok) {
			if (result.statusCode === 401) {
				request.log.warn({
					event: 'auth.login.failed',
					ip: request.ip,
					reason: 'invalid_credentials'
				}, 'Login rejected');
			} else if (result.statusCode >= 500) {
				request.log.error({
					event: 'auth.login.error',
					ip: request.ip,
					statusCode: result.statusCode
				}, 'Login failed due to an internal error');
			}
		} else if (result.requireTwoFactor) {
			request.log.info({
				event: 'auth.login.2fa_required',
				ip: request.ip,
				userId: result.user.id
			}, 'Password accepted; awaiting 2FA');
		} else {
			request.log.info({
				event: 'auth.login.success',
				ip: request.ip,
				userId: result.user.id
			}, 'Login successful');
		}

		// Handle the authentication result and send the appropriate response
		if (!result.ok) {
			return reply.code(result.statusCode).send({
				message: result.message
			});
		}
		if (result.requireTwoFactor) {
			reply.setCookie('temporary_auth', result.temporary_auth, {
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 5,
				path: '/'
			});
			return reply.code(200).send({
				message: result.message,
				requireTwoFactor: true
			});
		}
		reply.setCookie('session_id', result.session_id, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24,
			path: '/'
		});
		return reply.code(result.statusCode).send({
			message: result.message,
			requireTwoFactor: false,
			user: result.user
		});
	}
);

fastify.get('/api/auth/me', async (request, reply) => {
	const session_id = request.cookies.session_id;
	if (!session_id) {
		return reply.code(401).send({
			message: 'Not logged in'
		});
	}

	const session_id_hash = createHash('sha256')
		.update(session_id)
		.digest('hex');

	const user = await getCurrentUser(session_id_hash);
	if (!user) {
		return reply.code(401).send({
			message: 'Invalid session'
		});
	}

	return {
		user
	};
});

fastify.get('/api/auth/2fa/status', async (request, reply) => {
	const session_id = request.cookies.session_id;
	if (!session_id) {
		return reply.code(401).send({
			ok: false,
			message: 'Not logged in'
		});
	}

	const session_id_hash = createHash('sha256')
		.update(session_id)
		.digest('hex');
	const user = await getCurrentUser(session_id_hash);
	if (!user) {
		return reply.code(401).send({
			ok: false,
			message: 'Invalid session'
		});
	}

	const result = await get2FAstatus(user.email);
	return reply.code(result.statusCode).send(result);
});

fastify.post('/api/auth/logout', async (request, reply) => {
	try {
		const session_id = request.cookies.session_id;

		if (session_id) {
			const session_id_hash = createHash('sha256')
				.update(session_id)
				.digest('hex');
			await deleteSessionById(session_id_hash);
		}
		reply.clearCookie('session_id', {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/'
		});

		return {
			message: 'Logged out'
		};
	} catch (error) {
		console.error('[logout] failed:', error);

		return reply.code(500).send({
			message: 'Logout failed'
		});
	}
});

type TwoFAEnableBody = {
	password: string;
};
fastify.post<{ Body: TwoFAEnableBody }>(
	'/api/auth/2fa/setup',
	async (request, reply) => {
		const session_id = request.cookies.session_id;
		if (!session_id) {
			return reply.code(401).send({
				ok: false,
				message: 'Not logged in'
			});
		}

		const session_id_hash = createHash('sha256')
			.update(session_id)
			.digest('hex');
		const currentUser = await getCurrentUser(session_id_hash);
		if (!currentUser) {
			return reply.code(401).send({
				ok: false,
				message: 'Invalid session'
			});
		}

		const { password } = request.body;
		if (!password) {
			return reply.code(400).send({
				ok: false,
				message: 'Password is required'
			});
		}

		const user = await findUserByEmail(currentUser.email);
		if (!user || !(await bcrypt.compare(password, user.password_hash))) {
			return reply.code(401).send({
				ok: false,
				message: 'Invalid password'
			});
		}

		if (user.enabled_2fa) {
			return reply.code(409).send({
				ok: false,
				message: '2FA is already enabled'
			});
		}

		const result = await enableUser2FA(user.email);
		return reply
			.code(result.ok ? 200 : (result.statusCode ?? 500))
			.send(result);
	}
);

type TwoFAConfirmBody = {
	token: string;
};
fastify.post<{ Body: TwoFAConfirmBody }>(
	'/api/auth/2fa/confirm',
	async (request, reply) => {
		const session_id = request.cookies.session_id;
		if (!session_id) {
			return reply.code(401).send({
				ok: false,
				message: 'Not logged in'
			});
		}

		const session_id_hash = createHash('sha256')
			.update(session_id)
			.digest('hex');
		const user = await getCurrentUser(session_id_hash);
		if (!user) {
			return reply.code(401).send({
				ok: false,
				message: 'Invalid session'
			});
		}

		const result = await confirm2FASetup(user.email, request.body.token);
		return reply
			.code(result.ok ? 200 : (result.statusCode ?? 500))
			.send(result);
	}
);

type TwoFADisableBody = {
	password: string;
};
fastify.post<{ Body: TwoFADisableBody }>(
	'/api/auth/2fa/disable',
	async (request, reply) => {
		const session_id = request.cookies.session_id;

		if (!session_id) {
			return reply.code(401).send({
				ok: false,
				message: 'Not logged in'
			});
		}

		const session_id_hash = createHash('sha256')
			.update(session_id)
			.digest('hex');

		const user = await getCurrentUser(session_id_hash);

		if (!user) {
			return reply.code(401).send({
				ok: false,
				message: 'Invalid session'
			});
		}

		const { password } = request.body;
		if (!password) {
			return reply.code(400).send({
				ok: false,
				message: 'Password is required'
			});
		}

		const authenticatedUser = await findUserByEmail(user.email);
		if (
			!authenticatedUser ||
			!(await bcrypt.compare(password, authenticatedUser.password_hash))
		) {
			return reply.code(401).send({
				ok: false,
				message: 'Invalid password'
			});
		}

		const result = await disableUser2FA(user.email);
		return reply
			.code(result.ok ? 200 : (result.statusCode ?? 500))
			.send(result);
	}
);

type TwoFALoginBody = {
	token: string;
};
fastify.post<{ Body: TwoFALoginBody }>(
	'/api/auth/2fa/verify',
	{
		config: {
			rateLimit: {
				max: 5,
				timeWindow: '1 minute',
				onExceeded: (request) => {
					request.log.warn({
						event: 'auth.2fa.rate_limited',
						ip: request.ip
					}, '2FA verification rate limit exceeded');
				}
			}
		}
	},
	async (request, reply) => {
		const temporary_auth = request.cookies.temporary_auth;

		if (!temporary_auth) {
			return reply.code(401).send({
				ok: false,
				message: '2FA authentication expired'
			});
		}

		const temporary_auth_hash = createHash('sha256')
			.update(temporary_auth)
			.digest('hex');
		const { token } = request.body;
		const user = await getCurrentUserByTemporary2FA(temporary_auth_hash);
		if (!user) {
			return reply.code(401).send({
				ok: false,
				message: 'Invalid authentication state'
			});
		}

		const result = await verify2FALogin(user.email, token);
		if (!result.ok) {
			return reply.code(result.statusCode).send({
				ok: false,
				message: result.message
			});
		}

		const session_id = randomBytes(32).toString('hex');
		const session_id_hash = createHash('sha256')
			.update(session_id)
			.digest('hex');
		await insertSessionById(session_id_hash, user.id);
		await deleteTemporary2FA(temporary_auth_hash);

		reply.setCookie('session_id', session_id, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24,
			path: '/'
		});

		reply.clearCookie('temporary_auth', {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/'
		});

		return {
			ok: true,
			message: '2FA verified'
		};
	}
);

type VerifyEmailQuery = {
	token: string;
};
fastify.get<{ Querystring: VerifyEmailQuery }>(
	'/verify-email',
	async (request, reply) => {
		const { token } = request.query;

		if (!token) {
			return reply.code(400).send({
				message: 'Missing token'
			});
		}
		try {
			const verification_token_hash = createHash('sha256')
				.update(token)
				.digest('hex');

			const user = await findUserByVerificationToken(
				verification_token_hash
			);
			if (!user) {
				return reply.code(400).send({
					message: 'Invalid or expired verification token'
				});
			}

			await changeEmailVerified(user.id);

			const session_id = randomBytes(32).toString('hex');
			const session_id_hash = createHash('sha256')
				.update(session_id)
				.digest('hex');
			await insertSessionById(session_id_hash, user.id);

			reply.setCookie('session_id', session_id, {
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24,
				path: '/'
			});

			return reply.redirect('/game-menu');
		} catch (error) {
			console.error(
				'[verify-email] failed:',
				error instanceof Error ? error.message : 'Unknown error'
			);

			return reply.code(500).send({
				message: 'Email verification failed'
			});
		}
	}
);

type resetPasswordRequestBody = {
	email: string;
};
fastify.post<{ Body: resetPasswordRequestBody }>(
	'/api/auth/password-reset/request',
	async (request, reply) => {
		const { email } = request.body;
		const result = await passwordResetRequest(email);
		return reply.code(result.statusCode).send({
			ok: result.ok,
			message: result.message
		});
	}
);

type resetPasswordBody = {
	token: string;
	password: string;
};
fastify.post<{ Body: resetPasswordBody }>(
	'/api/auth/password-reset',
	async (request, reply) => {
		const { token, password } = request.body;

		if (!token || !password) {
			return reply.code(400).send({
				message: 'Missing token'
			});
		}
		const password_reset_token_hash = createHash('sha256')
			.update(token)
			.digest('hex');
		const user = await findUserByPasswordResetRequestToken(
			password_reset_token_hash
		);
		if (!user) {
			return reply.code(400).send({
				message: 'Invalid or expired verification token'
			});
		}

		const passwordHash = await bcrypt.hash(password, 12);
		await updatePassword(user.email, passwordHash);
		await deletePasswordResetToken(user.email);
		return reply.code(200).send({
			ok: true,
			message: 'Password reset successfully'
		});
	}
);

// Web pages ............................................................................
fastify.get('/setup-2fa', async (request, reply) => {
	return reply.sendFile('setup-2fa.html');
});

fastify.get('/verify-2fa', async (request, reply) => {
	const temporary_auth = request.cookies.temporary_auth;

	if (!temporary_auth) {
		return reply.redirect('/');
	}

	const temporary_auth_hash = createHash('sha256')
		.update(temporary_auth)
		.digest('hex');
	const user = await getCurrentUserByTemporary2FA(temporary_auth_hash);
	if (!user) {
		return reply.redirect('/');
	}

	return reply.sendFile('verify-2fa.html');
});

// Socket ..............................................................................
async function server() {
	const roomManager = new RoomManager();

	io.use(async (socket, next) => {
		const cookie = socket.handshake.headers.cookie;

		const session_id = cookie
			?.split('; ')
			.find((row) => row.startsWith('session_id='))
			?.split('=')[1];

		if (!session_id) {
			console.log('Socket rejected: no session');
			return next(new Error('Unauthorized'));
		}
		const session_id_hash = createHash('sha256')
			.update(session_id)
			.digest('hex');
		const user = await getCurrentUser(session_id_hash);

		if (!user) {
			console.log('Socket rejected: no valid session');
			return next(new Error('Unauthorized'));
		}

		socket.user = user;
		console.log('Socket authenticated:', user.username);
		next();
	});

	io.on('connection', (socket) => {
		onConnection(socket, roomManager);
	});

	registerStatsRoutes(fastify, roomManager);

	await fastify.listen({
		port: 3000,
		host: '0.0.0.0'
	});

	console.log('Server running on port 3000');
}

server();
