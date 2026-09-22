import { getattackstats} from "./Attackstats.js"
import { istargethit } from "./Detection.js"
import type { Player, Room } from "../state/gameState.js"
import type { Socket, SocketUser } from "../types.js"

function isvaliddirection(direction : unknown)
{
    return (direction === "up"	 || direction === "down"
                || direction === "left" || direction === "right")
}

export function handleattack(
    players: Record<string, Player>,
    user: SocketUser,
    data: { direction: unknown },
    currentRoomId: string | null,
    rooms: Record<string, Room>,
    socket: Socket
): void
{
    const player = players[user.id]
        if (player && player.equippedweapon && player.hp > 0)
        {
            const direction = data.direction
            if (isvaliddirection(direction) && currentRoomId)
            {
                const room = rooms[currentRoomId]
                if (room)
                {
                    const stats = getattackstats(player.equippedweapon);
                    if (stats)
                    {
                        for (const target of room.players)
                        {
                            if (target.userId !== player.userId && target.hp > 0)
                            {
                                if (istargethit(player, target, stats, direction))
                                {
                                    target.hp = Math.max(0, target.hp - stats.damage)
                                    socket.nsp.to(target.socketId).emit("player_hp", {
                                        socketId: target.socketId,
                                        hp: target.hp,
                                    });
                                    console.log(player.username, "hit", target.username, "for", stats.damage, "damage")
                                }
                            }
                        }
                    }
                }
            }
        }
}
