import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { passwordResetRequest } from '../security/auth/passwordReset.js';
import { getCurrentUser } from '../security/session/session.js';
import {
    findUserByPasswordResetRequestToken,
    updatePassword,
    deletePasswordResetToken
} from '../security/repository/userRepository.js';

type resetPasswordRequestBody = {
    email?: string;
};

type resetPasswordBody = {
    token: string;
    password: string;
};

export function registerPasswordResetRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: resetPasswordRequestBody }>(
        '/api/auth/password-reset/request',
        async (request, reply) => {
            let email = request.body?.email?.trim();

            if (!email) {
                const sessionId = request.cookies.session_id;
                if (!sessionId) {
                    return reply.code(401).send({
                        ok: false,
                        message: 'Not logged in'
                    });
                }

                const sessionIdHash = createHash('sha256')
                    .update(sessionId)
                    .digest('hex');
                const user = await getCurrentUser(sessionIdHash);
                if (!user) {
                    return reply.code(401).send({
                        ok: false,
                        message: 'Invalid session'
                    });
                }

                email = user.email;
            }

            if (!email) {
                return reply.code(400).send({
                    ok: false,
                    message: 'Error' //this should stay vague in order to keep valid registered email addresses unknown
                });
            }

            const result = await passwordResetRequest(email);
            return reply.code(result.statusCode).send({
                ok: result.ok,
                message: result.message
            });
        }
    );

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
}
