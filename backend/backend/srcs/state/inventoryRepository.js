import { query } from "../security/auth/db.js";
import { PLAYER_DEFAULT_IRON, PLAYER_DEFAULT_WOOD, PLAYER_DEFAULT_CASTLE_LEVEL } from "../constants.js";

const toInventory = (row) => ({
	iron: row.iron,
	wood: row.wood,
	castleLevel: row.castle_level
});

export async function getOrCreateInventory(userId) {

	const existing = await query(
		`
		SELECT iron, wood, castle_level
		FROM player_inventory
		WHERE user_id = $1
		`,
		[
			userId
		]
	);

	if (existing.rowCount > 0) {
		return { inventory: toInventory(existing.rows[0]), isNewPlayer: false };
	}

	const created = await query(
		`
		INSERT INTO player_inventory
		(
			user_id,
			iron,
			wood,
			castle_level
		)
		VALUES
		(
			$1,
			$2,
			$3,
			$4
		)
		RETURNING iron, wood, castle_level
		`,
		[
			userId,
			PLAYER_DEFAULT_IRON,
			PLAYER_DEFAULT_WOOD,
			PLAYER_DEFAULT_CASTLE_LEVEL
		]
	);

	return { inventory: toInventory(created.rows[0]), isNewPlayer: true };
}

export async function saveInventory(userId, inventory) {

	await query(
		`
		UPDATE player_inventory
		SET
			iron = $2,
			wood = $3,
			castle_level = $4,
			updated_at = NOW()
		WHERE user_id = $1
		`,
		[
			userId,
			inventory.iron,
			inventory.wood,
			inventory.castleLevel
		]
	);
}
