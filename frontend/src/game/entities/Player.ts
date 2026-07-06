import { Sprite, Texture } from "pixi.js";
import { MAP_SIZE } from "../config/constants";
import { isoX, isoY } from "../world/iso";


export type InputState = {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
};

/**
 * Player class - manages player character state and behavior
 */
export class Player {
    // Pixi.js sprite for rendering
    sprite: Sprite;
    
    // Player inventory tracking collected resources
    inventory = {
        wood: 0,
        iron: 0,
    }
    
    // Grid position (world coordinates)
    gridX = 100;
    gridY = 100;

    // Movement speed (tiles per second)
    speed = 15;

    /**
     * Constructor - creates a player sprite
     * @param texture - Pixi.js texture for the player sprite
     */
    constructor(texture: Texture) {
        // Create sprite with anchor at bottom-center (for proper isometric depth)
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 1);  // Center horizontally, bottom vertically
        this.sprite.scale.set(0.5);      // Scale down sprite size
    }

    /**
     * Update player position based on input and time delta
     * @param input - Current input state from keyboard
     * @param deltaSeconds - Time elapsed since last frame (seconds)
     */
    update(input: InputState, deltaSeconds: number) {
        // Calculate movement direction from input
        let moveX = 0;
        let moveY = 0;

        if (input.up) moveY -= 1;
        if (input.down) moveY += 1;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;

        // Calculate movement magnitude to normalize diagonal movement
        const magnitude = Math.hypot(moveX, moveY);

        // Apply time-based movement (frame-independent)
        if (magnitude > 0) {
            const step = this.speed * deltaSeconds;  // Distance to move this frame
            this.gridX += (moveX / magnitude) * step; // Normalize and apply
            this.gridY += (moveY / magnitude) * step;
        }

        // Clamp player position to map bounds
        this.gridX = Math.max(0, Math.min(MAP_SIZE - 1, this.gridX));
        this.gridY = Math.max(0, Math.min(MAP_SIZE - 1, this.gridY));

        // Update sprite position using isometric projection
        this.sprite.x = isoX(this.gridX, this.gridY);
        this.sprite.y = isoY(this.gridX, this.gridY);
    }
}