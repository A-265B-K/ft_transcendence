import { useEffect, useState } from "react";
import { socket } from "../socket";
import { type MenuProps } from "./MenuProps";

export default function Menu({ onMenu }: MenuProps) {
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
                maxWidth: "400px",
                margin: "50px auto",
                textAlign: "center",
            }}
        >
            <h2>Enter your name</h2>

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
                />

                <button type="submit">
                    Start Game
                </button>
            </form>
        </div>
    );
}