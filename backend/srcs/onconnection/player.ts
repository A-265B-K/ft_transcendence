import type { ConnectionContext } from './types.js';

export const registerPlayerHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

    socket.on(
        'player_move',
        ({ x, y, moving }: { x: number; y: number; moving: boolean }) => {
            if (!context.currentRoomId) {
                return;
            }
            const room = roomManager.getRoomById(context.currentRoomId);
            room?.onMove(socket, user, { x, y }, moving);
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

            const room = context.currentRoomId
                ? roomManager.getRoomById(context.currentRoomId)
                : undefined;

            const ok = room?.handleAttack(user, data, socket) ?? false;
            callback({ ok });
        }
    );
};
