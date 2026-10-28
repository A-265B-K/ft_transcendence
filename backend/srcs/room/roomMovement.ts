import { PLAYER_RADIUS } from '../constants.js';
import type { GameMap } from '../map.js';
import type { Player } from '../entities/player.js';
import type { Socket, SocketUser, Vec2 } from '../types.js';
import { getDistance } from '../util.js';

type MovementContext = {
    readonly map: GameMap;
    readonly players: ReadonlyMap<string, Player>;
    readonly roomId: string;
};

export function isSlotOccupied(
    players: ReadonlyMap<string, Player>,
    slot: number
): boolean {
    for (const player of players.values()) {
        if (player.getSlot() === slot && player.isAlive()) {
            return true;
        }
    }

    return false;
}

export function isPositionOccupied(
    players: ReadonlyMap<string, Player>,
    selfUserId: string,
    position: Vec2,
    collisionRadius: number
): boolean {
    for (const player of players.values()) {
        if (player.getUserId() === selfUserId) {
            continue;
        }

        if (!player.isAlive()) {
            continue;
        }

        const distance = getDistance(position, player.getPosition());

        if (distance < collisionRadius) {
            return true;
        }
    }

    return false;
}

export function positionIsAllowed(
    map: GameMap,
    players: ReadonlyMap<string, Player>,
    player: Player,
    user: SocketUser,
    pos: Vec2
): boolean {
    return !(
        map.isOutOfBounds(pos) ||
        (player.isAlive() &&
            (isCollidingWithOtherPlayer(players, user.id, pos) ||
                isCollidingWithCastle(map, players, pos)))
    );
}

function isCollidingWithCastle(
    map: GameMap,
    players: ReadonlyMap<string, Player>,
    pos: Vec2
): boolean {
    for (const castle of map.getCastleZones()) {
        if (isSlotOccupied(players, castle.playerSlot)) {
            const blockRadius = castle.radius / 2 + PLAYER_RADIUS;
            if (getDistance(pos, castle.getposition()) < blockRadius)
                return true;
        }
    }

    return false;
}

export function tryCollectResource(map: GameMap, player: Player, pos: Vec2) {
    if (!player.isAlive()) {
        return;
    }
    const resource = map.collectResource(pos);

    if (!resource) {
        return;
    }

    player.addResources(resource);

    return resource;
}

function isCollidingWithOtherPlayer(
    players: ReadonlyMap<string, Player>,
    selfUserId: string,
    pos: Vec2
): boolean {
    return isPositionOccupied(players, selfUserId, pos, PLAYER_RADIUS * 2);
}

export function movePlayer(
    { map, players, roomId }: MovementContext,
    socket: Socket,
    user: SocketUser,
    player: Player,
    { x, y }: Vec2,
    moving: boolean
) {
    const nextPos = { x, y };

    if (!positionIsAllowed(map, players, player, user, player.getPosition())) {
        const closestValidPos = getClosestValidPosition(
            map,
            players,
            player,
            user,
            player.getPosition()
        );
        player.setPosition(closestValidPos.x, closestValidPos.y);
    } else if (
        positionIsAllowed(map, players, player, user, nextPos) &&
        !player.isMovingTooFast(nextPos)
    ) {
        player.setPosition(x, y);

        socket.to(roomId).emit('player_move', {
            socketId: socket.id,
            x,
            y,
            moving
        });

        const collectedResource = tryCollectResource(map, player, nextPos);
        if (collectedResource) {
            const payload = {
                resourceId: collectedResource.id,
                type: collectedResource.type,
                x: collectedResource.x,
                y: collectedResource.y,
                playerId: user.id,
                inventory: player.getInventory()
            };

            socket.emit('resource_collected', payload);
            socket.to(roomId).emit('resource_collected', payload);

            map.scheduleResourceRespawn(socket, roomId, collectedResource);
        }
    }

    const finalPosition = player.getPosition();

    // Always tell the mover the authoritative position, so the client
    // snaps back when the server rejected the move (blocked or not).
    socket.emit('player_move', {
        socketId: socket.id,
        x: finalPosition.x,
        y: finalPosition.y
    });
}

function getClosestValidPosition(
    map: GameMap,
    players: ReadonlyMap<string, Player>,
    player: Player,
    user: SocketUser,
    startPos: Vec2
): Vec2 {
    for (let distance = 0; distance < 100; distance++) {
        for (let x = startPos.x - distance; x <= startPos.x + distance; x++) {
            for (
                let y = startPos.y - distance;
                y <= startPos.y + distance;
                y++
            ) {
                if (positionIsAllowed(map, players, player, user, { x, y })) {
                    return { x, y };
                }
            }
        }
    }

    // In case nothing can be found, spawn at 0
    return { x: 0, y: 0 };
}
