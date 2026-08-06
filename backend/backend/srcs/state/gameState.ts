import type { generateMap } from "../map/mapGenerator.js";

export type Room = {
  roomId: string;
  playerCount: number;
  players: Player[];
  map: ReturnType<typeof generateMap>;
};
export type Player = {
	userId: number;
	socketId: string;
	username: string;
	hp: number;
	slot: any;
	x: number;
	y: number;
}

export const rooms: Record<string, Room> = {};
export const players: Record<string, Player> = {
  "1": { userId: 1, socketId: "notset", username: "player1", hp: 100, slot: false,  x: 0, y: 0 },
  "2": { userId: 2, socketId: "notset", username: "player2", hp: 85, slot: false, x: 10, y: 10 },
};


// mockDB user 
export const mockDB = {
	players: players,
	rooms: rooms,
}