import type { ConnectionContext } from './types.js';
import type { Inventory } from '../types.js';

export const registerCatapultHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

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
                !context.currentRoomId ||
                typeof data !== 'object' ||
                data === null ||
                !('targetUserId' in data) ||
                typeof data.targetUserId !== 'string' ||
                data.targetUserId.trim().length === 0
            ) {
                callback({ ok: false });
                return;
            }

            const room = roomManager.getRoomById(context.currentRoomId);
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
