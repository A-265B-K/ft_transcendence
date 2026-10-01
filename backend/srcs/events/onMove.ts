import { players, rooms, type Room, type Player } from '../state/gameState.js';
import {
    PLAYER_RADIUS,
    PLAYER_MAX_SPEED,
    MOVE_TOLERANCE_SECONDS,
    MOVE_MAX_ELAPSED_SECONDS,
    MAP_WIDTH,
    MAP_HEIGHT
} from '../constants.js';
import type { Socket, SocketUser, Vec2 } from '../types.js';

type Resource = Room['map']['resourceSpawns'][number];

function getDistance(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Anti-teleport: rejects a move if it implies a speed higher than the
// player could actually reach, given how much time passed since their
// last move. Also advances player.lastMoveAt as a side effect, so time
// keeps flowing even while movement is being rejected.
function isMovingTooFast(player: Player, pos: Vec2): boolean {
    const now = Date.now();
    const elapsedSeconds = Math.min(
        (now - player.lastMoveAt) / 1000,
        MOVE_MAX_ELAPSED_SECONDS
    );

    player.lastMoveAt = now;

    const maxDistance =
        PLAYER_MAX_SPEED * (elapsedSeconds + MOVE_TOLERANCE_SECONDS);

    return getDistance({ x: player.x, y: player.y }, pos) > maxDistance;
}

function isCollidingWithOtherPlayer(
    room: Room,
    selfUserId: string,
    pos: Vec2
): boolean {
    for (const otherPlayer of room.players) {
        if (otherPlayer.userId === selfUserId || otherPlayer.isDead) continue;

        if (getDistance(pos, otherPlayer) < PLAYER_RADIUS * 2) return true;
    }

    return false;
}

function isOutOfBounds(pos: Vec2): boolean {
    if (pos.x < 0 || pos.x > MAP_WIDTH || pos.y < 0 || pos.y > MAP_HEIGHT) {
        return true;
    }
    return false;
}

// Rename this to isCollidingWithCastle
function isCollidingWithOccupiedCastle(
    room: Room,
    selfSlot: number,
    pos: Vec2
): boolean {
    for (const castle of room.map.castleZones) {
        const isOccupied = room.players.some(
            (p) => p.slot === castle.playerSlot && !p.isDead
        );
        if (!isOccupied) continue;

        const blockRadius = castle.radius / 2 + PLAYER_RADIUS;
        if (getDistance(pos, castle) < blockRadius) return true;
    }

    return false;
}

function tryCollectResource(room: Room, player: Player, pos: Vec2) {
    if (player.isDead) return;
    for (const resource of room.map.resourceSpawns) {
        if (getDistance(pos, resource) >= resource.radius + PLAYER_RADIUS)
            continue;

        if (resource.type === 'wood') {
            player.inventory.wood += resource.amount;
        } else if (resource.type === 'iron') {
            player.inventory.iron += resource.amount;
        } else {
            continue;
        }

        room.map.resourceSpawns = room.map.resourceSpawns.filter(
            (r) => r.id !== resource.id
        );

        return resource;
    }

    return null;
}

// Brings a collected resource back after its respawnTime, then tells the
// whole room. Uses socket.nsp instead of socket.to/socket because whoever
// collected it may have long disconnected by the time this fires.
function scheduleResourceRespawn(
    socket: Socket,
    roomId: string,
    resource: Resource
) {
    setTimeout(() => {
        const room = rooms[roomId];
        if (!room) return;

        room.map.resourceSpawns.push(resource);

        socket.nsp.to(roomId).emit('resource_spawned', {
            resourceId: resource.id,
            type: resource.type,
            x: resource.x,
            y: resource.y
        });
    }, resource.respawnTime * 1000);
}

function positionIsAllowed(
    player: Player,
    user: SocketUser,
    room: Room,
    pos: Vec2
): boolean {
    return !(
        isOutOfBounds(pos) ||
        (!player.isDead &&
            (isCollidingWithOtherPlayer(room, user.id, pos) ||
                isCollidingWithOccupiedCastle(room, player.slot, pos)))
    );
}

function getClosestValidPosition(
    player: Player,
    user: SocketUser,
    room: Room,
    startPos: Vec2
): Vec2 {
    for (let distance = 0; distance < 100; distance++) {
        for (let x = startPos.x - distance; x <= startPos.x + distance; x++) {
            for (
                let y = startPos.y - distance;
                y <= startPos.y + distance;
                y++
            ) {
                if (positionIsAllowed(player, user, room, { x, y })) {
                    return { x, y };
                }
            }
        }
    }

    // In case nothing can be found, spawn at 0
    return { x: 0, y: 0 };
}

const onMove = (
    socket: Socket,
    user: SocketUser,
    roomId: string | null,
    { x, y }: { x: number; y: number },
    moving: boolean
) => {
    const player = players[user.id];
    if (!player || !roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    const nextPos = { x, y };

    if (!positionIsAllowed(player, user, room, { x: player.x, y: player.y })) {
        const closestValidPos = getClosestValidPosition(player, user, room, {
            x: player.x,
            y: player.x
        });
        player.x = closestValidPos.x;
        player.y = closestValidPos.y;
    } else if (
        positionIsAllowed(player, user, room, nextPos) &&
        !isMovingTooFast(player, nextPos)
    ) {
        player.x = x;
        player.y = y;

        socket.to(roomId).emit('player_move', {
            socketId: socket.id,
            x: player.x,
            y: player.y,
            moving: moving
        });

        const collectedResource = tryCollectResource(room, player, nextPos);
        if (collectedResource) {
            const payload = {
                resourceId: collectedResource.id,
                type: collectedResource.type,
                x: collectedResource.x,
                y: collectedResource.y,
                playerId: user.id,
                inventory: player.inventory
            };

            socket.emit('resource_collected', payload);
            socket.to(roomId).emit('resource_collected', payload);

            scheduleResourceRespawn(socket, roomId, collectedResource);
        }
    }

    // Always tell the mover the authoritative position, so the client
    // snaps back when the server rejected the move (blocked or not).
    socket.emit('player_move', {
        socketId: socket.id,
        x: player.x,
        y: player.y
    });
};

export default onMove;
