import { useEffect, useState } from "react";
import { socket } from "../socket";
import { type MenuProps } from "./MenuProps";

export default function Menu({ onMenu, onCreateAccount }: MenuProps) {
    const [name, setName] = useState("");

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (name.trim() === "")
            return;

        socket.emit("join", {
            id: crypto.randomUUID(),
            username: name,
        });
    }

    useEffect(() => {
        function handleJoined(data: {
            roomId: string;
            player: {
                id: string;
                username: string;
            };
        }) {
            console.log("Joined room:", data.roomId);
            console.log("Player:", data.player);

            onMenu(data.player.username);
        }

        socket.on("joined", handleJoined);

        return () => {
            socket.off("joined", handleJoined);
        };
    }, [onMenu]);

    return (
        <div
            className="Menu-container"
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: "24px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "28px",
                    borderRadius: "24px",
                    background: "rgba(8, 16, 22, 0.78)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                    color: "#f4f7fb",
                    backdropFilter: "blur(14px)",
                    textAlign: "left",
                }}
            >
            <h2 style={{ marginTop: 0, marginBottom: "8px" }}>Enter your name</h2>
            <p style={{ marginTop: 0, marginBottom: "20px", color: "rgba(244,247,251,0.7)" }}>
                Join the game or create an account for the future auth flow.
            </p>

            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#f4f7fb",
                    }}
                />

                <button type="submit">
                    Start Game
                </button>
            </form>

            <button
                type="button"
                onClick={onCreateAccount}
                style={{
                    marginTop: "14px",
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "transparent",
                    color: "#f4f7fb",
                    cursor: "pointer",
                }}
            >
                Create account
            </button>
            </div>
        </div>
    );
}