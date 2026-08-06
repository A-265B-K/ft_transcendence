import { Pool } from 'pg'

const db = new Pool({
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	host: process.env.POSTGRES_HOST ?? 'postgres',
	port: Number(process.env.POSTGRES_PORT ?? 5432),
	database: process.env.POSTGRES_DB,
})

export default db

export async function query(text, params = []) {
	console.log('[db.query] text:', text)
	console.log('[db.query] params:', params)

	const result = await db.query(text, params)

	console.log('[db.query] rowCount:', result.rowCount)
	return result
}

export async function ensureSchema() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS player_inventory (
			user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			iron INTEGER NOT NULL DEFAULT 0,
			wood INTEGER NOT NULL DEFAULT 0,
			castle_level INTEGER NOT NULL DEFAULT 1,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
}
