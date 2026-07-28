/* 1. Create the Fastify server
	Initializes the HTTP framework with base configuration (logging, etc).
2. Define basic HTTP routes
	Only the essentials for Sprint 1 — a health check to confirm the server is alive.
3. Start the server
	Listen on a port and connect to the database.
*/

import Fastify  from 'fastify'
import staticFiles from '@fastify/static'
import { Server } from 'socket.io'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import onConnection from './onConnection.js'

const fastify = Fastify()
const io = new Server(fastify.server)

const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(staticFiles, { root: join(__dirname, 'public')})
fastify.get('/ping', () => ({ok: true}))

io.on('connection', onConnection)

await fastify.listen({ port: 3000, host: '0.0.0.0' })
console.log("server running on port 3000")
