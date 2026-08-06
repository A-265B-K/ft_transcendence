import { randomUUID } from 'node:crypto'
import {  rooms, mockDB } from "../state/gameState.js"
import type { Room } from "../state/gameState.js"
import { generateMap } from '../map/mapGenerator.js'
import { ROOM_MAX_SIZE } from '../constants.js'

const roomId: string  = randomUUID();

rooms[roomId] = {
  roomId: roomId,
  playerCount: 0,
  players: [],
  map: generateMap(ROOM_MAX_SIZE),
};

const createRoom = () => {
	const roomId: string = randomUUID();
	const room: Room = {
		roomId: roomId,
		playerCount: 0,
  		players: [],
  		map: generateMap(ROOM_MAX_SIZE),
	};
	rooms[roomId] = room;

	//TODO: change it to fetch API alkuijte  - POST newroom
	// mockDB.rooms[roomId] = { roomId, playerCount: 0 } This line does not make any sense to me
	console.log('Room created:', roomId) //debbug


	return [room, roomId] as const;
}

export { createRoom }