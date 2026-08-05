import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;


export function connectSocket() {
	console.log("connectSocket() called");

	if (!socket) {
		socket = io();

		socket.on("connect", () => {
			console.log(
				"Socket connected:",
				socket?.id
			);
		});
	}

	return socket;
}


export function getSocket() {
	return socket;
}