import type { FastifyInstance } from 'fastify';
import type { RoomManager } from '../roomManager.js';

export function registerSystemRoutes(
    fastify: FastifyInstance,
    roomManager: RoomManager
) {
    fastify.get('/api/ping', () => ({ ok: true }));

    fastify.get('/stats', async () => {
        return {
            activeRooms: roomManager.getActiveRoomCount()
        };
    });
}
