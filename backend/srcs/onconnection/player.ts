import type { ConnectionContext } from './types.js';
import { getCurrentRoom } from './currentRoom.js';

export const registerPlayerHandlers = (context: ConnectionContext) => {
    const { socket, user } = context;

    socket.on(
        'player_move',
        ({ x, y, moving }: { x: number; y: number; moving: boolean }) => {
            getCurrentRoom(context)?.onMove(socket, user, { x, y }, moving);
        }
    );

    socket.on(
        'player_attack',
        (data: unknown, callback: (response: { ok: boolean }) => void) => {
            if (typeof callback !== 'function') return;
            if (!data || typeof data !== 'object' || !('direction' in data)) {
                callback({ ok: false });
                return;
            }

            const ok =
                getCurrentRoom(context)?.handleAttack(user, data, socket) ??
                false;
            callback({ ok });
        }
    );
};
