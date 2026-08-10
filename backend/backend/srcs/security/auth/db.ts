import { Pool } from "pg";

const db = new Pool({
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	host: process.env.POSTGRES_HOST ?? 'postgres',
	port: Number(process.env.POSTGRES_PORT ?? 5432),
	database: process.env.POSTGRES_DB,
})

export default db

export async function query(text: string, params: unknown[] = []) {
	console.log('[db.query] text:', text)
	console.log('[db.query] params:', params)

	const result = await db.query(text, params)

	console.log('[db.query] rowCount:', result.rowCount)
	return result
}
