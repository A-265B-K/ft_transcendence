import { createHash } from 'node:crypto';
import type { FastifyRequest } from 'fastify';

export function rateLimitKey(
    request: FastifyRequest,
    scope: string,
    identity: unknown
): string {
    if (typeof identity === 'string' && identity.trim().length > 0) {
        const normalizedIdentity = identity.trim();
        const identityHash = createHash('sha256')
            .update(normalizedIdentity)
            .digest('hex');
        return `${scope}:${identityHash}`;
    }

    return `${scope}:ip:${request.ip}`;
}
