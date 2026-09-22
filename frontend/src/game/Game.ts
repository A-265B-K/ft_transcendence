import { Application, Ticker } from "pixi.js";
import { loadGameTextures } from "./assets/loadGameTextures";
import { GameScene } from "./scenes/GameScene";
import { Input } from "./systems/Input";
import { type JoinedPayload } from "../types/game";
import type { Socket } from "socket.io-client";
import type { HarvestableTile } from "./world/tileResource";

export class Game {
    readonly app: Application;
    readonly input = new Input();

    private scene?: GameScene;

    private readonly handleTick = (ticker: Ticker) => {
        if (!this.scene) 
            return;

        const deltaSeconds = ticker.deltaMS / 1000;
        this.scene.player.weapon?.update(deltaSeconds);
        for ( const enemy of this.scene.remotePlayers.values())
            enemy.weapon?.update(deltaSeconds);
        this.scene.update(
            this.input.state,
            this.app.renderer.width,
            this.app.renderer.height,
            deltaSeconds,
        );

    };

    constructor() {
        this.app = new Application();
        this.input.Attack = () => {
        this.scene?.requestattack();
};
    }

    addRemotePlayer(
        player: JoinedPayload["players"][number]
    ) {
        this.scene?.addRemotePlayer(player);
    }

    addRemoteCastle(
        player: JoinedPayload["players"][number]
    ) {
        this.scene?.addRemoteCastle(player);
    }

    removeRemoteCastle(
        player: JoinedPayload["players"][number]
    ) {
        this.scene?.removeRemoteCastle(player);
    }

    removeRemotePlayer(
        player: JoinedPayload["players"][number]
    ) {
        this.scene?.removeRemotePlayer(player);
    }

    updateRemotePlayer(
        socketId: string,
        x: number,
        y: number,
        moving: boolean,
    ) {
        this.scene?.updateRemotePlayer(socketId, x, y, moving);
    }

    RemotePlayerattack(socketId: string, direction: "up" | "down" | "left" | "right"): void
    {
        this.scene?.RemotePlayerattack(socketId, direction);
    }

    correctLocalPlayer(x: number, y: number) {
        this.scene?.correctLocalPlayer(x, y);
    }

    removeResourceTile(x: number, y: number) {
        this.scene?.removeResourceTile(x, y);
    }

    syncInventory(wood: number, iron: number) {
        this.scene?.syncInventory(wood, iron);
    }

    spawnResourceTile(x: number, y: number, type: HarvestableTile) {
        this.scene?.spawnResourceTile(x, y, type);
    }

    updateRemoteCastle(socketId: string, level: number) {
        this.scene?.updateRemoteCastle(socketId, level);
    }

    async start(container: HTMLDivElement, joinedData: JoinedPayload, socket: Socket) {

        await this.app.init({
            resizeTo: window,           // Automatically resize canvas with window
            autoDensity: true,          // Handle high-DPI displays
            resolution: window.devicePixelRatio || 1, // Device pixel ratio for crisp rendering
        });

        container.appendChild(this.app.canvas);

        const textures = await loadGameTextures();

        this.scene = new GameScene(
            textures,
            joinedData,
            socket,
        );
        
        this.app.stage.addChild(this.scene.world);
        this.app.ticker.add(this.handleTick);
    }

    destroy() {
        this.app.ticker.remove(this.handleTick);
        this.input.destroy();
        this.app.destroy();
    }

    getInventorySnapshot() {
        return this.scene?.player.inventory.snapshot() ?? null;
    }

    getCastlePointerSnapshot() {
        return this.scene?.getCastlePointer() ?? null;
    }

}