import type { ConnectionContext } from './types.js';
import type { Inventory } from '../types.js';

export const registerCastleHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

    socket.on('castleattack', () => {
        if (!context.currentRoomId) return;

        roomManager
            .getRoomById(context.currentRoomId)
            ?.castleattack(user, socket);
    });

    socket.on(
        'upgrade_castle',
        (
            data: unknown,
            callback: (
                response:
                    | { success: false }
                    | { success: true; level: number; inventory: Inventory }
            ) => void
        ) => {
            if (typeof callback !== 'function') return;

            if (!context.currentRoomId) {
                callback({ success: false });
                return;
            }

            const room = roomManager.getRoomById(context.currentRoomId);
            if (!room) {
                callback({ success: false });
                return;
            }
            const inventory = room.upgradecastle(user.id);
            if (!inventory) {
                callback({ success: false });
                return;
            }
            socket.to(context.currentRoomId).emit('castle_update', {
                socketId: socket.id,
                level: inventory.castleLevel
            });

            callback({
                success: true,
                level: inventory.castleLevel,
                inventory
            });
        }
    );
};
