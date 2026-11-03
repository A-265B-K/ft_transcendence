import type { Socket, SocketUser } from '../types.js';
import type { RoomManager } from '../roomManager.js';

export const onDisconnection = (
    socket: Socket,
    user: SocketUser,
    roomId: string,
    roomManager: RoomManager
) => {
    const room = roomManager.getRoomById(roomId);

    if (!room) return;
    room.leave(socket, user.id);
    if (room.getPlayerCount() == 0) roomManager.deleteRoomById(roomId);
};
