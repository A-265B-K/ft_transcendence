import type { FastifyInstance } from 'fastify';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import {
    getCurrentUser,
    getCurrentUserByTemporary2FA
} from '../security/session/session.js';
import {
    insertSessionById,
    deleteTemporary2FA
} from '../security/repository/sessionRepository.js';
import { findUserByEmail } from '../security/repository/userRepository.js';
import {
    enableUser2FA,
    disableUser2FA,
    confirm2FASetup,
    verify2FALogin,
    get2FAstatus
} from '../security/2FA/twoFA.js';

type TwoFAEnableBody = {
    password: string;
};

type TwoFAConfirmBody = {
    token: string;
};

type TwoFADisableBody = {
    password: string;
};

type TwoFALoginBody = {
    token: string;
};

export function registerTwoFactorRoutes(fastify: FastifyInstance) {
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
            if (
                !user ||
                !(await bcrypt.compare(password, user.password_hash))
            ) {
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

            const result = await confirm2FASetup(
                user.email,
                request.body.token
            );
            return reply
                .code(result.ok ? 200 : (result.statusCode ?? 500))
                .send(result);
        }
    );

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
                !(await bcrypt.compare(
                    password,
                    authenticatedUser.password_hash
                ))
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

    fastify.post<{ Body: TwoFALoginBody }>(
        '/api/auth/2fa/verify',
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
            const user =
                await getCurrentUserByTemporary2FA(temporary_auth_hash);
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
}
