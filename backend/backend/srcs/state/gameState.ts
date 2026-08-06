import type { generateMap } from "../map/mapGenerator.js";
import type { Inventory } from "../types.js";

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
	inventory: Inventory;
}

export const rooms: Record<string, Room> = {};
export const players: Record<string, Player> = {
  "1": { userId: 1, socketId: "notset", username: "player1", hp: 100, slot: false,  x: 0, y: 0, inventory: { iron: 0, wood: 0, castleLevel: 1 } },
  "2": { userId: 2, socketId: "notset", username: "player2", hp: 85, slot: false, x: 10, y: 10, inventory: { iron: 0, wood: 0, castleLevel: 1 } },
};


// mockDB user 
export const mockDB = {
	players: players,
	rooms: rooms,
}