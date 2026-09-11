import { randomUUID } from "crypto";
import { rooms } from "../state/gameState.js";
import type { Room } from "../state/gameState.js";
import { generateMap } from "../map/mapGenerator.js";
import { ROOM_MAX_SIZE } from "../constants.js";

const CODE_CHARACTERS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const generateRoomCode = (): string => {
	let code = "";

	for (let i = 0; i < 6; i++) {
		const index = Math.floor(
			Math.random() * CODE_CHARACTERS.length
		);

		code += CODE_CHARACTERS[index];
	}

	return code;
};

const getUniqueRoomCode = (): string => {
	let code = generateRoomCode();

	while (
		Object.values(rooms).some(
			(room) => room.code === code
		)
	) {
		code = generateRoomCode();
	}

	return code;
};

const createRoom = (
	name: string,
	hostId: string
): [Room, string] => {
	const roomId = randomUUID();
	const code = getUniqueRoomCode();

	const room: Room = {
		roomId,
		name,
		code,
		hostId,
		playerCount: 0,
		players: [],
		map: generateMap(ROOM_MAX_SIZE),
	};

	rooms[roomId] = room;

	console.log(
		`Room created: ${name} [${code}]`
	);

	return [room, roomId];
};

export {
	createRoom,
};