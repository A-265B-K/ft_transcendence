import type { Socket } from '../types.js';
import type { RoomManager } from '../roomManager.js';
import type { ConnectionContext } from './types.js';
import { registerRoomsHandlers } from './rooms.js';
import { registerPlayerHandlers } from './player.js';
import { registerEquipmentHandlers } from './equipment.js';
import { registerCastleHandlers } from './castle.js';
import { registerDisconnectHandlers } from './disconnect.js';

const onConnection = async (socket: Socket, roomManager: RoomManager) => {
    const user = socket.user;

    if (!user) {
        console.error('Socket connected without a user, disconnecting');
        socket.disconnect(true);
        return;
    }

    console.log('Player connected:', user.username);

    const context: ConnectionContext = {
        socket,
        user,
        roomManager,
        currentRoomId: null
    };

    registerRoomsHandlers(context);
    registerPlayerHandlers(context);
    registerEquipmentHandlers(context);
    registerCastleHandlers(context);
    registerDisconnectHandlers(context);
};

export default onConnection;
