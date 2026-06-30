import type { InputState } from "../entities/Player";

export class Input {
    keys: Record<string, boolean> = {};

    private readonly handleKeyDown = (e: KeyboardEvent) => {
        this.keys[e.key.toLowerCase()] = true;
    };

    private readonly handleKeyUp = (e: KeyboardEvent) => {
        this.keys[e.key.toLowerCase()] = false;
    };

    private readonly handleBlur = () => {
        this.keys = {};
    };

    constructor() {
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        window.addEventListener("blur", this.handleBlur);
    }

    destroy() {
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        window.removeEventListener("blur", this.handleBlur);
    }

    get state(): InputState {
        return {
            up: this.keys["w"] === true,
            down: this.keys["s"] === true,
            left: this.keys["a"] === true,
            right: this.keys["d"] === true,
        };
    }
}