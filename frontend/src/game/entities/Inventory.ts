import { TileType, type TileType as TileTypeValue } from "../world/TileType";

export type InventoryResource = Exclude<TileTypeValue, typeof TileType.Grass>;

export type InventoryCost = Partial<Record<InventoryResource, number>>;

export class Inventory {
    private readonly resources: Record<InventoryResource, number> = {
        [TileType.Wood]: 0,
        [TileType.Iron]: 0,
    };

    set(
        resource: InventoryResource,
        amount: number,
    ) {
        this.resources[resource] = amount;
    }

    get(resource: InventoryResource) {
        return this.resources[resource];
    }

    snapshot() {
        return { ...this.resources };
    }
}