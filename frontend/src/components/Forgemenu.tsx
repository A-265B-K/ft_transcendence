import {useState} from "react";
import type { WeaponType } from "../game/entities/weapons/weapon";

const weaponrecipes = {
    dagger: {wood: 15, iron : 15},
	sword: {wood: 30, iron :20},
    spear: {wood: 30, iron : 20},
    axe: {wood: 20, iron : 30},
};

function craftweapon(weapon : WeaponType)
{
   
}

export function Forgemenu() {
    const [open, setOpen] = useState(false);
    
	return (
        <div>
        <div className="absolute bottom-24 right-4 z-50 text-white">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="rounded-lg bg-amber-600 px-3 py-2"
            >
                {open ? "Close forge" : "Open forge"}
            </button>
 
            {open && (
                <section
                    aria-label="Forge"
                    className="mt-2 w-64 rounded-xl bg-slate-900 p-4"
                >
                    <h2 className="mb-3 text-lg font-bold">Forge</h2>
                    <p>Choose a weapon to craft.</p>
                    <div className="mt-3 flex flex-col gap-2">
            {Object.entries(weaponrecipes).map(([weapon, recipe]) => (
                <button
                    key={weapon}
                    type="button"
                    onClick={() => craftweapon(weapon)}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-left hover:bg-slate-600"
                >
                    <span className="font-bold capitalize">{weapon}</span>

                    <span className="block text-sm text-slate-300">
                        {recipe.wood} wood · {recipe.iron} iron
                    </span>
                </button> 
            ))}
        </div>
                </section>
            )}
        </div>
        </div>
	);
}