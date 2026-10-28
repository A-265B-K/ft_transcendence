import type { FastifyInstance } from 'fastify';
import { randomBytes, createHash } from 'node:crypto';
import {
    findUserByVerificationToken,
    changeEmailVerified
} from '../security/repository/userRepository.js';
import { insertSessionById } from '../security/repository/sessionRepository.js';

type VerifyEmailQuery = {
    token: string;
};

export function registerEmailVerificationRoutes(fastify: FastifyInstance) {
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
}
