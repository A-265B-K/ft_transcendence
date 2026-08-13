import { randomUUID } from 'crypto';
import { rooms } from "../state/gameState.js";
import type { Room } from "../state/gameState.js";
import { generateMap } from "../map/mapGenerator.js";
import { ROOM_MAX_SIZE } from "../constants.js";


const createRoom = (): [Room, string] => {

	const roomId: string = randomUUID();

	const room: Room = {
		roomId: roomId,
		playerCount: 0,
		players: [],
		map: generateMap(ROOM_MAX_SIZE)
	};

	rooms[roomId] = room;
	console.log("Room created:", roomId);

	return [
		rooms[roomId],
		roomId
	];
};


export { createRoom };