import type { ConnectionContext } from './types.js';

export const registerDisconnectHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

    socket.on('disconnect', () => {
        console.log('Player disconnected:', user.username);

        if (!context.currentRoomId) return;

        roomManager
            .getRoomById(context.currentRoomId)
            ?.disconnect(socket, user.id);
        context.currentRoomId = null;
    });
};
