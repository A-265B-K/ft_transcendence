import { createRoom } from "./rooms/gameRoom.js"
import { rooms, players } from "./state/gameState.js"
import { getOrCreateInventory, saveInventory } from "./state/inventoryRepository.js"
import {
	PLAYER_DEFAULT_HP,
	PLAYER_DEFAULT_X,
	PLAYER_DEFAULT_Y,
	ROOM_MAX_SIZE
} from "./constants.js"

const findAvailableRoom = () => {
  return Object.entries(rooms).find(
    ([id, room]) => room.players.length < ROOM_MAX_SIZE
  ) || null
}

const createPlayer = (socket, user, slot, spawn, inventory) => {

	return {
		userID: user.id,
		socketID: socket.id,
		username: user.username,
		slot,
		hp: PLAYER_DEFAULT_HP,
		x: spawn.x,
		y: spawn.y,
		inventory
	};
};

const findAvailableSlot = (room, maxSize) => {
	const usedSlots = new Set(room.players.map(p => p.slot))

	for (let slot = 1; slot <= maxSize; slot++) {
		if (!usedSlots.has(slot)) return slot
	}

	return null
}

const onJoin = async (socket, data) => {

	const { inventory, isNewPlayer } = await getOrCreateInventory(socket.user.id)

	if (isNewPlayer) {
		console.log(`New player ${socket.user.username} — inventory created with defaults`)
	} else {
		console.log(`Returning player ${socket.user.username} — inventory loaded`, inventory)
	}

	let available = findAvailableRoom()
	let room
	let roomId

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
		return
	}

	const spawn = room.map.spawnPoints.find(sp => sp.playerSlot === slot)

	const player = createPlayer(socket, socket.user, slot, spawn, inventory)
	players[socket.id] = player
	room.players.push(player)

	socket.join(roomId)
	socket.to(roomId).emit('player_joined', player.username)
	socket.emit('joined', { roomId, player, map: room.map, players: room.players })

	console.log(`Player ${player.username} joined room ${roomId}
		 (${room.players.length}/${ROOM_MAX_SIZE})`)

	console.log(`Spawn point x: ${player.x} y: ${player.y}`)
	player.inventory.iron++
	console.log(`Inventory: iron ${player.inventory.iron}
		wood ${player.inventory.wood}
		castleLevel ${player.inventory.castleLevel}`)
	return roomId
}

const onDisconnection = async (socket, roomId) => {
	const player = players[socket.id]
	if (!player) return

	await saveInventory(player.userID, player.inventory)

	delete players[socket.id]

	if (!rooms[roomId]) return

	rooms[roomId].players = rooms[roomId].players.filter(
		p => p.socketID !== socket.id
	)

	if (rooms[roomId].players.length === 0) {
		// empty room — delete it
		delete rooms[roomId]
		console.log('Room deleted:', roomId)
	} else {
		socket.to(roomId).emit('player_left', player.username)
	}
}

const onConnection = async (socket) => {

	console.log(
		"Player connected:",
		socket.user.username
	);
	let currentroomId = null;

	socket.on('join', async () => {
		currentroomId = await onJoin(socket);
	});

	socket.on('disconnect', async () => {

		console.log(
			"Player disconnected:",
			socket.user.username
		);

		await onDisconnection(socket, currentroomId);
	});
};

export default onConnection;