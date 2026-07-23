import { Container, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { MAP_SIZE } from "../config/constants";
import { isoX, isoY } from "../world/iso";
import { type InventoryCost } from "./Inventory";

const CASTLE_UPGRADE_COSTS: Record<number, InventoryCost> = {
    2: { wood: 1, iron: 5 },
    3: { wood: 20, iron: 10},
    4: { wood: 30, iron: 15},
};

export class Castle {
    readonly container: Container;
    readonly sprite: Sprite;
    readonly levelLabel: Text;

    gridX = 0;
    gridY = 0;
    level = 1;

    constructor(texture: Texture) {
        this.container = new Container();
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 0.6);
        this.sprite.scale.set(0.84, 0.60);


        this.levelLabel = new Text({
            text: "Lv. 1",
            style: new TextStyle({
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 16,
                fontWeight: "700",
                fill: "#f4f7fb",
                stroke: { color: "#081016", width: 4 },
                align: "center",
            }),
        });
        this.levelLabel.anchor.set(0.5, 2);
        this.levelLabel.y = -76;

        this.container.addChild(this.sprite);
        this.container.addChild(this.levelLabel);
        this.refreshLabel();
    }

    placeAt(gridX: number, gridY: number) {
        this.gridX = Math.max(0, Math.min(MAP_SIZE - 2, gridX));
        this.gridY = Math.max(0, Math.min(MAP_SIZE - 2, gridY));
        this.syncPosition();
    }

    canUpgrade(targetLevel: number) {
        const cost = CASTLE_UPGRADE_COSTS[targetLevel];

        if (!cost) {
            return false;
        }

        return true;
    }

    getUpgradeCost(targetLevel = this.level + 1) {
        return CASTLE_UPGRADE_COSTS[targetLevel] ?? null;
    }

    upgrade() {
        const nextLevel = this.level + 1;

        if (!this.getUpgradeCost(nextLevel)) {
            return false;
        }

        this.level = nextLevel;
        this.refreshLabel();

        return true;
    }

    private refreshLabel() {
        const nextLevel = this.level + 1;
        const cost = this.getUpgradeCost(nextLevel);

        if (!cost) {
            this.levelLabel.text = `Lv. ${this.level}\nMax level`;
            return;
        }

        const costText = Object.entries(cost)
            .map(([resource, amount]) => `${amount} ${resource}`)
            .join(" / ");

        this.levelLabel.text = `Lv. ${this.level}\nNeed: ${costText}`;
    }

    private syncPosition() {
        this.container.x = isoX(this.gridX, this.gridY);
        this.container.y = isoY(this.gridX, this.gridY);
        this.container.zIndex = this.gridX + this.gridY;
    }
}