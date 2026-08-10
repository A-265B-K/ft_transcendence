import type { Socket } from "socket.io"

export type Vec2 = {
	x: number;
	y: number;
}

export type Spawn = {
	pos: Vec2;
	playerSlot: number;
}

declare module "socket.io" {
	interface Socket {
		user?: {
			id: string;
			username: string;
			email: string;
		};
	}
}

export type SocketUser = NonNullable<Socket["user"]>;

export type {Socket};