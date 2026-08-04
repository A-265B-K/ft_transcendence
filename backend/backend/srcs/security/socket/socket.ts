import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket() {
	if (!socket) {
		socket = io("/", {
			withCredentials: true,
		});
	}

	return socket;
}

export function getSocket() {
	return socket;
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}