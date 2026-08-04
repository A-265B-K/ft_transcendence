import { randomUUID } from 'node:crypto'
import { rooms, mockDB } from "../state/gameState.ts"
import { generateMap } from '../map/mapGenerator.ts'
import { ROOM_MAX_SIZE } from '../constants.ts'

const createRoom = () => {
	const roomId = randomUUID()
	rooms[roomId] = { 
		players: [],
		map: generateMap(ROOM_MAX_SIZE)
	}

	//TODO: change it to fetch API alkuijte  - POST newroom
	mockDB.rooms[roomId] = { roomId, playerCount: 0 }
	console.log('Room created:', roomId) //debbug

	return [rooms[roomId], roomId]

}

export { createRoom }