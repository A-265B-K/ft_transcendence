import { TileType, type TileType as TileTypeValue } from "../world/TileType";

export type InventoryResource = Exclude<TileTypeValue, typeof TileType.Grass>;

export type InventoryCost = Partial<Record<InventoryResource, number>>;

export class Inventory {
    private readonly resources: Record<InventoryResource, number> = {
        [TileType.Wood]: 0,
        [TileType.Iron]: 0,
    };

    add(resource: InventoryResource, amount = 1) {
        this.resources[resource] += amount;
    }

    get(resource: InventoryResource) {
        return this.resources[resource];
    }

    canAfford(cost: InventoryCost) {
        return (Object.entries(cost) as Array<[InventoryResource, number]>).every(
            ([resource, amount]) => this.get(resource) >= amount,
        );
    }

    spend(cost: InventoryCost) {
        if (!this.canAfford(cost)) {
            return false;
        }

        for (const [resource, amount] of Object.entries(cost) as Array<[InventoryResource, number]>) {
            this.resources[resource] -= amount;
        }

        return true;
    }

    snapshot() {
        return { ...this.resources };
    }
}