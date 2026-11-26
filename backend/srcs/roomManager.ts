import { ROOM_MAX_SIZE } from './constants.js';
import { Room } from './room/room.js';
import type { Socket, SocketUser } from './types.js';

export class RoomManager {
    private rooms: Record<string, Room> = {};
    private readonly cleanupTimer: ReturnType<typeof setInterval>;

    constructor() {
        this.cleanupTimer = setInterval(() => {
            for (const [roomId, room] of Object.entries(this.rooms)) {
                if (room.getPlayerCount() === 0) this.deleteRoomById(roomId);
            }
        }, 2000);
        this.cleanupTimer.unref();
    }

    createRoom(name: string, hostId: string, socket: Socket): string {
        const room = new Room(name, hostId, socket);

        this.rooms[room.getRoomId()] = room;

        return room.getRoomId();
    }

    deleteRoomById(roomId: string) {
        const room = this.getRoomById(roomId);

        if (!room) {
            return;
        }
        room.destroy();
        delete this.rooms[roomId];
    }

    destroy(): void {
        clearInterval(this.cleanupTimer);
        for (const roomId of Object.keys(this.rooms)) {
            this.deleteRoomById(roomId);
        }
    }

    getRooms() {
        return Object.values(this.rooms)
            .filter(
                (room) =>
                    room.getPlayerCount() < ROOM_MAX_SIZE && !room.hasStarted()
            )
            .map((room) => ({
                roomId: room.getRoomId(),
                name: room.getName(),
                playerCount: room.getPlayerCount(),
                maxPlayers: ROOM_MAX_SIZE
            }));
    }

    getRoomById(roomId: string): Room | null {
        const room = this.rooms[roomId];
        if (room) {
            return room;
        }
        return null;
    }
    nameExists(name: string) {
        if (name) {
            for (const room of Object.values(this.rooms)) {
                if (room.getName() === name) return true;
            }
        }
        return false;
    }

    getActiveRoomCount(): number {
        return Object.keys(this.rooms).length;
    }

    joinRoomById(
        socket: Socket,
        user: SocketUser,
        roomId: string
    ): string | null {
        const room = this.getRoomById(roomId);
        if (!room) {
            socket.emit('join_error', {
                message: 'Room not found'
            });
            return null;
        }

        return room.join(socket, user);
    }
}
