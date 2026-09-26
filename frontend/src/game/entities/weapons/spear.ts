import { Weapon } from "./weapon";

export class spear extends Weapon {
  constructor() {
    super("spear");
  }
  private startx = 0;
  private starty = 0;
  private stabx = 0;
  private staby = 0;
  attack(direction: "up" | "down" | "left" | "right"): void {
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    this.startx = this.sprite.x;
    this.starty = this.sprite.y;
    this.stabx = directions[direction].x;
    this.staby = directions[direction].y;

    this.sprite.y = -84;
    this.attacking = true;

    this.sprite.rotation = Math.atan2(this.stabx, -this.staby);
  }

  update(deltaSeconds: number): void {
    if (!this.attacking) return;
    const stabdistance = 40;
    const progress = Math.min(this.attacktime / 0.45, 1);
    this.attacktime += deltaSeconds;
    const distance = Math.sin(progress * Math.PI) * stabdistance;
    this.sprite.x = this.startx + this.stabx * distance;
    this.sprite.y = this.starty + this.staby * distance;

    if (progress == 1) {
      this.attacking = false;
      this.attacktime = 0;
      this.sprite.rotation = 0;
      this.setPosition(this.startx, this.starty);
    }
  }
  updateweaponpos(frame: number, direction: "up" | "down" | "left" | "right") {
    if (direction == "up" || direction == "left") this.makeinvisible();
    else this.makevisible();
    switch (direction) {
      case "down":
        this.setframe(0);
        this.setPosition(frame == 0 ? -46 : -47, frame == 0 ? -97 : -92);
        break;
      case "up":
        this.setframe(1);
        this.setPosition(40, frame == 0 ? -88 : -82);
        break;
      case "left":
        this.setframe(2);
        this.setPosition(frame === 0 ? 8 : 18, -72);
        this.makeinvisible();
        break;
      case "right":
        this.setframe(3);
        this.setPosition(frame == 0 ? -8 : -18, -72);
        break;
    }
  }
}
