import type { Socket, SocketUser } from './types.js';
import { RoomManager } from './roomManager.js';

const onDisconnection = (
    socket: Socket,
    user: SocketUser,
    roomId: string,
    roomManager: RoomManager
) => {
    const room = roomManager.getRoomById(roomId);

    if (!room) return;

    room.leave(socket, user.id);
    // TODO roomManager.deleteRoom
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

    socket.on(
        'craftweapon',
        (
            data: unknown,
            reply: (
                result:
                    | {
                          success: true;
                          weapon: string;
                          inventory: { wood: number; iron: number };
                      }
                    | { success: false }
            ) => void
        ) => {
            if (
                typeof data !== 'object' ||
                !currentRoomId ||
                data === null ||
                !('weapon' in data) ||
                (data.weapon !== 'dagger' &&
                    data.weapon !== 'sword' &&
                    data.weapon !== 'spear' &&
                    data.weapon !== 'axe')
            ) {
                reply({ success: false });
                return;
            }

            const room = roomManager.getRoomById(currentRoomId);
            const weapon = data.weapon;

            const res = room?.craftWeapon(user.id, weapon);
            if (!res) {
                reply({ success: false });
                return;
            }
            reply({
                success: true,
                weapon: res.weapon,
                inventory: res.inventory
            });
        }
    );

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
