import type { ConnectionContext } from './types.js';

export const registerEquipmentHandlers = (context: ConnectionContext) => {
    const { socket, user, roomManager } = context;

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
                !context.currentRoomId ||
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

            const room = roomManager.getRoomById(context.currentRoomId);
            const weapon = data.weapon;

            const res = room?.craftWeapon(user.id, weapon);
            if (!res) {
                reply({ success: false });
                return;
            }
            socket.to(context.currentRoomId).emit('player_weapon_equipped', {
                socketId: socket.id,
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

            const room = context.currentRoomId
                ? roomManager.getRoomById(context.currentRoomId)
                : undefined;

            reply({ success: room?.equiparmor(user.id) ?? false });
        }
    );
};
