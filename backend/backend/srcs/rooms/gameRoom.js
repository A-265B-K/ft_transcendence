import { randomUUID } from 'node:crypto'
import { rooms, mockDB } from "../state/gameState.js"
import { MAP_TEMPLATE } from '../map/mapLoader.js'

const createRoom = () => {
	const roomId = randomUUID()
	rooms[roomId] = { 
		players: [],
		map: structuredClone(MAP_TEMPLATE)
	}

	//TODO: change it to fetch API alkuijte  - POST newroom
	mockDB.rooms[roomId] = { roomId, playerCount: 0 }
	console.log('Room created:', roomId) //debbug

	return [rooms[roomId], roomId]

}

export { createRoom }