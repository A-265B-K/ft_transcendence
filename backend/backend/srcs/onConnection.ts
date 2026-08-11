import { createRoom } from "./rooms/gameRoom.js"
import { rooms, players, type Room } from "./state/gameState.js"
import { PLAYER_DEFAULT_HP, ROOM_MAX_SIZE, 
	PLAYER_DEFAULT_WOOD, PLAYER_DEFAULT_IRON,
	PLAYER_DEFAULT_CASTLE_LEVEL } from "./constants.js"
import type { Spawn, Socket, SocketUser } from "./types.js"

const findAvailableRoom = () => {
  return Object.entries(rooms).find(
    ([id, room]) => room.players.length < ROOM_MAX_SIZE
  ) || null
}

const createPlayer = (socket: Socket, user: SocketUser, slot: number, spawn: Spawn) => {

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
			castleLevel: PLAYER_DEFAULT_CASTLE_LEVEL }
	};
};

const findAvailableSlot = (room: Room, maxSize: number) => {
	const usedSlots = new Set(room.players.map(p => p.slot))

	for (let slot = 1; slot <= maxSize; slot++) {
		if (!usedSlots.has(slot)) return slot
	}

	return null
}

const onJoin = (socket: Socket, user: SocketUser): string | null => {

	if (players[user.id]) {
		console.log(`Player ${user.username} (${user.id}) is already connected, rejecting new join from socket ${socket.id}`)
		socket.emit('join_error', { message: 'Already connected in another session' })
		return null
	}

	let available = findAvailableRoom()
	let room: Room
	let roomId: string

	if (!available) {
		const [newRoom, newRoomId] = createRoom()
		room = newRoom
		roomId = newRoomId
	} else {
		[roomId, room] = available
	}

	const slot = findAvailableSlot(room, ROOM_MAX_SIZE)

	if (slot === null) {
		console.error(`Room ${roomId} has no available slot even though it should have space`)
		socket.emit('join_error', { message: 'Room is full' })
		return null
	}

	const spawn = room.map.spawnPoints.find(sp => sp.playerSlot === slot)

	if (!spawn) {
  		console.error(`No spawn point found for slot ${slot}`);
  		socket.emit('join_error', { message: 'No spawn point available' });
  		return null;
	}

	const player = createPlayer(socket, user, slot, spawn)
	players[user.id] = player
	room.players.push(player)

	socket.join(roomId)
	socket.to(roomId).emit('player_joined', player)
	socket.emit('joined', { roomId, player, map: room.map, players: room.players })

	console.log(`Player ${player.username} joined room ${roomId}
		 (${room.players.length}/${ROOM_MAX_SIZE})`)

	console.log(`Spawn point x: ${player.x} y: ${player.y}`)
	return roomId
}

const onDisconnection = (socket: Socket, user: SocketUser, roomId: string) => {
	const player = players[user.id]
	if (!player) return

	if (player.socketId !== socket.id) return

	delete players[user.id]

	if (!rooms[roomId]) return

	// remove from the room 
	rooms[roomId].players = rooms[roomId].players.filter(
		p => p.socketId !== socket.id
	)

	if (rooms[roomId].players.length === 0) {
		// empty room - delete
		delete rooms[roomId]
		console.log('Room deleted:', roomId)
	} else {
		socket.to(roomId).emit('player_left', player.username)
	}
}

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
	let currentroomId: string | null = null;

	socket.on('join', () => {
		currentroomId = onJoin(socket, user);
	});
	//handle currentroomId is null

	socket.on("player_move", ({ x, y }) => {
		const player = players[user.id];

		if (!player || !currentroomId)
			return;

		if (
			typeof x !== "number" ||
			typeof y !== "number" ||
			!Number.isFinite(x) ||
			!Number.isFinite(y)
		) {
			return;
		}

		const maxX = 100 - 1;
		const maxY = 100 - 1;

		if (x < 0 || x > maxX || y < 0 || y > maxY)
			return;

		player.x = x;
		player.y = y;

		socket.to(currentroomId).emit("player_move", {
			socketId: socket.id,
			x: player.x,
			y: player.y,
		});
	});

	socket.on('disconnect', () => {

		console.log(
			"Player disconnected:",
			user.username
		);
		
		if (currentroomId)
			onDisconnection(socket, user, currentroomId);
	});
};

export default onConnection;