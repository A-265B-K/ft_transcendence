import type { ConnectionContext } from './types.js';

export const getCurrentRoom = (context: ConnectionContext) => {
    if (!context.currentRoomId) return null;

    const room = context.roomManager.getRoomById(context.currentRoomId);
    if (!room?.isConnection(context.user.id, context.socket.id)) return null;

    return room;
};
