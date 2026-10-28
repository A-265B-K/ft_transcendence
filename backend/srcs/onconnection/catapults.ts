import type { ConnectionContext } from './types.js';
import type { Inventory } from '../types.js';

export const registerCatapultHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

    socket.on(
        'new_catapult',
        (
            callback: (
                response: { ok: false } | { ok: true; inventory: Inventory }
            ) => void
        ) => {
            if (typeof callback !== 'function') return;
            if (!context.currentRoomId) {
                callback({ ok: false });
                return;
            }

            const room = roomManager.getRoomById(context.currentRoomId);
            if (!room) {
                callback({ ok: false });
                return;
            }

            const inventory = room.payForCatapult(user.id);
            if (!inventory) {
                callback({ ok: false });
                return;
            }

            callback({ ok: true, inventory });
        }
    );
};
