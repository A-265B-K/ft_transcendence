/**
 * Input System
 *
 * Handles keyboard input and tracks which keys are currently pressed.
 * Provides current input state to the player for movement.
 */

import type { InputState } from '../entities/Player';

/**
 * Input class - manages keyboard input tracking
 */
export class Input {
    // Dictionary tracking which keys are currently pressed
    keys: Record<string, boolean> = {};
    private interactQueued = false;

    /**
     * Handle keydown events - mark key as pressed
     */
    Attack?: () => void;
    Castleranged?: () => void;

    private readonly handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        this.keys[key] = true;

        if (key === 'e') {
            this.interactQueued = true;
        }
        if (key == 'f' && !e.repeat) this.Attack?.();
        if (key == 'r' && !e.repeat) this.Castleranged?.();
    };

    /**
     * Handle keyup events - mark key as released
     */
    private readonly handleKeyUp = (e: KeyboardEvent) => {
        this.keys[e.key.toLowerCase()] = false;
    };

    /**
     * Handle window blur events - clear all keys
     * Prevents stuck keys when window loses focus
     */
    private readonly resetKeys = () => {
        this.keys = {};
    };

    /**
     * Constructor - attach event listeners
     */
    constructor() {
        // Attach event listeners to window
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.resetKeys);
        window.addEventListener('contextmenu', this.resetKeys);
    }

    /**
     * Clean up event listeners
     * Call when destroying the input system
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.resetKeys);
        window.removeEventListener('contextmenu', this.resetKeys);
    }

    /**
     * Get current input state based on WASD keys
     * @returns InputState with direction flags
     */
    get state(): InputState {
        // Map WASD keys to directional input
        return {
            up: this.keys['w'] === true, // W key
            down: this.keys['s'] === true, // S key
            left: this.keys['a'] === true, // A key
            right: this.keys['d'] === true // D key
        };
    }

    consumeInteract() {
        const wasQueued = this.interactQueued;
        this.interactQueued = false;
        return wasQueued;
    }
}
