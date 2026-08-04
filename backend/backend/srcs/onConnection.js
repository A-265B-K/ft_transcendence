
import { createRoom } from "./rooms/gameRoom.js"
import { rooms, players, mockDB } from "./state/gameState.ts"
import { PLAYER_DEFAULT_HP, PLAYER_DEFAULT_X, PLAYER_DEFAULT_Y, ROOM_MAX_SIZE } from "./constants.ts"

const findAvailableRoom = () => {
  return Object.entries(rooms).find(
    ([id, room]) => room.players.length < ROOM_MAX_SIZE
  ) || null
}

const getPlayerFromDB = (dataID) => {
	//TODO: change it to fetch API alkuijte (auth)
	return mockDB.players[dataID] || null
}
const createPlayer = (socket, data, slot, spawn) => {
	
	const hasPlayer = getPlayerFromDB(data.id)

	if (hasPlayer)
		return {...hasPlayer, socketID: socket.id}

	console.log('Player not found, creating new') //debbug
	return {
		userID: data.id,
		socketID: socket.id,
		username: data.username,
		slot,
		hp: PLAYER_DEFAULT_HP,
		x: spawn.x,
		y: spawn.y
	}
}

const findAvailableSlot = (room, maxSize) => {
	const usedSlots = new Set(room.players.map(p => p.slot))

	for (let slot = 1; slot <= maxSize; slot++) {
		if (!usedSlots.has(slot)) return slot
	}

	return null
}

const onJoin = (socket, data) => {

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

	// inform DB about the new player on that room
	if (!mockDB.rooms[roomId])
		mockDB.rooms[roomId] = { roomId, playerCount: 0 }
	mockDB.rooms[roomId].playerCount = room.players.length + 1

	const spawn = room.map.spawnPoints.find(sp => sp.playerSlot === slot)

	const player = createPlayer(socket, data, slot, spawn)
	players[socket.id] = player
	room.players.push(player)

	socket.join(roomId)
	socket.to(roomId).emit('player_joined', player.username)
	socket.emit('joined', { roomId, player, map: room.map, players: room.players })

	console.log(`Player ${player.username} joined room ${roomId}
		 (${room.players.length}/${ROOM_MAX_SIZE})`)

	console.log(`Spawn point x: ${player.x} y: ${player.y}`)
	return roomId
}

const onDisconnection = (socket, roomId) => {
	const player = players[socket.id]
	if (!player) return

	delete players[socket.id]

	if (!rooms[roomId]) return

	// remove da sala
	rooms[roomId].players = rooms[roomId].players.filter(
		p => p.socketID !== socket.id
	)

	if (rooms[roomId].players.length === 0) {
		// sala vazia — deleta
		delete rooms[roomId]
		delete mockDB.rooms[roomId]  // TODO: trocar por fetch DELETE ao alkuijte
		console.log('Room deleted:', roomId)
	} else {
		// TODO: avisar DB que sala tem -1 jogador
		mockDB.rooms[roomId].playerCount--
		socket.to(roomId).emit('player_left', player.username)
	}
}

const onConnection = async (socket) => {
	console.log('Player logged in: ', socket.id)
	let currentroomId = null

	socket.on('join', (data) => {
		currentroomId = onJoin(socket, data)
	})
	socket.on('disconnect', () => {
		console.log('Player logged out:', socket.id)
		onDisconnection(socket, currentroomId)
	})
}
export default onConnection