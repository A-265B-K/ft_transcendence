import { players, rooms, type Room, type Player } from "../state/gameState.js"
import { PLAYER_RADIUS, PLAYER_MAX_SPEED, MOVE_TOLERANCE_SECONDS, MOVE_MAX_ELAPSED_SECONDS } from "../constants.js"
import type { Socket, SocketUser } from "../types.js"

type Pos = { x: number; y: number };
type Resource = Room["map"]["resourceSpawns"][number];

function getDistance(a: Pos, b: Pos): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

// Anti-teleport: rejects a move if it implies a speed higher than the
// player could actually reach, given how much time passed since their
// last move. Also advances player.lastMoveAt as a side effect, so time
// keeps flowing even while movement is being rejected.
function isMovingTooFast(player: Player, pos: Pos): boolean {
	const now = Date.now();
	const elapsedSeconds = Math.min(
		(now - player.lastMoveAt) / 1000,
		MOVE_MAX_ELAPSED_SECONDS
	);

	player.lastMoveAt = now;

	const maxDistance = PLAYER_MAX_SPEED * (elapsedSeconds + MOVE_TOLERANCE_SECONDS);

	return getDistance({ x: player.x, y: player.y }, pos) > maxDistance;
}

function isCollidingWithOtherPlayer(room: Room, selfUserId: string, pos: Pos): boolean {
	for (const otherPlayer of room.players) {
		if (otherPlayer.userId === selfUserId) continue;

		if (getDistance(pos, otherPlayer) < PLAYER_RADIUS * 2)
			return true;
	}

	return false;
}

function isCollidingWithOccupiedCastle(room: Room, selfSlot: number, pos: Pos): boolean {
	for (const castle of room.map.castleZones) {
		if (castle.playerSlot === selfSlot) continue;

		const isOccupied = room.players.some(p => p.slot === castle.playerSlot);
		if (!isOccupied) continue;

		const blockRadius = castle.radius / 2 + PLAYER_RADIUS;
		if (getDistance(pos, castle) < blockRadius)
			return true;
	}

	return false;
}

function tryCollectResource(room: Room, player: Player, pos: Pos) {
	for (const resource of room.map.resourceSpawns) {
		if (getDistance(pos, resource) >= resource.radius + PLAYER_RADIUS)
			continue;

		if (resource.type === "wood") {
			player.inventory.wood += resource.amount;
		} else if (resource.type === "iron") {
			player.inventory.iron += resource.amount;
		} else {
			continue;
		}

		room.map.resourceSpawns = room.map.resourceSpawns.filter(
			r => r.id !== resource.id
		);

		return resource;
	}

	return null;
}

// Brings a collected resource back after its respawnTime, then tells the
// whole room. Uses socket.nsp instead of socket.to/socket because whoever
// collected it may have long disconnected by the time this fires.
function scheduleResourceRespawn(socket: Socket, roomId: string, resource: Resource) {
	setTimeout(() => {
		const room = rooms[roomId];
		if (!room) return;

		room.map.resourceSpawns.push(resource);

		socket.nsp.to(roomId).emit("resource_spawned", {
			resourceId: resource.id,
			type: resource.type,
			x: resource.x,
			y: resource.y,
		});
	}, resource.respawnTime * 1000);
}

const onMove = (socket: Socket, user: SocketUser, roomId: string | null, { x, y }: { x: unknown; y: unknown }) => {
	const player = players[user.id];

	if (!player || !roomId)
		return;

	if (
		typeof x !== "number" ||
		typeof y !== "number" ||
		!Number.isFinite(x) ||
		!Number.isFinite(y)
	) {
		return;
	}

	const maxX = 100 - 1;
	const maxY = 100 - 1;

	if (x < 0 || x > maxX || y < 0 || y > maxY)
		return;

	const room = rooms[roomId];
	if (!room) return;

	const nextPos = { x, y };

	const blocked =
		isMovingTooFast(player, nextPos) ||
		isCollidingWithOtherPlayer(room, user.id, nextPos) ||
		isCollidingWithOccupiedCastle(room, player.slot, nextPos);

	if (!blocked) {
		player.x = x;
		player.y = y;

		socket.to(roomId).emit("player_move", {
			socketId: socket.id,
			x: player.x,
			y: player.y,
		});

		const collectedResource = tryCollectResource(room, player, nextPos);
		if (collectedResource) {
			const payload = {
				resourceId: collectedResource.id,
				type: collectedResource.type,
				x: collectedResource.x,
				y: collectedResource.y,
				playerId: user.id,
				inventory: player.inventory,
			};

			socket.emit("resource_collected", payload);
			socket.to(roomId).emit("resource_collected", payload);

			scheduleResourceRespawn(socket, roomId, collectedResource);
		}
	}

	// Always tell the mover the authoritative position, so the client
	// snaps back when the server rejected the move (blocked or not).
	socket.emit("player_move", {
		socketId: socket.id,
		x: player.x,
		y: player.y,
	});
}

export default onMove;