import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RoomManager } from './roomManager.js';
import { registerAuthRoutes } from './server/auth.js';
import { registerTwoFactorRoutes } from './server/twoFactor.js';
import { registerPasswordResetRoutes } from './server/passwordReset.js';
import { registerEmailVerificationRoutes } from './server/emailVerification.js';
import { registerPageRoutes } from './server/pages.js';
import { registerSystemRoutes } from './server/system.js';
import { registerSocketHandlers } from './server/sockets.js';

const fastify = Fastify();

await fastify.register(cookie);

const io = new Server(fastify.server);

const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(staticFiles, {
    root: join(__dirname, 'public')
});

async function server() {
    const roomManager = new RoomManager();

    registerAuthRoutes(fastify);
    registerTwoFactorRoutes(fastify);
    registerPasswordResetRoutes(fastify);
    registerEmailVerificationRoutes(fastify);
    registerPageRoutes(fastify);
    registerSystemRoutes(fastify, roomManager);
    registerSocketHandlers(io, roomManager);

    await fastify.listen({
        port: 3000,
        host: '0.0.0.0'
    });

    console.log('Server running on port 3000');
}

server();
