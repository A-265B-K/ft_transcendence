

await fastify.register(cors, { origin: '*'});
	CORS (Cross-Origin Resource Sharing) is a browser security policy that blocks requests from different origins. For example, your frontend is at http://localhost:5173 and the backend at http://localhost:3000 — different origins. Without CORS the browser blocks the communication.
		// development
		await fastify.register(cors, { origin: '*' })

		// production
		await fastify.register(cors, { origin: 'https://your-domain.com' })