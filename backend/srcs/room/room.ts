import { randomUUID } from 'crypto';
import { ROOM_MAX_SIZE } from '../constants.js';
import { GameMap } from '../map.js';
import type { Socket, SocketUser, Vec2, boulder } from '../types.js';
import { Player } from '../entities/player.js';
import type { WeaponType } from '../combat/Weapon.js';
import * as roomCombat from './roomCombat.js';
import * as roomMovement from './roomMovement.js';
import { getDistance } from '../util.js';
import { query } from '../security/auth/db.js';

export type Cost = { wood: number; iron: number };
export class Room {
    private name: string;
    private hostId: string;
    private roomId: string;
    private code: string;
    private players: Map<string, Player>;
    private boulders: boulder[] = [];
    private map: GameMap;
    private started: boolean;
    private finished: boolean;
    private timer: ReturnType<typeof setInterval> | null = null;

    constructor(name: string, hostId: string, code: string, socket: Socket) {
        this.name = name;
        this.hostId = hostId;
        this.roomId = randomUUID();
        this.code = code;
        this.players = new Map<string, Player>();
        this.map = new GameMap(ROOM_MAX_SIZE);
        this.started = false;
        this.finished = false;
        console.log(`Room created: ${name} [${this.code}]`);
        this.gameloop(socket);
    }

    private gameloop(socket: Socket) {
        this.timer = setInterval(() => {
            for (const player of this.players.values()) {
                player.poll().then((responsive) => {
                    if (this.players.get(player.getUserId()) !== player) return;
                    if (!responsive) {
                        this.leave(
                            socket.nsp.sockets.get(player.getSocketId()) ??
                                socket,
                            player.getUserId()
                        );
                    }
                });
            }
            if (!this.active()) return;

            for (const player of this.players.values()) {
                player.castlecheck();
                for (const catapult of player.getcatapults()) {
                    catapult.loop();
                }
            }
            this.bouldercheck();
            this.winnercheck(socket);
        }, 250);
    }

    private bouldercheck() {
        const now = Date.now();

        this.boulders = this.boulders.filter((boulder) => {
            if (now < boulder.impacttime) return true;

            for (const player of this.players.values()) {
                if (
                    player.isAlive() &&
                    getDistance(player.getPosition(), boulder.impactlocation) <=
                        3
                ) {
                    player.takeDamage(10);
                }
            }

            return false;
        });
    }

    private async registerwinner(winner: string) {
        const result = await query(
            `
		INSERT INTO completedgames
		(
			gameid,
			winner
		)
		VALUES
		(
			$1,
			$2
		)
		RETURNING
			gameid,
            winner
		`,
            [this.roomId, winner]
        );
        return result.rows[0];
    }
    private winnercheck(socket: Socket) {
        if (!this.active()) return;

        let playercount = 0;
        let winner;
        for (const player of this.players.values()) {
            if (player.isAlive()) {
                winner = player;
                playercount++;
            }
        }
        this.finished = playercount <= 1;
        if (this.hasFinished() && winner) {
            socket.nsp
                .to(this.roomId)
                .emit('game_end', { winnerid: winner.getUserId() });
            this.registerwinner(winner.getUsername());
        }
    }

    destroy(): void {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    getCode(): string {
        return this.code;
    }

    hasStarted(): boolean {
        return this.started;
    }

    hasFinished(): boolean {
        return this.finished;
    }

    active(): boolean {
        return this.hasStarted() && !this.hasFinished();
    }

    startgame(userId: string, socket: Socket) {
        if (!this.isHost(userId) || this.hasStarted()) return;

        this.started = true;
        socket.nsp.to(this.roomId).emit('gamestart', {
            roomId: this.roomId,
            players: Array.from(this.players.values())
        });
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
        const castle = this.map.getCastle(slot);
        if (!spawn || !castle) {
            console.error(`No spawn point found for slot ${slot}`);
            return (joinerror('No spawn point available'), null);
        }

        const player = new Player(
            socket,
            user,
            slot,
            spawn,
            castle,
            this.roomId
        );

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
        return roomMovement.isSlotOccupied(this.players, slot);
    }

    isPositionOccupied(
        selfUserId: string,
        position: Vec2,
        collisionRadius: number
    ): boolean {
        return roomMovement.isPositionOccupied(
            this.players,
            selfUserId,
            position,
            collisionRadius
        );
    }

    positionIsAllowed(player: Player, user: SocketUser, pos: Vec2): boolean {
        return roomMovement.positionIsAllowed(
            this.map,
            this.players,
            player,
            user,
            pos
        );
    }

    tryCollectResource(player: Player, pos: Vec2) {
        return roomMovement.tryCollectResource(this.map, player, pos);
    }

    private getPlayerByUserId(userId: string): Player | null {
        const player = this.players.get(userId);

        if (player) {
            return player;
        }
        return null;
    }

    leave(socket: Socket, userId: string) {
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
    }

    onMove(
        socket: Socket,
        user: SocketUser,
        { x, y }: { x: number; y: number },
        moving: boolean
    ) {
        const player = this.getPlayerByUserId(user.id);
        if (!player || !this.active()) return;

        return roomMovement.movePlayer(
            { map: this.map, players: this.players, roomId: this.roomId },
            socket,
            user,
            player,
            { x, y },
            moving
        );
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

        if (!player || !this.active()) {
            return null;
        }

        const cost = weaponRecipes[weapon];

        if (!cost) {
            return null;
        }

        return player.craftWeapon(cost, weapon);
    }
    equiparmor(userId: string): boolean {
        if (!this.active()) return false;

        return this.getPlayerByUserId(userId)?.equiparmor() ?? false;
    }

    payForCatapult(userId: string, targetUserId: string) {
        if (!this.active()) return null;

        const player = this.getPlayerByUserId(userId);
        const target = this.getPlayerByUserId(targetUserId);
        if (
            !target ||
            targetUserId === userId ||
            !target.isAlive() ||
            !player?.payForCatapult(target, this.map)
        )
            return null;

        return player.getInventory();
    }

    upgradecastle(userId: string) {
        if (!this.active()) return null;
        if (this.getPlayerByUserId(userId)?.upgradecastle())
            return this.getPlayerByUserId(userId)?.getInventory();
        else return null;
    }

    handleAttack(
        user: SocketUser,
        data: { direction: unknown },
        socket: Socket
    ): boolean {
        const player = this.getPlayerByUserId(user.id);
        if (!player || !this.active()) return false;

        return roomCombat.handleRoomAttack(
            player,
            this.players,
            this.roomId,
            socket,
            data
        );
    }
    castleattack(user: SocketUser, socket: Socket) {
        const player = this.getPlayerByUserId(user.id);
        if (!this.active() || !player || !player.isAlive()) return false;

        const shot = player.castleattack();
        if (shot === null) return;

        socket.nsp.to(this.roomId).emit('castle_attack_started', {
            socketId: player.getSocketId(),
            start: shot.start,
            target: shot.target,
            durationMs: 1500
        });

        const newboulder: boulder = {
            impacttime: Date.now() + 1500,
            impactlocation: shot.target
        };
        this.boulders.push(newboulder);
    }
}
