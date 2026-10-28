import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';
import { getCurrentUserByTemporary2FA } from '../security/session/session.js';

export function registerPageRoutes(fastify: FastifyInstance) {
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
}
