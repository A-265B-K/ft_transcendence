import type { ConnectionContext } from './types.js';
import type { Inventory } from '../types.js';
import { getCurrentRoom } from './currentRoom.js';

export const registerCastleHandlers = (context: ConnectionContext) => {
    const { socket, user } = context;

    socket.on('castleattack', () => {
        getCurrentRoom(context)?.castleattack(user, socket);
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

            const room = getCurrentRoom(context);
            if (!room) {
                callback({ success: false });
                return;
            }
            const inventory = room.upgradecastle(user.id);
            if (!inventory) {
                callback({ success: false });
                return;
            }
            callback({
                success: true,
                level: inventory.castleLevel,
                inventory
            });
        }
    );
};
