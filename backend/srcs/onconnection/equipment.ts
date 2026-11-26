import type { ConnectionContext } from './types.js';
import { getCurrentRoom } from './currentRoom.js';

export const registerEquipmentHandlers = (context: ConnectionContext) => {
    const { socket, user } = context;

    socket.on(
        'craftweapon',
        (
            data: unknown,
            reply: (
                result:
                    | {
                          success: true;
                          weapon: string;
                          inventory: { wood: number; iron: number };
                      }
                    | { success: false }
            ) => void
        ) => {
            if (
                typeof data !== 'object' ||
                data === null ||
                !('weapon' in data) ||
                (data.weapon !== 'dagger' &&
                    data.weapon !== 'sword' &&
                    data.weapon !== 'spear' &&
                    data.weapon !== 'axe')
            ) {
                reply({ success: false });
                return;
            }

            const room = getCurrentRoom(context);
            const weapon = data.weapon;

            const res = room?.craftWeapon(user.id, weapon);
            if (!room || !res) {
                reply({ success: false });
                return;
            }
            socket.to(room.getRoomId()).emit('player_weapon_equipped', {
                socketId: room.getPlayerSocketId(user.id),
                weapon: res.weapon
            });
            reply({
                success: true,
                weapon: res.weapon,
                inventory: res.inventory
            });
        }
    );

    socket.on(
        'equiparmor',
        (_data: unknown, reply: (result: { success: boolean }) => void) => {
            if (typeof reply !== 'function') return;

            reply({
                success: getCurrentRoom(context)?.equiparmor(user.id) ?? false
            });
        }
    );
};
