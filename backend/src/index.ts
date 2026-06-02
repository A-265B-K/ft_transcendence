import { connectToDatabase } from './db/db-test';
import dotenv from 'dotenv';
import path from 'path';

async function main() {
  console.log('Starting up backend');

  // Imports .env file from the root of the repository
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });

  // Sets up the database, needs error handling for when the database is offline.
  connectToDatabase();
}

main();
