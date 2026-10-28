import type { RoomManager } from '../roomManager.js';
import type { Socket, SocketUser } from '../types.js';

export type ConnectionContext = {
    socket: Socket;
    user: SocketUser;
    roomManager: RoomManager;
    currentRoomId: string | null;
};
