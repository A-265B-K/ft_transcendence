// export const rooms = {}
// export const players = {}

import type { generateMap } from "../map/mapGenerator.js";
import type { Inventory } from "../types.js";

export type Room = {
  roomId: string;
  playerCount: number;
  players: Player[];
  map: ReturnType<typeof generateMap>;
};
export type Player = {
	userId: string;
	socketId: string;
	username: string;
	hp: number;
	slot: any;
	x: number;
	y: number;
	inventory: Inventory;
}

export const rooms: Record<string, Room> = {};
export const players: Record<string, Player> = {}
