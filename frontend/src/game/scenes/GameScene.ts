import { Container } from "pixi.js";
import { Player, type InputState } from "../entities/Player";
import { Castle } from "../entities/Castle";
import { Camera } from "../systems/Camera";
import { GameMap } from "../world/GameMap";
import type { HarvestableTile } from "../world/tileResource";
import type { GameTextures } from "../assets/loadGameTextures";
import { isoX, isoY } from "../world/iso";
import type { JoinedPayload } from "../../types/game";
import { RemotePlayer } from "../entities/RemotePlayer";
import type { Socket } from "socket.io-client";

export class GameScene {
    readonly world: Container;
    readonly map: GameMap;
    readonly player: Player;
    readonly castle: Castle;
    readonly castles = new Map<number, Castle>();
    readonly camera: Camera;
    readonly joinedData: JoinedPayload;
    readonly remotePlayers = new Map<string, RemotePlayer>();
    readonly textures: GameTextures;
    readonly socket: Socket;

    constructor(
        textures: GameTextures,
        joinedData: JoinedPayload,
        socket: Socket,
    ) {
        this.socket = socket;
        this.textures = textures;
        this.joinedData = joinedData;

        this.world = new Container();
        this.world.sortableChildren = true;

        this.map = new GameMap(
            textures.grass,
            textures.wood,
            textures.iron,
            joinedData.map
        );

        this.world.addChild(this.map.container);

        this.player = new Player({
            playerDown1: textures.playerDown1,
            playerDown2: textures.playerDown2,

            playerUp1: textures.playerUp1,
            playerUp2: textures.playerUp2,

            playerLeft1: textures.playerLeft1,
            playerLeft2: textures.playerLeft2,

            playerRight1: textures.playerRight1,
            playerRight2: textures.playerRight2,

            playerStand: textures.playerStand,
        });

        this.player.placeAt(
            joinedData.player.x,
            joinedData.player.y
        );

        this.world.addChild(
            this.player.sprite,
        );

        this.createRemotePlayers();

        this.castle =
            this.createCastles();

        this.camera =
            new Camera(this.world);
    }

    private createRemotePlayers() {
        for (
            const player of
            this.joinedData.players
        ) {
            if (
                player.socketId ===
                this.joinedData.player.socketId
            ) {
                continue;
            }

            this.addRemotePlayer(player);
        }
    }

    private createCastles(): Castle {
        let ownCastle:
            Castle | undefined;

        for (
            const zone of
            this.joinedData.map.castleZones
        ) {
            const player =
                this.joinedData.players.find(
                    p =>
                        p.slot ===
                        zone.playerSlot,
                );

            if (!player) {
                continue;
            }

            const castle =
                this.createCastle();

            castle.placeAt(
                zone.x,
                zone.y,
            );

            /*
             * The backend provides the
             * authoritative castle level.
             *
             * The frontend only displays it.
             */
            castle.setLevel(
                player.inventory.castleLevel,
            );

            this.map.clearTile(
                castle.gridX,
                castle.gridY
            );

            this.castles.set(
                zone.playerSlot,
                castle
            );

            this.world.addChild(
                castle.container
            );

            if (
                zone.playerSlot ===
                this.joinedData.player.slot
            ) {
                ownCastle = castle;
            }
        }

        if (!ownCastle) {
            throw new Error("Own castle was not found");
        }

        return ownCastle;
    }

    private createCastle() {
        return new Castle({
            castle1:
                this.textures.castle1,
            castle2:
                this.textures.castle2,
            castle3:
                this.textures.castle3,
            castle4:
                this.textures.castle4,
        });
    }

    addRemotePlayer(
        player: JoinedPayload["players"][number]
    ) {
        if (
            player.socketId ===
            this.joinedData.player.socketId
        ) {
            return;
        }

        if (
            this.remotePlayers.has(
                player.socketId
            )
        ) {
            return;
        }

        const remote = new RemotePlayer(
                {
                playerDown1: this.textures.playerDown1,
                playerDown2: this.textures.playerDown2,

                playerUp1: this.textures.playerUp1,
                playerUp2: this.textures.playerUp2,

                playerLeft1: this.textures.playerLeft1,
                playerLeft2: this.textures.playerLeft2,

                playerRight1: this.textures.playerRight1,
                playerRight2: this.textures.playerRight2,

                playerStand: this.textures.playerStand,
                },
            player.userId
            );

        remote.placeAt(
            player.x,
            player.y
        );

        this.remotePlayers.set(
            player.socketId,
            remote
        );

        this.world.addChild(
            remote.sprite
        );
    }

    addRemoteCastle(
        player: JoinedPayload["players"][number]
    ) {
        if (
            this.castles.has(player.slot)
        ) {
            return;
        }

        const zone =
            this.joinedData.map.castleZones.find(
                zone =>
                    zone.playerSlot ===
                    player.slot
            );

        if (!zone)
            return;

        const castle =
            this.createCastle();

        castle.placeAt(
            zone.x,
            zone.y
        );

        /*
         * The backend provides the
         * authoritative castle level.
         */
        castle.setLevel(
            player.inventory.castleLevel,
        );

        this.map.clearTile(
            castle.gridX,
            castle.gridY
        );

        this.castles.set(
            player.slot,
            castle
        );

        this.world.addChild(
            castle.container
        );
    }

    removeRemoteCastle(
        player: JoinedPayload["players"][number]
    ) {
        const castle =
            this.castles.get(
            player.slot
            );

        if (!castle)
            return;

        this.world.removeChild(
            castle.container
        );

        castle.container.destroy({
            children: true,
        });

        this.castles.delete(
            player.slot
        );
    }

    removeRemotePlayer(
        player: JoinedPayload["players"][number]
    ) {
        const remote =
            this.remotePlayers.get(
                player.socketId
            );

        if (!remote)
            return;

        this.world.removeChild(
            remote.sprite
        );

        remote.sprite.destroy();

        this.remotePlayers.delete(
            player.socketId
        );
    }

    update(
        inputState: InputState,
        screenWidth: number,
        screenHeight: number,
        deltaSeconds: number
    ) {
        const oldX = this.player.gridX;
        const oldY = this.player.gridY;

        /*
         * Local movement prediction.
         *
         * The backend remains authoritative
         * and can correct the position.
         */
        this.player.update(
            inputState,
            deltaSeconds
        );

        const movedDistance = Math.hypot(
            this.player.gridX - oldX,
            this.player.gridY - oldY
            );

        if (movedDistance > 0.05) {
            this.socket.emit(
                "player_move",
                {
                    x: this.player.gridX,
                    y: this.player.gridY,
                }
            );
        }

        /*
         * Camera is client-side.
         */
        this.camera.update(
            this.player,
            screenWidth,
            screenHeight,
            deltaSeconds
        );

        /*
         * Visible map rendering is
         * client-side.
         */
        this.map.update(
            screenWidth,
            screenHeight,
            this.camera.x,
            this.camera.y,
        );
    }

    getCastlePointer() {
        const playerScreenX = isoX(
                this.player.gridX,
            this.player.gridY
            );

        const playerScreenY = isoY(
                this.player.gridX,
            this.player.gridY
            );

        const castleScreenX = isoX(
                this.castle.gridX,
            this.castle.gridY
            );

        const castleScreenY = isoY(
                this.castle.gridX,
            this.castle.gridY
            );

        const dx =
            castleScreenX -
            playerScreenX;

        const dy =
            castleScreenY -
            playerScreenY;

        const distance = Math.hypot(
                this.castle.gridX -
                this.player.gridX,
                this.castle.gridY -
                this.player.gridY
            );

        const rotation = Math.atan2(
                dy,
                dx
            );

        const bearingDegrees =
            (rotation * 180) / Math.PI;

        const normalizedBearing =
            (bearingDegrees + 360) % 360;

        return {
            rotation,
            distance,
            visible: distance >= 0.1,
            bearingDegrees:
                normalizedBearing,
            direction:
                this.getCompassDirection(
                    normalizedBearing
                ),
        };
    }

    private getCompassDirection(
        degrees: number
    ) {
        const directions = [
            "E",
            "NE",
            "N",
            "NW",
            "W",
            "SW",
            "S",
            "SE",
        ];

        const index =
            Math.round(degrees / 45) % directions.length;

        return directions[index];
    }

    updateRemoteCastle(
        socketId: string,
        level: number
    ) {
        const player =
            this.joinedData.players.find(
                p =>
                    p.socketId === socketId
            );

        if (!player)
            return;

        const castle =
            this.castles.get(
                player.slot
            );

        if (!castle)
            return;

        /*
         * The backend tells us the
         * new authoritative level.
         *
         * The frontend only changes
         * the visual representation.
         */
        castle.setLevel(level);
    }

    updateRemotePlayer(
        socketId: string,
        x: number,
        y: number
    ) {
        const remote =
            this.remotePlayers.get(
                socketId
            );

        if (!remote)
            return;

        /*
         * The backend provides the
         * authoritative remote position.
         */
        remote.updatePosition(
            x,
            y
        );
    }

    correctLocalPlayer(x: number, y: number) {
        this.player.placeAt(x, y);
    }

    removeResourceTile(x: number, y: number) {
        this.map.clearTile(
            Math.floor(x),
            Math.floor(y)
        );
    }

    syncInventory(wood: number, iron: number) {
        this.player.inventory.set("wood", wood);
        this.player.inventory.set("iron", iron);
    }

    spawnResourceTile(x: number, y: number, type: HarvestableTile) {
        this.map.setResourceTile(
            Math.floor(x),
            Math.floor(y),
            type
        );
    }
}