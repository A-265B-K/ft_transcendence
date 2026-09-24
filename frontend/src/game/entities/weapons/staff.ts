/* import { Weapon } from "./weapon";

export class staff extends Weapon {
    constructor() {
        super("staff");
    }
    private attackangle = 0;

    attack(direction: "up" | "down" | "left" | "right"): void
    {
    }
    update(deltaSeconds: number): void
    {
    }
    updateweaponpos(frame: number, direction : "up" | "down" | "left" | "right")
    {
            if (direction == "up" || direction == "left")
                this.makeinvisible();
            else
                this.makevisible();
            switch (direction)
            {
                case "down":
                    this.setframe(0);
                    this.setPosition(frame == 0 ? -46 : -47, frame == 0 ? -97 : -92);
                    break ;
                case "up":
                    this.setframe(1);
                    this.setPosition(40, frame == 0 ? -88 : -82);
                    break ;
                case "left":
                    this.setframe(2);
                    this.setPosition(frame === 0 ? 8 : 18, -72);
                    this.makeinvisible();
                    break ;
                case "right":
                    this.setframe(3);
                    this.setPosition(frame == 0 ? -8 : -18, -72);
                    break ;
        };
    }
}
 */