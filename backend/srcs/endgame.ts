// backend/srcs/rooms/gameRoom.ts
export function getWinner(room: Room): Player | null {
    if (!room.gameStarted) {
        return null;
    }

    let winner: Player | null = null;

    for (const player of room.players) {
        if (player.isDead) {
            continue;
        }

        if (winner !== null) {
            return null;
        }

        winner = player;
    }

    return winner;
}

// backend/srcs/onConnection.ts
export function kickFromRoom(
    roomId: string,
    targetSocketId: string,
    reason: string
): boolean {
    const room = rooms[roomId];

    if (!room) {
        return false;
    }

    const playerIndex = room.players.findIndex(
        (player) => player.socketId === targetSocketId
    );

    if (playerIndex === -1) {
        return false;
    }

    const player = room.players[playerIndex];
    const targetSocket = io.sockets.sockets.get(targetSocketId);

    targetSocket?.emit('kicked_from_room', {
        roomId,
        reason: 'You were removed from the room'
    });

    targetSocket?.leave(roomId);

    room.players.splice(playerIndex, 1);
    room.playerCount = room.players.length;

    const playerEntry = Object.entries(players).find(
        ([, currentPlayer]) => currentPlayer.socketId === targetSocketId
    );

    if (playerEntry) {
        const [userId] = playerEntry;
        delete players[userId];
    }

    if (room.players.length === 0) {
        delete rooms[roomId];

        console.log('Room deleted:', roomId);
        return true;
    }

    io.to(roomId).emit('player_left', player);

    io.to(roomId).emit('room_update', {
        roomId,
        playerCount: room.playerCount,
        maxPlayers: ROOM_MAX_SIZE
    });

    return true;
}

// backend/srcs/server.ts
const interval = setInterval(() => {
    for (const [roomId, room] of Object.entries(rooms)) {
        if (!room.gameStarted && room.playerCount >= 2) {
            room.gameStarted = true;
            console.log(`Game started in room ${roomId}`);
        }

        const winner = getWinner(room);
        if (winner) {
            room.gameEnded = true;

            console.log(`${winner.username} won`);

            for (var player of room.players) {
                if (player == winner) {
                    kickFromRoom(
                        room.roomId,
                        player.socketId,
                        'Congratulations you won!'
                    );
                } else {
                    kickFromRoom(
                        room.roomId,
                        player.socketId,
                        'Unfortunately you lost!'
                    );
                }
            }
        }
    }
}, 250);

fastify.addHook('onClose', async () => {
    clearInterval(interval);
});

// backend/srcs/onConnection.ts
socket.on(
    'kick_player',
    (roomId: string, targetSocketId: string, reason: string) => {
        const wasKicked = kickFromRoom(roomId, targetSocketId, reason);

        if (!wasKicked) {
            socket.emit('kick_failed', {
                reason: reason
            });
        }
    }
);
