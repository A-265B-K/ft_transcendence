import { useState } from 'react';
import type { WeaponType } from '../game/entities/weapons/weapon';
import { getSocket } from '../socket';
import daggerIcon from '../assets/weapons/dagger/dagger1.png';
import swordIcon from '../assets/weapons/sword/sword1.png';
import spearIcon from '../assets/weapons/spear/spear1.png';
import axeIcon from '../assets/weapons/axe/axe1.png';

const weaponrecipes = {
    dagger: { wood: 15, iron: 15, icon: daggerIcon },
    sword: { wood: 30, iron: 20, icon: swordIcon },
    spear: { wood: 30, iron: 20, icon: spearIcon },
    axe: { wood: 20, iron: 30, icon: axeIcon }
};

const castleUpgradeRecipes: Partial<
    Record<number, { wood: number; iron: number }>
> = {
    2: { wood: 50, iron: 30 },
    3: { wood: 100, iron: 60 },
    4: { wood: 180, iron: 120 }
};

export function Forgemenu({
    onEquip,
    castleLevel,
    inventory,
    onUpgrade,
    upgrading
}: {
    onEquip: (
        weapon: WeaponType,
        inventory: { wood: number; iron: number }
    ) => void;
    castleLevel: number;
    inventory: { wood: number; iron: number };
    onUpgrade: () => void;
    upgrading: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [equippingArmor, setEquippingArmor] = useState(false);
    const upgradeCost = castleUpgradeRecipes[castleLevel + 1];
    const atMaxLevel = castleLevel >= 4;
    const canAffordUpgrade =
        !!upgradeCost &&
        inventory.wood >= upgradeCost.wood &&
        inventory.iron >= upgradeCost.iron;

    function craftweapon(weapon: WeaponType) {
        type craftresult =
            | {
                  success: true;
                  weapon: WeaponType;
                  inventory: { wood: number; iron: number };
              }
            | { success: false };
        const socket = getSocket();
        if (!socket?.connected) return;
        socket.emit('craftweapon', { weapon }, (result: craftresult) => {
            if (result.success) {
                onEquip(result.weapon, result.inventory);
            } else {
                console.log('crafting error');
            }
        });
    }
    function equiparmor() {
        if (equippingArmor || upgrading || castleLevel < 3) return;

        const socket = getSocket();
        if (!socket?.connected) return;

        setEquippingArmor(true);
        socket.timeout(5000).emit('equiparmor', {}, () => {
            setEquippingArmor(false);
        });
    }

    return (
        <div>
            <div className="absolute bottom-24 right-4 z-50 text-white">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    className="rounded-lg bg-amber-600 px-3 py-2"
                >
                    {open ? 'Close forge' : 'Open forge'}
                </button>

                {open && (
                    <section
                        aria-label="Forge"
                        className="mt-2 w-64 rounded-xl bg-slate-900 p-4"
                    >
                        <h2 className="mb-3 text-lg font-bold">Forge</h2>
                        <p>Choose a weapon to craft.</p>
                        <div className="mt-3 flex flex-col gap-2">
                            {Object.entries(weaponrecipes).map(
                                ([weapon, recipe]) => (
                                    <button
                                        key={weapon}
                                        type="button"
                                        onClick={() =>
                                            craftweapon(
                                                weapon as keyof typeof weaponrecipes
                                            )
                                        }
                                        disabled={
                                            inventory.wood < recipe.wood ||
                                            inventory.iron < recipe.iron
                                        }
                                        className="flex items-center gap-3 rounded-lg bg-slate-700 px-3 py-2 text-left hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <img
                                            src={recipe.icon}
                                            alt=""
                                            className="h-10 w-10 shrink-0 object-contain"
                                        />
                                        <span>
                                            <span className="block font-bold capitalize">
                                                {weapon}
                                            </span>
                                            <span className="block text-sm text-slate-300">
                                                {recipe.wood} wood ·{' '}
                                                {recipe.iron} iron
                                            </span>
                                        </span>
                                    </button>
                                )
                            )}
                        </div>
                        <section
                            aria-label="Armor"
                            className="mt-4 border-t border-slate-700 pt-4"
                        >
                            <button
                                type="button"
                                onClick={equiparmor}
                                disabled={
                                    castleLevel < 3 ||
                                    equippingArmor ||
                                    upgrading
                                }
                                aria-busy={equippingArmor}
                                className="w-full rounded-lg bg-slate-700 px-3 py-2 text-left hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="block font-bold">
                                    {equippingArmor
                                        ? 'Equipping armor…'
                                        : 'Equip armor'}
                                </span>
                                <span className="block text-sm text-slate-300">
                                    {castleLevel < 3
                                        ? 'Requires castle level 3'
                                        : '20% damage reduction for 20 seconds'}
                                </span>
                            </button>
                        </section>
                        <section
                            aria-label="Castle"
                            className="mt-4 border-t border-slate-700 pt-4"
                        >
                            <button
                                type="button"
                                onClick={onUpgrade}
                                disabled={
                                    upgrading || atMaxLevel || !canAffordUpgrade
                                }
                                aria-busy={upgrading}
                                className="w-full rounded-lg bg-amber-600 px-3 py-2 text-left font-bold hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="block">
                                    {upgrading
                                        ? 'Upgrading…'
                                        : atMaxLevel
                                          ? 'Max level'
                                          : 'Upgrade castle'}
                                </span>
                                {upgradeCost && (
                                    <span className="block text-sm font-normal">
                                        {upgradeCost.wood} wood ·{' '}
                                        {upgradeCost.iron} iron
                                    </span>
                                )}
                            </button>
                        </section>
                    </section>
                )}
            </div>
        </div>
    );
}
