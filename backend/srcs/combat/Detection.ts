import type { WeaponAttackStats } from "./Attackstats.js"
import { PLAYER_RADIUS } from "../constants.js";

type position = 
{
    x : number,
    y : number
}


type Direction = "up" | "down" | "left" | "right";

export function istargethit(attacker: position, target: position, weaponstats: WeaponAttackStats, Direction : Direction) : boolean
{
    const dx = target.x - attacker.x ;
    const dy = target.y - attacker.y ;

    let minX: number;
    let maxX: number;
    let minY: number;
    let maxY: number;

    switch (Direction)
    {
        case "right":
            minX = 0;
            maxX = weaponstats.reach;
            minY = -weaponstats.width / 2;
            maxY = weaponstats.width / 2
            break ;
        case "left":
            minX = -weaponstats.reach;
            maxX = 0;
            minY = -weaponstats.width / 2;
            maxY = weaponstats.width / 2;
            break;
        case "up":
            minX = -weaponstats.width /2;
            maxX = weaponstats.width / 2;
            minY = -weaponstats.reach;
            maxY = 0;
            break ;
        case "down":
            minX = -weaponstats.width / 2;
            maxX = weaponstats.width / 2;
            minY = 0;
            maxY = weaponstats.reach;
            break ;
    }

    const closestX = Math.max(minX, Math.min(dx, maxX));
    const closestY = Math.max(minY, Math.min(dy, maxY));

    const gapX = dx - closestX;
    const gapY = dy - closestY;

    return (Math.hypot(gapX, gapY) <= PLAYER_RADIUS)
}
