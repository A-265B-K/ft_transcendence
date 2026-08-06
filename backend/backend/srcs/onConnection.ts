
import { createRoom } from "./rooms/gameRoom.js"
import { rooms, players, mockDB, type Room , type Player } from "./state/gameState.js"
import {
	PLAYER_DEFAULT_HP,
	PLAYER_DEFAULT_X,
	PLAYER_DEFAULT_Y,
	PLAYER_DEFAULT_IRON,
	PLAYER_DEFAULT_WOOD,
	PLAYER_DEFAULT_CASTLE_LEVEL,
	ROOM_MAX_SIZE
} from "./constants.js"

import type { Spawn, Vec2 } from "./types.js"
import type { Socket } from "socket.io"

const findAvailableRoom = () => {
  return Object.entries(rooms).find(
    ([id, room]) => room.players.length < ROOM_MAX_SIZE
  ) || null
}

const getPlayerFromDB = (dataId: number) => {
	//TODO: change it to fetch API alkuijte (auth)
	return mockDB.players[dataId] || null
}

// Turn : any into more exact data types
const createPlayer = (socket: Socket, data: any, slot: any, spawn: Spawn ) => {
	
	const hasPlayer = getPlayerFromDB(data.id)

	if (hasPlayer)
		return {...hasPlayer, socketID: socket.id}

	console.log('Player not found, creating new') //debbug

	const player: Player = {
		userId: data.id,
		socketId: socket.id,
		username: data.username,
		slot,
		hp: PLAYER_DEFAULT_HP,
		x: spawn.pos.x,
		y: spawn.pos.y,
		inventory: {
			iron: PLAYER_DEFAULT_IRON,
			wood: PLAYER_DEFAULT_WOOD,
			castleLevel: PLAYER_DEFAULT_CASTLE_LEVEL
		}
	}

	return player;
}

const findAvailableSlot = (room: Room, maxSize: number) => {
	const usedSlots = new Set(room.players.map(p => p.slot))

	for (let slot = 1; slot <= maxSize; slot++) {
		if (!usedSlots.has(slot)) return slot
	}

	return null
}

const onJoin = (socket: Socket, data: any) => {

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
		return
	}

	// inform DB about the new player on that room
	// Flima please double check this code, I am not sure if it has the intended bevaviour
	if (!mockDB.rooms[roomId]) {
		mockDB.rooms[roomId] = {
			roomId: roomId,
			playerCount: room.playerCount,
			players: room.players,
			map: room.map,
		}
	}
	mockDB.rooms[roomId] = {
		roomId: roomId,
		playerCount: room.playerCount + 1,
		players: room.players,
		map: room.map,
	}

	// Rework this bit to be easier to read and ideally avoid the tspawn var
	const tspawn = room.map.spawnPoints.find(sp => sp.playerSlot === slot)
	if (tspawn == undefined) {
		console.error(`Unable to find a spawn location`)
		socket.emit('join_error', { message: 'Unable to find a spawn location' })
		return
	}
	const spawn = {
		playerId: tspawn.playerSlot,
		pos: { x: tspawn.x, y: tspawn.y },
	};

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

const onDisconnection = (socket: Socket, roomId: string) => {
	const player = players[socket.id]
	if (!player) return

	delete players[socket.id]

	const room = rooms[roomId]
	if (!room) return

	room.players = room.players.filter(p => p.socketId !== socket.id)

	if (room.players.length === 0) {
	  delete rooms[roomId]
	  delete mockDB.rooms[roomId]
	  console.log("Room deleted:", roomId)
	} else {
	  const dbRoom = mockDB.rooms[roomId]
	  if (!dbRoom) return

	  dbRoom.playerCount = (dbRoom.playerCount ?? 0) - 1;
	  socket.to(roomId).emit('player_left', player.username);
	}
}

const onConnection = async (socket: Socket) => {
	console.log('Player logged in: ', socket.id)
	let currentroomId: string;

	socket.on('join', (data) => {
		currentroomId = onJoin(socket, data)! // Potentially causes bugs if Id is null
	})
	socket.on('disconnect', () => {
		console.log('Player logged out:', socket.id)
		onDisconnection(socket, currentroomId)
	})
}
export default onConnection