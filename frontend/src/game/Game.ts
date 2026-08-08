import { Application, Ticker } from "pixi.js";
import { loadGameTextures } from "./assets/loadGameTextures";
import { GameScene } from "./scenes/GameScene";
import { Input } from "./systems/Input";
import { type JoinedPayload } from "../types/game";

export class Game {
    readonly app: Application;
    readonly input = new Input();

    private scene?: GameScene;
    private readonly handleTick = (ticker: Ticker) => {
        if (!this.scene) return;

        const deltaSeconds = ticker.deltaMS / 1000;

        this.scene.update(
            this.input.state,
            this.app.renderer.width,
            this.app.renderer.height,
            deltaSeconds,
        );
    };

    constructor() {
        this.app = new Application();
    }

    addRemotePlayer(
        player: JoinedPayload["players"][number]
    ) {
        this.scene?.addRemotePlayer(player);
    }

    updateRemotePlayer(
        userID: string,
        x: number,
        y: number
    ) {
        this.scene?.updateRemotePlayer(userID, x, y);
    }

    async start(container: HTMLDivElement, joinedData: JoinedPayload) {
        await this.app.init({
            resizeTo: window,           // Automatically resize canvas with window
            autoDensity: true,          // Handle high-DPI displays
            resolution: window.devicePixelRatio || 1, // Device pixel ratio for crisp rendering
        });

        container.appendChild(this.app.canvas);

        const textures = await loadGameTextures();

        this.scene = new GameScene(
            textures,
            joinedData
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