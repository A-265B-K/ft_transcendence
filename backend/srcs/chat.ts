import type { FastifyInstance } from "fastify";

type ChatMessage = {
    id: number;
    sender: string;
    text: string;
    createdAt: string;
};

const messages: ChatMessage[] = [
];

type CreateMessageBody = {
    text?: string;
};

export async function chatRoutes(
    fastify: FastifyInstance,
): Promise<void> {
    fastify.get("/api/messages", async () => {
        return messages;
    });

    fastify.post<{ Body: CreateMessageBody }>(
        "/api/messages",
        async (request, reply) => {
            const text = request.body.text?.trim();

            if (!text) {
                return reply.status(400).send({
                    error: "Message text is required.",
                });
            }

            const newMessage: ChatMessage = {
                id: Date.now(),
                sender: "You",
                text,
                createdAt: new Date().toISOString(),
            };

            messages.push(newMessage);

            return reply.status(201).send(newMessage);
        },
    );
}
