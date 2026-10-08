import { randomUUID } from 'crypto';
import { PLAYER_RADIUS, ROOM_MAX_SIZE } from './constants.js';
import { GameMap } from './map.js';
import type { Socket, SocketUser, Vec2 } from './types.js';
import { Player, type WeaponType } from './player.js';
import { getDistance, isvaliddirection } from './util.js';
import { istargethit } from './combat/Detection.js';
import { getattackstats } from './combat/Attackstats.js';

export type Cost = { wood: number; iron: number };

export class Room {
    private name: string;
    private hostId: string;
    private roomId: string;
    private code: string;
    private players: Map<string, Player>;
    private map: GameMap;
    private started: boolean;

    constructor(name: string, hostId: string, code: string) {
        this.name = name;
        this.hostId = hostId;
        this.roomId = randomUUID();
        this.code = code;
        this.players = new Map<string, Player>();
        this.map = new GameMap(ROOM_MAX_SIZE);
        this.started = false;
        console.log(`Room created: ${name} [${this.code}]`);
    }

    // TODO add destructor;

    getCode(): string {
        return this.code;
    }

    hasStarted(): boolean {
        return this.started;
    }
    startgame(userId: string, socket: Socket): boolean {
        if (!this.isHost(userId) || this.hasStarted()) return false;

        this.started = true;
        socket.nsp.to(this.roomId).emit('gamestart', {
            roomId: this.roomId,
            players: Array.from(this.players.values())
        });
        return true;
    }

    isHost(userId: string): boolean {
        return this.hostId == userId;
    }

    getRoomId(): string {
        return this.roomId;
    }

    getPlayerCount(): number {
        return this.players.size;
    }

    getName(): string {
        return this.name;
    }

    getRoomInfo(): {
        roomId: string;
        name: string;
        code: string;
        playerCount: number;
        maxPlayers: number;
        hostId: string;
        started: boolean;
    } {
        return {
            roomId: this.roomId,
            name: this.name,
            code: this.code,
            playerCount: this.getPlayerCount(),
            maxPlayers: ROOM_MAX_SIZE,
            hostId: this.hostId,
            started: this.started
        };
    }

    join(socket: Socket, user: SocketUser): string | null {
        if (this.hasStarted()) return (joinerror('Game has started'), null);

        this.RemovePreviousSession(user.id, socket);

        const existingplayer = this.getPlayerByUserId(user.id);
        if (existingplayer) return (joinerror('Player already in room'), null);

        if (this.getPlayerCount() >= ROOM_MAX_SIZE)
            return (joinerror('Room is full'), null);

        const slot = this.findAvailableSlot(ROOM_MAX_SIZE);
        if (slot === null) return (joinerror('No player slot available'), null);

        const spawn = this.map.getSpawnPoint(slot);
        if (!spawn) {
            console.error(`No spawn point found for slot ${slot}`);
            return (joinerror('No spawn point available'), null);
        }

        const player = new Player(socket, user, slot, spawn);

        this.players.set(user.id, player);

        socket.join(this.roomId);
        socket.nsp.to(this.roomId).emit('room_update', {
            roomId: this.roomId,
            playerCount: this.getPlayerCount(),
            maxPlayers: ROOM_MAX_SIZE,
            hostId: this.hostId
        });
        socket.to(this.roomId).emit('player_joined', player);

        socket.emit('joined', {
            roomId: this.roomId,
            player,
            map: this.map,
            players: Array.from(this.players.values()),
            room: this.getRoomInfo()
        });

        console.log(
            `Player ${player.getUsername()} joined ` +
                `${this.name} (${this.getPlayerCount()}/` +
                `${ROOM_MAX_SIZE})`
        );

        return this.roomId;

        function joinerror(error: string) {
            socket.emit('join_error', {
                message: error
            });
        }
    }

    private findAvailableSlot(maxSize: number): number | null {
        const usedSlots = new Set(
            Array.from(this.players.values()).map((player) => player.getSlot())
        );

        for (let slot = 1; slot <= maxSize; slot++) {
            if (!usedSlots.has(slot)) return slot;
        }

        return null;
    }

    isSlotOccupied(slot: number): boolean {
        for (const player of this.players.values()) {
            if (player.getSlot() === slot && !player.getIsDead()) {
                return true;
            }
        }

        return false;
    }

    isPositionOccupied(
        selfUserId: string,
        position: Vec2,
        collisionRadius: number
    ): boolean {
        for (const player of this.players.values()) {
            if (player.getUserId() === selfUserId) {
                continue;
            }

            if (player.getIsDead()) {
                continue;
            }

            const distance = getDistance(position, player.getPosition());

            if (distance < collisionRadius) {
                return true;
            }
        }

        return false;
    }

    positionIsAllowed(player: Player, user: SocketUser, pos: Vec2): boolean {
        return !(
            this.map.isOutOfBounds(pos) ||
            (!player.getIsDead() &&
                (this.isCollidingWithOtherPlayer(user.id, pos) ||
                    this.isCollidingWithCastle(pos)))
        );
    }

    private isCollidingWithCastle(pos: Vec2): boolean {
        for (const castle of this.map.getCastleZones()) {
            if (this.isSlotOccupied(castle.playerSlot)) {
                const blockRadius = castle.radius / 2 + PLAYER_RADIUS;
                if (getDistance(pos, castle) < blockRadius) return true;
            }
        }

        return false;
    }

    tryCollectResource(player: Player, pos: Vec2) {
        if (player.getIsDead()) {
            return;
        }
        const resource = this.map.collectResource(pos);

        if (!resource) {
            return;
        }

        player.addResources(resource);

        return resource;
    }

    private isCollidingWithOtherPlayer(selfUserId: string, pos: Vec2): boolean {
        return this.isPositionOccupied(selfUserId, pos, PLAYER_RADIUS * 2);
    }

    private getPlayerByUserId(userId: string): Player | null {
        const player = this.players.get(userId);

        if (player) {
            return player;
        }
        return null;
    }

    leave(socket: Socket, userId: string): boolean {
        const player = this.getPlayerByUserId(userId);

        if (player) {
            socket.to(this.roomId).emit('player_left', player);

            this.players.delete(userId);
            if (this.isHost(userId) && this.getPlayerCount() > 0) {
                const newhost = this.players.values().next().value?.getUserId();
                if (newhost) this.hostId = newhost;
            }
            socket.to(this.roomId).emit('room_update', {
                roomId: this.roomId,
                playerCount: this.getPlayerCount(),
                maxPlayers: ROOM_MAX_SIZE,
                hostId: this.hostId
            });
        }
        return this.getPlayerCount() === 0;
    }

    onMove(
        socket: Socket,
        user: SocketUser,
        { x, y }: { x: number; y: number },
        moving: boolean
    ) {
        const player = this.getPlayerByUserId(user.id);
        if (!player || !this.hasStarted()) {
            return;
        }

        const nextPos = { x, y };

        if (!this.positionIsAllowed(player, user, player.getPosition())) {
            const closestValidPos = this.getClosestValidPosition(
                player,
                user,
                player.getPosition()
            );
            player.setPosition(closestValidPos.x, closestValidPos.y);
        } else if (
            this.positionIsAllowed(player, user, nextPos) &&
            !player.isMovingTooFast(nextPos)
        ) {
            player.setPosition(x, y);

            socket.to(this.roomId).emit('player_move', {
                socketId: socket.id,
                x,
                y,
                moving
            });

            const collectedResource = this.tryCollectResource(player, nextPos);
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
                socket.to(this.roomId).emit('resource_collected', payload);

                this.map.scheduleResourceRespawn(
                    socket,
                    this.roomId,
                    collectedResource
                );
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

    private getClosestValidPosition(
        player: Player,
        user: SocketUser,
        startPos: Vec2
    ): Vec2 {
        for (let distance = 0; distance < 100; distance++) {
            for (
                let x = startPos.x - distance;
                x <= startPos.x + distance;
                x++
            ) {
                for (
                    let y = startPos.y - distance;
                    y <= startPos.y + distance;
                    y++
                ) {
                    if (this.positionIsAllowed(player, user, { x, y })) {
                        return { x, y };
                    }
                }
            }
        }

        // In case nothing can be found, spawn at 0
        return { x: 0, y: 0 };
    }

    RemovePreviousSession(userId: string, socket: Socket) {
        const existingPlayer = this.getPlayerByUserId(userId);

        if (!existingPlayer) {
            return;
        }

        if (existingPlayer.getSocketId() === socket.id) {
            return;
        }

        this.leave(socket, userId);

        console.log(`Removed old session for user ${userId}`);
    }

    craftWeapon(
        userId: string,
        weapon: WeaponType
    ): null | {
        weapon: WeaponType;
        inventory: { wood: number; iron: number };
    } {
        const weaponRecipes: Record<string, Cost> = {
            dagger: { wood: 15, iron: 15 },
            sword: { wood: 30, iron: 20 },
            spear: { wood: 30, iron: 20 },
            axe: { wood: 20, iron: 30 }
        };

        const player = this.getPlayerByUserId(userId);

        if (!player || !this.hasStarted()) {
            return null;
        }

        const cost = weaponRecipes[weapon];

        if (!cost) {
            return null;
        }

        return player.craftWeapon(cost, weapon);
    }

    handleAttack(
        user: SocketUser,
        data: { direction: unknown },
        socket: Socket
    ): void {
        const player = this.getPlayerByUserId(user.id);

        if (!player || !this.hasStarted()) {
            return;
        }

        if (player.getEquippedWeapon() && player.isAlive()) {
            const direction = data.direction;
            const attackStats = getattackstats(player.getEquippedWeapon());

            if (isvaliddirection(direction) && attackStats) {
                socket.to(this.roomId).emit('player_attacked', {
                    socketId: player.getSocketId(),
                    direction: direction
                });
                for (const [, target] of this.players) {
                    if (
                        target.getUserId() !== player.getUserId() &&
                        target.hasHp() &&
                        target.isAlive()
                    ) {
                        if (
                            istargethit(
                                player.getPosition(),
                                target.getPosition(),
                                attackStats,
                                direction
                            )
                        ) {
                            const isDead = target.takeDamage(
                                attackStats.damage
                            );

                            socket.nsp
                                .to(target.getSocketId())
                                .emit('player_hp', {
                                    socketId: target.getSocketId(),
                                    hp: target.getHp()
                                });

                            console.log(
                                player.getUsername(),
                                'hit',
                                target.getUsername(),
                                'for',
                                attackStats.damage,
                                'damage'
                            );

                            if (isDead) {
                                socket.nsp
                                    .to(target.getSocketId())
                                    .emit('player_died');
                                socket.nsp.to(this.roomId).emit('player_died', {
                                    player: target
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}
