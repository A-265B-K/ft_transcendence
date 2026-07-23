type InventoryCounts = {
    wood: number;
    iron: number;
};

type InventoryProps = {
    counts: InventoryCounts;
};

export function Inventory({ counts }: InventoryProps) {
    return (
        <div className="inventory-panel" aria-label="Player inventory">
            <div className="inventory-panel__title">Inventory</div>
            <div className="inventory-panel__items">
                <div className="inventory-panel__item">
                    <span className="inventory-panel__label inventory-panel__label--wood">Wood</span>
                    <span className="inventory-panel__value">{counts.wood}</span>
                </div>
                <div className="inventory-panel__item">
                    <span className="inventory-panel__label inventory-panel__label--iron">Iron</span>
                    <span className="inventory-panel__value">{counts.iron}</span>
                </div>
            </div>
        </div>
    );
}