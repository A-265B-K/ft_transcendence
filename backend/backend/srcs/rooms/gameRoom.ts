import { randomUUID } from 'crypto';
import { rooms } from "../state/gameState.js";
import { generateMap } from "../map/mapGenerator.js";
import { ROOM_MAX_SIZE } from "../constants.js";


const createRoom = () => {

	const roomId = randomUUID();

	rooms[roomId] = {
		players: [],
		map: generateMap(ROOM_MAX_SIZE)
	};


	console.log("Room created:", roomId);


	return [
		rooms[roomId],
		roomId
	];
};


export { createRoom };