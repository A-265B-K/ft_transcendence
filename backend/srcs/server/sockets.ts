import { createHash } from 'node:crypto';
import type { Server } from 'socket.io';
import type { RoomManager } from '../roomManager.js';
import { getCurrentUser } from '../security/session/session.js';
import onConnection from '../onconnection/index.js';

export function registerSocketHandlers(io: Server, roomManager: RoomManager) {
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
}
