import { Pool } from "pg";
import { getPostgresCredentials } from "../vault/client.js";

const credentials = await getPostgresCredentials();

const db = new Pool({
        user: credentials.username,
        password: credentials.password,
        host: process.env.POSTGRES_HOST ?? "postgres",
        port: Number(process.env.POSTGRES_PORT ?? 5432),
        database: credentials.database,
});

export default db;

export async function query(text: string, params: unknown[] = []) {
        const result = await db.query(text, params);
        return result;
}
