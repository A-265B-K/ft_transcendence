import { randomUUID } from 'crypto';
import {
    CASTLE_RADIUS,
    MIN_DIST_CASTLE,
    PLAYER_RADIUS,
    CATAPULT_ATTACK_RANGE,
    CATAPULT_RADIUS
} from './constants.js';
import type { Socket, Spawn, Vec2 } from './types.js';
import { getDistance, randomPos } from './util.js';
import type { Room } from './room/room.js';
import { Castle } from './entities/castle.js';

export type Resource = Room['map']['resourceSpawns'][number];

function getMapSize(playerCount: number): number {
    const sizes: Record<number, number> = {
        1: 30,
        2: 60,
        3: 70,
        4: 80
    };
    const size = sizes[playerCount];
    if (!size) {
        throw new Error(`Invalid player count: ${playerCount}`);
    }
    return size;
}

export class GameMap {
    private mapId: string;
    private width: number;
    private height: number;
    private castleZones: Castle[];
    private spawnPoints: Map<number, Spawn>;
    private obstacles: ReturnType<typeof this.generateObstacles>;
    private resourceSpawns: ReturnType<typeof this.generateResourceSpawns>;
    private catapultPositions = new Map<string, Vec2>();

    constructor(playerSlots: number[]) {
        this.mapId = randomUUID();
        const mapSize = getMapSize(playerSlots.length);
        this.width = mapSize;
        this.height = mapSize;
        this.castleZones = this.generateCastleZones(playerSlots);
        this.spawnPoints = this.generateSpawnPoints(this.castleZones);
        this.obstacles = this.generateObstacles(this.getMapDensityCount(15));
        this.resourceSpawns = this.generateResourceSpawns(
            this.obstacles,
            this.getMapDensityCount(35)
        );
    }

    private getMapDensityCount(baseCount: number): number {
        return Math.round(
            (baseCount * (this.width * this.height)) / (100 * 100)
        );
    }

    private generateSpawnPoints(castleZones: Castle[]) {
        const castleClearance = CASTLE_RADIUS / 2 + PLAYER_RADIUS + 1;
        const castleOffset = castleClearance / Math.sqrt(2);

        const spawnPoints = new Map<number, Spawn>(
            castleZones.map((castle) => {
                const position = castle.getposition();
                return [
                    castle.playerSlot,
                    {
                        playerSlot: castle.playerSlot,
                        pos: {
                            x: position.x + castleOffset,
                            y: position.y + castleOffset
                        }
                    }
                ];
            })
        );

        return spawnPoints;
    }

    private generateCastleZones(playerSlots: number[]) {
        const minDistBetweenCastles = MIN_DIST_CASTLE;
        const castleZones: Castle[] = [];
        let attempts = 0;
        const maxAttempts = playerSlots.length * 100;

        while (
            castleZones.length < playerSlots.length &&
            attempts < maxAttempts
        ) {
            attempts++;
            const pos = randomPos(this.width, this.height);
            let tooClose = castleZones.some(
                (c) => getDistance(pos, c.getposition()) < minDistBetweenCastles
            );

            if (
                pos.x - CASTLE_RADIUS / 2 < 0 ||
                pos.x + CASTLE_RADIUS / 2 > this.width ||
                pos.y - CASTLE_RADIUS / 2 < 0 ||
                pos.y + CASTLE_RADIUS / 2 > this.height
            ) {
                tooClose = true;
            }

            if (!tooClose) {
                castleZones.push(
                    new Castle(playerSlots[castleZones.length]!, pos)
                );
            }
        }

        if (castleZones.length < playerSlots.length) {
            throw new Error(
                `Could only place ${castleZones.length}/${playerSlots.length} castles`
            );
        }

        return castleZones;
    }

    private generateObstacles(count = 15) {
        const obstacles = [];
        const types = [
            { type: 'rock', radius: 4 },
            { type: 'tree', radius: 2 }
        ];

        let attempts = 0;
        while (obstacles.length < count && attempts < count * 20) {
            attempts++;
            const pos = randomPos(this.width, this.height);

            if (!this.isValidPosition(pos, 5, 4, obstacles)) continue;

            if (types.length === 0) {
                throw new Error('types must not be empty');
            }
            const template = types[Math.floor(Math.random() * types.length)]!;
            obstacles.push({
                type: template.type,
                x: pos.x,
                y: pos.y,
                radius: template.radius,
                blocksMovement: true
            });
        }

        return obstacles;
    }

    private isValidPosition(
        pos: { x: number; y: number },
        minDistFromCastle: number,
        minDistFromOthers: number,
        obstacles: Vec2[]
    ) {
        for (const castle of this.castleZones) {
            if (
                getDistance(pos, castle.getposition()) <
                castle.radius + minDistFromCastle
            ) {
                return false;
            }
        }

        for (const obj of obstacles) {
            if (getDistance(pos, obj) < minDistFromOthers) {
                return false;
            }
        }

        return true;
    }

    private generateResourceSpawns(
        obstacles: {
            type: string;
            x: number;
            y: number;
            radius: number;
            blocksMovement: boolean;
        }[],
        count = 10000
    ) {
        const resources = [];
        const types = [
            { type: 'wood', amount: 10, respawnTime: 30 },
            { type: 'iron', amount: 10, respawnTime: 35 }
        ];

        let attempts = 0;

        while (resources.length < count && attempts < count * 20) {
            attempts++;
            const pos = randomPos(this.width, this.height);

            if (!this.isValidPosition(pos, 6, 5, obstacles)) continue;

            if (types.length === 0) {
                throw new Error('types must not be empty');
            }
            const template = types[Math.floor(Math.random() * types.length)]!;
            const resource: {
                id: string;
                type: string;
                x: number;
                y: number;
                amount: number;
                respawnTime: number;
                radius: number;
                blocksMovement: boolean;
            } = {
                id: `${template.type}_${resources.length + 1}`,
                type: template.type,
                x: pos.x,
                y: pos.y,
                amount: template.amount,
                respawnTime: template.respawnTime,
                // Please check if these are correct values as I do not know what they do
                radius: 1,
                blocksMovement: false
            };

            resources.push(resource);
        }

        return resources;
    }

    getSpawnPoint(slot: number): Spawn | null {
        const spawn = this.spawnPoints.get(slot);
        if (spawn) {
            return spawn;
        }
        return null;
    }

    // Brings a collected resource back after its respawnTime, then tells the
    // whole room. Uses socket.nsp instead of socket.to/socket because whoever
    // collected it may have long disconnected by the time this fires.
    scheduleResourceRespawn(
        socket: Socket,
        roomId: string,
        resource: Resource
    ) {
        setTimeout(() => {
            this.resourceSpawns.push(resource);

            socket.nsp.to(roomId).emit('resource_spawned', {
                resourceId: resource.id,
                type: resource.type,
                x: resource.x,
                y: resource.y
            });
        }, resource.respawnTime * 1000);
    }

    getCastleZones(): Castle[] {
        return this.castleZones;
    }

    getCastle(slot: number): Castle | null {
        return (
            this.castleZones.find((castle) => castle.playerSlot === slot) ??
            null
        );
    }

    reserveCatapultPosition(
        catapultId: string,
        preferredPosition: Vec2,
        originCastle: Castle
    ): Vec2 | null {
        const spacing = CATAPULT_RADIUS * 2 + 0.25;
        const maxRadius = Math.ceil(
            Math.max(this.width, this.height) / spacing
        );

        for (let radius = 0; radius <= maxRadius; radius++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                for (let offsetY = -radius; offsetY <= radius; offsetY++) {
                    if (
                        radius > 0 &&
                        Math.max(Math.abs(offsetX), Math.abs(offsetY)) !==
                            radius
                    ) {
                        continue;
                    }

                    const candidate = {
                        x: preferredPosition.x + offsetX * spacing,
                        y: preferredPosition.y + offsetY * spacing
                    };

                    if (
                        candidate.x < 0 ||
                        candidate.x > this.width ||
                        candidate.y < 0 ||
                        candidate.y > this.height ||
                        this.obstacles.some(
                            (obstacle) =>
                                getDistance(candidate, obstacle) <=
                                obstacle.radius + CATAPULT_RADIUS
                        ) ||
                        this.castleZones.some(
                            (castle) =>
                                castle !== originCastle &&
                                getDistance(candidate, castle.getposition()) <=
                                    castle.radius + CATAPULT_RADIUS
                        ) ||
                        this.hasCatapultCollision(candidate, catapultId)
                    ) {
                        continue;
                    }

                    this.catapultPositions.set(catapultId, candidate);
                    return { ...candidate };
                }
            }
        }

        return null;
    }

    canCatapultMoveTo(catapultId: string, position: Vec2): boolean {
        return !this.hasCatapultCollision(position, catapultId);
    }

    updateCatapultPosition(catapultId: string, position: Vec2): boolean {
        if (!this.catapultPositions.has(catapultId)) return false;
        if (!this.canCatapultMoveTo(catapultId, position)) return false;

        this.catapultPositions.set(catapultId, { ...position });
        return true;
    }

    removeCatapultPosition(catapultId: string): void {
        this.catapultPositions.delete(catapultId);
    }

    private hasCatapultCollision(position: Vec2, catapultId: string): boolean {
        for (const [otherId, otherPosition] of this.catapultPositions) {
            if (
                otherId !== catapultId &&
                getDistance(position, otherPosition) < CATAPULT_RADIUS * 2
            ) {
                return true;
            }
        }

        return false;
    }

    findCatapultPath(
        start: Vec2,
        target: Vec2,
        originCastle: Castle,
        targetCastle: Castle,
        catapultId: string
    ): Vec2[] {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 1 },
            { x: 1, y: -1 },
            { x: -1, y: 1 },
            { x: -1, y: -1 }
        ];
        const startNode = { x: Math.round(start.x), y: Math.round(start.y) };
        const targetNode = { x: Math.round(target.x), y: Math.round(target.y) };
        const nodeKey = (node: Vec2) => `${node.x},${node.y}`;
        const heuristic = (node: Vec2) => {
            const dx = Math.abs(node.x - targetNode.x);
            const dy = Math.abs(node.y - targetNode.y);
            return 14 * Math.min(dx, dy) + 10 * Math.abs(dx - dy);
        };
        const isBlocked = (node: Vec2) => {
            if (
                node.x < 0 ||
                node.x > this.width ||
                node.y < 0 ||
                node.y > this.height
            ) {
                return true;
            }

            if (
                this.obstacles.some(
                    (obstacle) => getDistance(node, obstacle) <= obstacle.radius
                )
            ) {
                return true;
            }

            if (
                nodeKey(node) !== nodeKey(startNode) &&
                this.hasCatapultCollision(node, catapultId)
            ) {
                return true;
            }

            return this.castleZones.some(
                (castle) =>
                    castle !== originCastle &&
                    castle !== targetCastle &&
                    getDistance(node, castle.getposition()) <= castle.radius
            );
        };
        const open: { node: Vec2; score: number }[] = [];
        const cameFrom = new Map<string, string>();
        const nodes = new Map<string, Vec2>([[nodeKey(startNode), startNode]]);
        const costSoFar = new Map<string, number>([[nodeKey(startNode), 0]]);
        const startKey = nodeKey(startNode);
        open.push({ node: startNode, score: heuristic(startNode) });

        const push = (entry: { node: Vec2; score: number }) => {
            open.push(entry);
            let index = open.length - 1;
            while (index > 0) {
                const parentIndex = Math.floor((index - 1) / 2);
                if (open[parentIndex]!.score <= entry.score) break;
                open[index] = open[parentIndex]!;
                index = parentIndex;
            }
            open[index] = entry;
        };

        const pop = () => {
            const first = open[0]!;
            const last = open.pop()!;
            if (open.length > 0) {
                let index = 0;
                while (index * 2 + 1 < open.length) {
                    let childIndex = index * 2 + 1;
                    if (
                        childIndex + 1 < open.length &&
                        open[childIndex + 1]!.score < open[childIndex]!.score
                    ) {
                        childIndex++;
                    }
                    if (open[childIndex]!.score >= last.score) break;
                    open[index] = open[childIndex]!;
                    index = childIndex;
                }
                open[index] = last;
            }
            return first;
        };

        if (isBlocked(startNode)) return [];

        let destinationKey: string | null = null;
        while (open.length > 0) {
            const current = pop()!.node;
            const currentKey = nodeKey(current);

            if (getDistance(current, target) <= CATAPULT_ATTACK_RANGE) {
                destinationKey = currentKey;
                break;
            }

            for (const direction of directions) {
                const neighbor = {
                    x: current.x + direction.x,
                    y: current.y + direction.y
                };
                if (isBlocked(neighbor)) continue;
                if (
                    direction.x !== 0 &&
                    direction.y !== 0 &&
                    (isBlocked({ x: current.x + direction.x, y: current.y }) ||
                        isBlocked({ x: current.x, y: current.y + direction.y }))
                ) {
                    continue;
                }

                const neighborKey = nodeKey(neighbor);
                const nextCost =
                    costSoFar.get(currentKey)! +
                    (direction.x !== 0 && direction.y !== 0 ? 14 : 10);
                if (nextCost >= (costSoFar.get(neighborKey) ?? Infinity))
                    continue;

                cameFrom.set(neighborKey, currentKey);
                nodes.set(neighborKey, neighbor);
                costSoFar.set(neighborKey, nextCost);
                push({ node: neighbor, score: nextCost + heuristic(neighbor) });
            }
        }

        if (!destinationKey || destinationKey === startKey) return [];

        const path: Vec2[] = [];
        let currentKey = destinationKey;
        while (currentKey !== startKey) {
            const node = nodes.get(currentKey);
            const previousKey = cameFrom.get(currentKey);
            if (!node || !previousKey) return [];
            path.push(node);
            currentKey = previousKey;
        }

        return path.reverse();
    }

    isOutOfBounds(pos: Vec2): boolean {
        return (
            pos.x < 0 || pos.x > this.width || pos.y < 0 || pos.y > this.height
        );
    }

    collectResource(pos: Vec2): Resource | null {
        for (const resource of this.resourceSpawns) {
            if (getDistance(pos, resource) >= resource.radius + PLAYER_RADIUS)
                continue;
            this.resourceSpawns = this.resourceSpawns.filter(
                (r) => r.id !== resource.id
            );
            return resource;
        }
        return null;
    }

    getDimensions() {
        return {
            width: this.width,
            height: this.height
        };
    }
}
