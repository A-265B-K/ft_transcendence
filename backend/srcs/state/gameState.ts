// export const rooms = {}
// export const players = {}

import type { generateMap } from "../map/mapGenerator.js";
import type { Inventory } from "../types.js";


export type WeaponType =
    | "sword"
    | "axe"
    | "bow"
    | "dagger"
    | "spear"
    | "staff";

export type Room = {
	roomId: string;
	name: string;
	code: string;
	hostId: string;
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
	lastMoveAt: number;
	equippedweapon?: WeaponType
}

export const rooms: Record<string, Room> = {};
export const players: Record<string, Player> = {}
