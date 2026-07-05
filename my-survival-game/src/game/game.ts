/**
 * Main Game Class
 * 
 * Orchestrates the entire game loop and initialization.
 * Manages the Pixi.js Application, world container, and all game systems.
 * Handles asset loading, entity creation, and the update loop.
 */

import { Application, Assets, Container } from "pixi.js";
import { Player } from "./entities/Player";
import { Input } from "./systems/Input";
import { GameMap } from "./world/GameMap";
import { Camera } from "./systems/Camera";

/**
 * Main game class that coordinates all game systems.
 * Responsible for:
 * - Initializing the Pixi.js renderer
 * - Loading game assets
 * - Creating and managing game entities
 * - Running the game update loop
 */
export class Game {
    // Pixi.js Application instance (handles rendering)
    app: Application;

    // Root container for all game objects
    world!: Container;
    
    // Player entity instance
    player!: Player;
    
    // Input system for handling keyboard input
    input = new Input();

    // Game map with procedurally generated tiles
    map!: GameMap;
    
    // Camera system that follows the player
    camera!: Camera;

    /**
     * Constructor - initializes the Pixi.js application and world container
     * @param container - HTML div element where the game canvas will be appended
     */
    constructor(container: HTMLDivElement) {
        this.app = new Application();
        this.world = new Container();

        this.init(container);
    }

    /**
     * Async initialization of the game
     * - Sets up Pixi.js renderer
     * - Loads all game assets
     * - Creates game entities and systems
     * - Starts the game loop
     * @param container - HTML div element to append canvas to
     */
    async init(container: HTMLDivElement) {
        // Initialize Pixi.js Application with responsive canvas
        await this.app.init({
            resizeTo: window,           // Automatically resize canvas with window
            autoDensity: true,          // Handle high-DPI displays
            resolution: window.devicePixelRatio || 1, // Device pixel ratio for crisp rendering
        });

        // Append the canvas to the DOM
        container.appendChild(this.app.canvas);
        // Add world container to the stage (main rendering root)
        this.app.stage.addChild(this.world);

        // Load terrain tile textures
        const grassTexture = await Assets.load("/src/assets/grass.png");
        const woodTexture = await Assets.load("/src/assets/wood.png");
        const ironTexture = await Assets.load("/src/assets/iron.png");

        // Create and initialize the game map with textures
        this.map = new GameMap(grassTexture, woodTexture, ironTexture);
        this.world.addChild(this.map.container);

        // Load and create the player entity
        const playerTexture = await Assets.load("/src/assets/player.png");
        this.player = new Player(playerTexture);
        this.world.addChild(this.player.sprite);

        // Create the camera system (follows player)
        this.camera = new Camera(this.world);

        // Start the main game loop using Pixi's ticker
        this.app.ticker.add((ticker) => {
            // Calculate delta time in seconds for frame-independent movement
            const deltaSeconds = ticker.deltaMS / 1000;

            // Update order is critical for isometric rendering:
            // 1. Player movement based on input
            this.player.update(this.input.state, deltaSeconds);

            // 2. Camera follows player with smooth interpolation
            this.camera.update(
                this.player,
                this.app.renderer.width,
                this.app.renderer.height,
                deltaSeconds
            );

            // 3. Update visible tiles around player (view frustum culling)
            this.map.update(this.player.gridX, this.player.gridY);
        });
    }

    /**
     * Clean up resources and event listeners
     * Called when the game component is unmounted
     */
    destroy() {
        this.input.destroy();
        this.app.destroy();
    }
}