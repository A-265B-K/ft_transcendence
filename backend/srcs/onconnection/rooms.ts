import type { ConnectionContext } from './types.js';
import { onDisconnection } from './onDisconnection.js';

export const registerRoomsHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

    socket.on('get_rooms', () => {
        socket.emit('rooms_list', roomManager.getRooms());
    });

    socket.on('get_room_by_code', ({ code }: { code: unknown }) => {
        if (typeof code !== 'string') {
            socket.emit('join_error', {
                message: 'Invalid room code'
            });

            return;
        }

        const room = roomManager.getRoomByCode(code);

        if (!room) {
            socket.emit('join_error', {
                message: 'Room not found'
            });
            return;
        }
        socket.emit('room_info', room.getRoomInfo());
    });

    socket.on('create_room', ({ name }: { name: unknown }) => {
        if (typeof name !== 'string') {
            socket.emit('join_error', {
                message: 'Invalid room name'
            });
            return;
        }
        const trimmedName = name.trim();

        if (!trimmedName) {
            socket.emit('join_error', {
                message: 'Room name is required'
            });
            return;
        }

        if (trimmedName.length > 30) {
            socket.emit('join_error', {
                message: 'Room name is too long'
            });
            return;
        }

        const roomId = roomManager.createRoom(trimmedName, user.id);

        context.currentRoomId = roomManager.joinRoomById(socket, user, roomId);
    });

    socket.on('join_room', ({ roomId }: { roomId: unknown }) => {
        if (typeof roomId !== 'string') {
            socket.emit('join_error', {
                message: 'Invalid room'
            });

            return;
        }

        const room = roomManager.getRoomById(roomId);

        if (!room) {
            socket.emit('join_error', {
                message: 'Room not found'
            });

            return;
        }
        const check = roomManager.joinRoomById(socket, user, roomId);
        if (check !== null) context.currentRoomId = check;
    });

    socket.on('join_room_code', ({ code }: { code: unknown }) => {
        if (typeof code !== 'string') {
            socket.emit('join_error', {
                message: 'Invalid room code'
            });
            return null;
        }
        context.currentRoomId = roomManager.joinRoomByCode(socket, user, code);
    });

    socket.on('leave_room', () => {
        if (!context.currentRoomId) return;

        onDisconnection(socket, user, context.currentRoomId, roomManager);
        socket.leave(context.currentRoomId);
        context.currentRoomId = null;
    });

    socket.on('game_start', () => {
        if (!context.currentRoomId) return;

        const room = roomManager.getRoomById(context.currentRoomId);
        room?.startgame(user.id, socket);
    });
};
