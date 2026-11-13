import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';
import { registerUser } from '../security/auth/registration.js';
import { SignInUser } from '../security/auth/signin.js';
import { getCurrentUser } from '../security/session/session.js';
import { deleteSessionById } from '../security/repository/sessionRepository.js';
import { rateLimitKey } from './rateLimit.js';

type RegisterBody = {
    username: string;
    email: string;
    password: string;
};

type SignInBody = {
    email: string;
    password: string;
};

export function registerAuthRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: RegisterBody }>(
        '/api/auth/register',
        {
            config: {
                rateLimit: {
                    max: 3,
                    timeWindow: '10 minutes',
                    keyGenerator: (request) =>
                        rateLimitKey(
                            request,
                            'auth.register',
                            (request.body as RegisterBody).email
                        ),
                    onExceeded: (request) => {
                        request.log.warn(
                            {
                                event: 'auth.register.rate_limited',
                                ip: request.ip
                            },
                            'Registration rate limit exceeded'
                        );
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

    fastify.post<{ Body: SignInBody }>(
        '/api/auth/signin',
        {
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: '1 minute',
                    keyGenerator: (request) =>
                        rateLimitKey(
                            request,
                            'auth.login',
                            (request.body as SignInBody).email
                        ),
                    onExceeded: (request) => {
                        request.log.warn(
                            {
                                event: 'auth.login.rate_limited',
                                ip: request.ip
                            },
                            'Login rate limit exceeded'
                        );
                    }
                }
            }
        },
        async (request, reply) => {
            const result = await SignInUser(request.body);

            // Log the authentication result
            if (!result.ok) {
                if (result.statusCode === 401) {
                    request.log.warn(
                        {
                            event: 'auth.login.failed',
                            ip: request.ip,
                            reason: 'invalid_credentials'
                        },
                        'Login rejected'
                    );
                } else if (result.statusCode >= 500) {
                    request.log.error(
                        {
                            event: 'auth.login.error',
                            ip: request.ip,
                            statusCode: result.statusCode
                        },
                        'Login failed due to an internal error'
                    );
                }
            } else if (result.requireTwoFactor) {
                request.log.info(
                    {
                        event: 'auth.login.2fa_required',
                        ip: request.ip,
                        userId: result.user.id
                    },
                    'Password accepted; awaiting 2FA'
                );
            } else {
                request.log.info(
                    {
                        event: 'auth.login.success',
                        ip: request.ip,
                        userId: result.user.id
                    },
                    'Login successful'
                );
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
}
