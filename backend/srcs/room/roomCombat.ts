import type { Player } from '../entities/player.js';
import type { Socket } from '../types.js';
import { isvaliddirection } from '../util.js';
import { istargethit, type Direction } from '../combat/Detection.js';
import { getattackstats, type WeaponAttackStats } from '../combat/Weapon.js';
import { PLAYER_RADIUS } from '../constants.js';

/* 
function handlecastledamage() {
    
}
*/

function handlecatapultdamage(players: MapIterator<Player>, player: Player, attackStats: WeaponAttackStats, direction: Direction) {
    for (const catapultowner of players) {
      let catapults = catapultowner.getcatapults();
      for (const catapult of catapults) {
        if (istargethit(player.getPosition(), catapult.getpos(), attackStats, direction, PLAYER_RADIUS))
            catapult.takedamage(attackStats.damage)
      }
    }

}


function handleplayerdamage(players: MapIterator<Player>, player: Player, attackStats: WeaponAttackStats, direction: Direction) {
    for (const target of players) {
        if (target.getUserId() === player.getUserId() || !target.isAlive()) {
            continue;
        }

        if (
            !istargethit(
                player.getPosition(),
                target.getPosition(),
                attackStats,
                direction,
                PLAYER_RADIUS
            )
        ) {
            continue;
        }

        target.takeDamage(attackStats.damage);

        console.log(
            player.getUsername(),
            'hit',
            target.getUsername(),
            'for',
            attackStats.damage,
            'damage'
        );
    }

}


export function handleRoomAttack(
    player: Player,
    players: ReadonlyMap<string, Player>,
    roomId: string,
    socket: Socket,
    data: { direction: unknown }
): boolean {
    if (!player.canattack()) {
        return false;
    }

    const weapon = player.getEquippedWeapon();
    const direction = data.direction;

    if (!weapon || !player.isAlive() || !isvaliddirection(direction)) {
        return false;
    }

    const attackStats = getattackstats(weapon);
    if (!attackStats) {
        return false;
    }

    socket.to(roomId).emit('player_attacked', {
        socketId: player.getSocketId(),
        direction
    });

    handleplayerdamage(players.values(), player, attackStats, direction);
    handlecatapultdamage(players.values(), player, attackStats, direction);
    player.attackNow(player.getEquippedWeapon());
    return true;
}
