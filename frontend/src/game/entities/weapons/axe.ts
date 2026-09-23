import { Weapon } from "./weapon";

export class axe extends Weapon {
    constructor() {
        super("axe");
    }
    private attackangle = 0;

    attack(direction: "up" | "down" | "left" | "right"): void
    {
        const directions = 
        {
            up:    { x:  2, y: -1 },
            down:  { x: -2, y:  1 },
            left:  { x: -2, y: -1 },
            right: { x:  2, y:  1 },
        };

    const { x, y } = directions[direction];
    this.attackangle = Math.atan2(x, -y);

    if (direction === "down" && this.attackangle < 0)
        this.attackangle += Math.PI * 2;
    else if (direction === "up")
        this.attackangle = -Math.PI / 3;

    this.attacking = true;
    this.attacktime = 0;
    }
    update(deltaSeconds: number): void
    {
        if (!this.attacking)
            return;

        this.attacktime += deltaSeconds;
        let progress = Math.min(this.attacktime / 0.6, 1);
        this.sprite.rotation = Math.sin(progress * Math.PI) * this.attackangle;;

        if (progress === 1)
        {
            this.sprite.rotation = 0;
            this.attacking = false;
        }
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