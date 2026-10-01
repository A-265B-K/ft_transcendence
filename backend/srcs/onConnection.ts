import {
    PLAYER_DEFAULT_HP,
    ROOM_MAX_SIZE,
    PLAYER_DEFAULT_WOOD,
    PLAYER_DEFAULT_IRON,
    PLAYER_DEFAULT_CASTLE_LEVEL
} from './constants.js';
import type { Socket, SocketUser } from './types.js';
import { RoomManager } from './roomManager.js';


const onDisconnection = (
    socket: Socket,
    user: SocketUser,
    roomId: string,
    roomManager: RoomManager
) => {
    // const player = players[user.id];

    // if (!player) return;

    // if (player.socketId !== socket.id) return;

    // delete players[user.id];

    const room = roomManager.getRoomById(roomId);

    if (!room) return;

    room.leave(socket, user.id);
};

const onConnection = async (socket: Socket, roomManager: RoomManager) => {
    const user = socket.user;

    if (!user) {
        console.error('Socket connected without a user, disconnecting');
        socket.disconnect(true);
        return;
    }

    console.log('Player connected:', user.username);

    let currentRoomId: string | null = null;

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

        currentRoomId = roomManager.joinRoomById(socket, user, roomId);
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

        currentRoomId = roomManager.joinRoomById(socket, user, roomId);
    });

    socket.on('join_room_code', ({ code }: { code: unknown }) => {
        if (typeof code !== 'string') {
            socket.emit('join_error', {
                message: 'Invalid room code'
            });
            return null;
        }
        currentRoomId = roomManager.joinRoomByCode(socket, user, code);
    });

    socket.on(
        'player_move',
        ({ x, y, moving }: { x: number; y: number; moving: boolean }) => {
            if (!currentRoomId) {
                return;
            }
            const room = roomManager.getRoomById(currentRoomId);
            room?.onMove(socket, user, { x, y }, moving);
        }
    );

    socket.on('player_attack', (data: unknown) => {
        if (data && typeof data === 'object' && 'direction' in data) {
            if (!currentRoomId) {
                return;
            }
            const room = roomManager.getRoomById(currentRoomId);

            // Ideally this is not an edge case like this
            room?.handleAttack(user, data, socket);
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', user.username);

        if (currentRoomId)
            onDisconnection(socket, user, currentRoomId, roomManager);
    });
};

export default onConnection;
