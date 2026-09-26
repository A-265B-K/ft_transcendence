import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
	type KeyboardEvent,
} from "react";

type ChatMessage = {
    id: number;
    sender: string;
    text: string;
};

function handleChatKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
): void {
    event.stopPropagation();
}

export function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function loadMessages() {
            try {
                const response = await fetch("/api/messages");

                if (!response.ok) {
                    throw new Error("Failed to load messages");
                }

                const data: ChatMessage[] = await response.json();
                setMessages(data);
            } catch {
                setError("Could not load chat messages.");
            }
        }

        loadMessages();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedMessage = message.trim();

        if (!trimmedMessage || isSending) {
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: trimmedMessage,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const savedMessage: ChatMessage = await response.json();

            setMessages((currentMessages) => [
                ...currentMessages,
                savedMessage,
            ]);

            setMessage("");
        } catch {
            setError("Could not send message.");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="flex h-[500px] w-[min(90vw,_520px)] flex-col rounded-[18px] border border-white/20 bg-[#0a1016] p-4 text-white shadow-2xl">
            <div className="mb-3 text-sm uppercase tracking-[0.16em] text-white/70">
                Chat
            </div>

            <div className="mb-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                {messages.map((currentMessage) => (
                    <div
                        key={currentMessage.id}
                        className="rounded-[12px] bg-white/[0.06] px-3 py-2"
                    >
                        <div className="mb-0.5 text-xs font-semibold text-white/50">
                            {currentMessage.sender}
                        </div>

                        <p className="break-words text-sm text-white/90">
                            {currentMessage.text}
                        </p>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {error && (
                <p className="mb-2 text-sm text-red-400">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleChatKeyDown}
					placeholder="Type a message..."
                    className="min-w-0 flex-1 rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                />

                <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="rounded-[10px] bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isSending ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
}
