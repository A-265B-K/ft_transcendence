import { Inventory } from "../components/Inventory";
import { useEffect, useRef, useState } from "react";
import { Game } from "../game/Game";
import { type CastlePointer } from "./CastlePointer";
import type { JoinedPayload } from "../types/game";
import { connectSocket } from "../socket";

interface GameCanvasProps {
    joinedData: JoinedPayload;
}

export default function GameCanvas({
    joinedData,
}: GameCanvasProps) {
	const gameContainer = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Game | null>(null);
	const [inventory, setInventory] = useState({ wood: 0, iron: 0 });
	const [castlePointer, setCastlePointer] = useState<CastlePointer | null>(null);

	// Initialize game on component mount, cleanup on unmount

	useEffect(() => {
		if (!joinedData)
			return;

		if (!gameContainer.current)
			return;

		console.log("Starting game with:", joinedData);

		const socket = connectSocket();

		const game = new Game();

		gameRef.current = game;

		void game.start(
			gameContainer.current,
			joinedData,
			socket,
		);

		function handlePlayerJoined(
			player: JoinedPayload["players"][number]
		) {
			console.log("Player joined:", player);

			game.addRemotePlayer(player);
			game.addRemoteCastle(player);
		}

		function handlePlayerMove({
			socketId,
			x,
			y
		}: {
			socketId: string;
			x: number;
			y: number;
		}) {
			game.updateRemotePlayer(socketId, x, y);
		}

		socket.on("player_joined", handlePlayerJoined);
		socket.on("player_move", handlePlayerMove);

		const intervalId = window.setInterval(() => {
			const snapshot =
				game.getInventorySnapshot();

			const pointer =
				game.getCastlePointerSnapshot();

			if (snapshot)
				setInventory(snapshot);

			if (pointer)
				setCastlePointer(pointer);

		}, 32);

		return () => {
			socket.off("player_joined", handlePlayerJoined);
			socket.off("player_move", handlePlayerMove);

			window.clearInterval(intervalId);

			gameRef.current = null;
			game.destroy();
		};

	}, [joinedData]);

	return (
		<div className="app-shell">
			<div ref={gameContainer} className="game-canvas-host" />
			{castlePointer && (
				<div className="castle-pointer-hud" aria-label="Castle direction">
					<div className="castle-pointer-hud__title">Castle</div>
					<div
						className="castle-pointer-hud__arrow"
						style={{ transform: `rotate(${castlePointer.rotation}rad)` }}
					>
						➤
					</div>
					<div className="castle-pointer-hud__distance">
						{castlePointer.visible
							? `${castlePointer.direction} · ${castlePointer.bearingDegrees.toFixed(0)}° · ${castlePointer.distance.toFixed(1)} tiles away`
							: "You are here"}
					</div>
				</div>
			)}
			<div className="hud-layer">
				<Inventory counts={inventory} />
			</div>
		</div>
	);
}