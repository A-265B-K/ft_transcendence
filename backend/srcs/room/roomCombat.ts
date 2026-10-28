import type { Player } from '../entities/player.js';
import type { Socket } from '../types.js';
import { isvaliddirection } from '../util.js';
import { istargethit } from '../combat/Detection.js';
import { getattackstats } from '../combat/Weapon.js';

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

    for (const target of players.values()) {
        if (target.getUserId() === player.getUserId() || !target.isAlive()) {
            continue;
        }

        if (
            !istargethit(
                player.getPosition(),
                target.getPosition(),
                attackStats,
                direction
            )
        ) {
            continue;
        }

        const isDead = target.takeDamage(attackStats.damage);

        console.log(
            player.getUsername(),
            'hit',
            target.getUsername(),
            'for',
            attackStats.damage,
            'damage'
        );

        if (isDead) {
            socket.nsp.to(target.getSocketId()).emit('player_died');
            socket.nsp.to(roomId).emit('player_died', {
                player: target
            });
        }
    }
    player.attackNow(player.getEquippedWeapon());
    return true;
}
