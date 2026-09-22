import type { WeaponType } from "../state/gameState.js"

export type WeaponAttackStats =
{
    damage : number,
    reach : number, 
    width : number, 
    cooldown : number 
}

export const SWORD_ATTACK : WeaponAttackStats =
{
    damage: 10,
    reach: 2.5,
    width: 2,
    cooldown: 1
}

export const AXE_ATTACK : WeaponAttackStats =
{
    damage: 25,
    reach: 2,
    width: 3,
    cooldown: 2.5
}

export const DAGGER_ATTACK : WeaponAttackStats =
{
    damage: 3,
    reach: 1.5,
    width: 1,
    cooldown: 0.3
}

export const SPEAR_ATTACK : WeaponAttackStats =
{
    damage: 12,
    reach: 4.5,
    width: 1,
    cooldown: 1.5
}


export function getattackstats(weapon : WeaponType)
{
    switch (weapon)
    {
        case "sword":
            return SWORD_ATTACK;
        case "axe":
            return AXE_ATTACK;
        case "dagger":
            return DAGGER_ATTACK;
        case "spear":
            return SPEAR_ATTACK;
        default:
            return undefined;
    }
}