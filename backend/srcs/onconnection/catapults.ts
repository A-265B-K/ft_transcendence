import type { ConnectionContext } from './types.js';
import type { Inventory } from '../types.js';
import { getCurrentRoom } from './currentRoom.js';

export const registerCatapultHandlers = (context: ConnectionContext) => {
    const { socket, user } = context;

    socket.on(
        'new_catapult',
        (
            data: unknown,
            callback: (
                response: { ok: false } | { ok: true; inventory: Inventory }
            ) => void
        ) => {
            if (typeof callback !== 'function') return;
            if (
                typeof data !== 'object' ||
                data === null ||
                !('targetUserId' in data) ||
                typeof data.targetUserId !== 'string' ||
                data.targetUserId.trim().length === 0
            ) {
                callback({ ok: false });
                return;
            }

            const room = getCurrentRoom(context);
            if (!room) {
                callback({ ok: false });
                return;
            }

            const inventory = room.payForCatapult(user.id, data.targetUserId);
            if (!inventory) {
                callback({ ok: false });
                return;
            }

            callback({ ok: true, inventory });
        }
    );
};
