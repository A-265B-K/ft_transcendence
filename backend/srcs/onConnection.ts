import { createRoom } from "./rooms/gameRoom.js"
import { rooms, players, type Room, type Player } from "./state/gameState.js"
import onMove from "./events/onMove.js"
import { PLAYER_DEFAULT_HP, ROOM_MAX_SIZE, 
	PLAYER_DEFAULT_WOOD, PLAYER_DEFAULT_IRON,
	PLAYER_DEFAULT_CASTLE_LEVEL } from "./constants.js"
import type { Spawn, Socket, SocketUser } from "./types.js"

const createPlayer = (
	socket: Socket,
	user: SocketUser,
	slot: number,
	spawn: Spawn,
): Player => {
	return {
		userId: user.id,
		socketId: socket.id,
		username: user.username,
		slot,
		hp: PLAYER_DEFAULT_HP,
		x: spawn.pos.x,
		y: spawn.pos.y,
		inventory: {
			iron: PLAYER_DEFAULT_IRON,
			wood: PLAYER_DEFAULT_WOOD,
			castleLevel: PLAYER_DEFAULT_CASTLE_LEVEL,
		},
		lastMoveAt: Date.now(),
		equippedweapon: "sword"
	};
};

const findAvailableSlot = (room: Room, maxSize: number) => {
	const usedSlots = new Set(room.players.map(p => p.slot))

	for (let slot = 1; slot <= maxSize; slot++) {
		if (!usedSlots.has(slot)) return slot
	}

	return null
}

const joinRoom = (socket: Socket, user: SocketUser, room: Room): string | null => {
	if (players[user.id]) {
		socket.emit("join_error", {
			message:
				"Already connected in another session",
		});

		return null;
	}

	if (room.players.length >= ROOM_MAX_SIZE) {
		socket.emit("join_error", {
			message: "Room is full",
		});

		return null;
	}

	const slot = findAvailableSlot(room, ROOM_MAX_SIZE)

	if (slot === null) {
		socket.emit("join_error", {
			message:
				"No player slot available",
		});

		return null;
	}

	const spawn = room.map.spawnPoints.find(sp => sp.playerSlot === slot)

	if (!spawn) {
  		console.error(`No spawn point found for slot ${slot}`);
  		socket.emit('join_error', { message: 'No spawn point available' });
		return null;
	}

	const player = createPlayer(socket, user, slot, spawn);

	players[user.id] = player
	room.players.push(player)
	room.playerCount = room.players.length

	socket.join(room.roomId)
	socket.to(room.roomId).emit("player_joined", player);

	socket.emit("joined", {
		roomId: room.roomId,
		player,
		map: room.map,
		players: room.players,
		room: {
			roomId: room.roomId,
			name: room.name,
			code: room.code,
			playerCount: room.playerCount,
			maxPlayers: ROOM_MAX_SIZE,
		},
	});

	console.log(
		`Player ${player.username} joined ` +
		`${room.name} (${room.playerCount}/` +
		`${ROOM_MAX_SIZE})`
	);

	return room.roomId;
};

const getRooms = () => {
	return Object.values(rooms)
		.filter(
			(room) =>
				room.players.length <
				ROOM_MAX_SIZE
		)
		.map((room) => ({
			roomId: room.roomId,
			name: room.name,
			playerCount: room.players.length,
			maxPlayers: ROOM_MAX_SIZE,
		}));
};

const getRoomByCode = (
	code: string
): Room | null => {
	const normalizedCode =
		code.trim().toUpperCase();

	return (
		Object.values(rooms).find(
			(room) =>
				room.code === normalizedCode
		) ?? null
	);
};

const onDisconnection = (
	socket: Socket,
	user: SocketUser,
	roomId: string
) => {
	const player = players[user.id];

	if (!player)
		return;

	if (player.socketId !== socket.id)
		return;

	delete players[user.id];

	const room = rooms[roomId];

	if (!room)
		return;

	room.players = room.players.filter(
		(currentPlayer) =>
			currentPlayer.socketId !== socket.id
	);

	room.playerCount = room.players.length;

	if (room.players.length === 0) {
		delete rooms[roomId];

		console.log(
			"Room deleted:",
			roomId
		);

		return;
	}

	socket.to(roomId).emit(
		"player_left",
		player
	);

	socket.to(roomId).emit(
		"room_update",
		{
			roomId: room.roomId,
			playerCount: room.playerCount,
			maxPlayers: ROOM_MAX_SIZE,
		}
	);
};

const onConnection = async (socket: Socket) => {

	const user = socket.user;

	if (!user) {
		console.error("Socket connected without a user, disconnecting");
		socket.disconnect(true);
		return;
	}

	console.log(
		"Player connected:",
		user.username
	);

	let currentRoomId: string | null = null;

	socket.on("get_rooms", () => {
		socket.emit(
			"rooms_list",
			getRooms()
		);
	});

	socket.on(
		"get_room_by_code",
		({ code }: { code: unknown }) => {
			if (typeof code !== "string") {
				socket.emit("join_error", {
					message:
						"Invalid room code",
				});

				return;
			}

			const room =
				getRoomByCode(code);

			if (!room) {
				socket.emit("join_error", {
					message:
						"Room not found",
				});

				return;
			}

			socket.emit("room_info", {
				roomId: room.roomId,
				name: room.name,
				code: room.code,
				playerCount:
					room.players.length,
				maxPlayers:
					ROOM_MAX_SIZE,
			});
		}
	);

	socket.on(
		"create_room",
		({ name }: { name: unknown }) => {
			if (typeof name !== "string") {
				socket.emit("join_error", {
					message:
						"Invalid room name",
				});

				return;
			}

			const trimmedName =
				name.trim();

			if (!trimmedName) {
				socket.emit("join_error", {
					message:
						"Room name is required",
				});

				return;
			}

			if (trimmedName.length > 30) {
				socket.emit("join_error", {
					message:
						"Room name is too long",
				});

				return;
			}

			const [room, roomId] =
				createRoom(
					trimmedName,
					user.id
				);

			currentRoomId = joinRoom(
				socket,
				user,
				room
			);

			if (!currentRoomId) {
				delete rooms[roomId];
			}
		}
	);

	socket.on(
		"join_room",
		({ roomId }: { roomId: unknown }) => {
			if (typeof roomId !== "string") {
				socket.emit("join_error", {
					message:
						"Invalid room",
				});

				return;
			}

			const room = rooms[roomId];

			if (!room) {
				socket.emit("join_error", {
					message:
						"Room not found",
				});

				return;
			}

			currentRoomId = joinRoom(
				socket,
				user,
				room
			);
		}
	);

	socket.on(
		"join_room_code",
		({ code }: { code: unknown }) => {
			if (typeof code !== "string") {
				socket.emit("join_error", {
					message:
						"Invalid room code",
				});

				return;
			}

			const room =
				getRoomByCode(code);

			if (!room) {
				socket.emit("join_error", {
					message:
						"Room not found",
				});

				return;
			}

			currentRoomId = joinRoom(
				socket,
				user,
				room
			);
		}
	);

	socket.on(
		"player_move",
		({
			x,
			y,
		}: {
			x: unknown;
			y: unknown;
		}) => {
			onMove(
				socket,
				user,
				currentRoomId,
				{ x, y }
			);
		}
	);

	socket.on('disconnect', () => {

		console.log(
			"Player disconnected:",
			user.username
		);

		if (currentRoomId)
			onDisconnection(socket, user, currentRoomId);
	});
};

export default onConnection;