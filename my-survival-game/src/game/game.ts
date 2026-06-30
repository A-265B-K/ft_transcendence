import { Application, Assets, Container } from "pixi.js";
import { Player } from "./entities/Player";
import { Input } from "./systems/Input";
import { GameMap } from "./world/GameMap";
import { Camera } from "./systems/Camera";

export class Game {
    app: Application;

    world!: Container;
    player!: Player;
    input = new Input();

    map!: GameMap;
    camera!: Camera;

    constructor(container: HTMLDivElement) {
        this.app = new Application();
        this.world = new Container();

        this.init(container);
    }

    async init(container: HTMLDivElement) {
        await this.app.init({
            resizeTo: window,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        container.appendChild(this.app.canvas);
        this.app.stage.addChild(this.world);

        const grassTexture = await Assets.load("/src/assets/grass.png");
        const woodTexture = await Assets.load("/src/assets/wood.png");
        const ironTexture = await Assets.load("/src/assets/iron.png");

        this.map = new GameMap(grassTexture, woodTexture, ironTexture);

        this.world.addChild(this.map.container);

        // player
        const playerTexture = await Assets.load("/src/assets/player.png");
        this.player = new Player(playerTexture);
        this.world.addChild(this.player.sprite);

        // camera
        this.camera = new Camera(this.world);

        this.app.ticker.add((ticker) => {
            const deltaSeconds = ticker.deltaMS / 1000;

            // 1. update logic FIRST
            this.player.update(this.input.state, deltaSeconds);

            // 2. update camera SECOND
            this.camera.update(
                this.player,
                this.app.renderer.width,
                this.app.renderer.height,
                deltaSeconds
            );

            // 3. update visible map LAST
            this.map.update(this.player.gridX, this.player.gridY);
        });
    }

    destroy() {
        this.input.destroy();
        this.app.destroy();
    }
}