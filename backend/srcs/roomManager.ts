import { ROOM_MAX_SIZE } from './constants.js';
import { Room } from './room.js';
import type { Socket, SocketUser } from './types.js';

export class RoomManager {
    private rooms: Record<string, Room> = {};
    private code_characters: string;

    constructor() {
        this.code_characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    }

    createRoom(name: string, hostId: string): string {
        const room = new Room(name, hostId, this.getUniqueRoomCode());

        this.rooms[room.getRoomId()] = room;

        return room.getRoomId();
    }

    deleteRoomById(roomId: string) {
        const room = this.getRoomById(roomId);

        if (!room) {
            return;
        }

        delete this.rooms[roomId];
    }

    private getUniqueRoomCode(): string {
        let code = this.generateRoomCode();

        while (
            Object.values(this.rooms).some((room) => room.getCode() === code)
        ) {
            code = this.generateRoomCode();
        }

        return code;
    }

    private generateRoomCode(): string {
        let code = '';

        for (let i = 0; i < 6; i++) {
            const index = Math.floor(
                Math.random() * this.code_characters.length
            );

            code += this.code_characters[index];
        }
        return code;
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

    getRoomByCode(code: string): Room | null {
        const normalizedCode = code.trim().toUpperCase();

        return (
            Object.values(this.rooms).find(
                (room) => room.getCode() === normalizedCode
            ) ?? null
        );
    }

    getRoomById(roomId: string): Room | null {
        const room = this.rooms[roomId];
        if (room) {
            return room;
        }
        return null;
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

    joinRoomByCode(
        socket: Socket,
        user: SocketUser,
        code: string
    ): string | null {
        const room = this.getRoomByCode(code);

        if (!room) {
            socket.emit('join_error', {
                message: 'Room not found'
            });
            return null;
        }

        return room.join(socket, user);
    }
}
