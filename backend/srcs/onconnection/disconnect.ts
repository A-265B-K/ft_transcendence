import type { ConnectionContext } from './types.js';
import { onDisconnection } from './onDisconnection.js';

export const registerDisconnectHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

    socket.on('disconnect', () => {
        console.log('Player disconnected:', user.username);

        if (context.currentRoomId)
            onDisconnection(socket, user, context.currentRoomId, roomManager);
    });
};
