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

	const [inventory, setInventory] = useState({
		wood: 0,
		iron: 0,
	});

	const [castlePointer, setCastlePointer] =
		useState<CastlePointer | null>(null);

	useEffect(() => {
		if (!joinedData || !gameContainer.current)
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
			player: JoinedPayload["players"][number],
		) {
			console.log("Player joined:", player);

			game.addRemotePlayer(player);
			game.addRemoteCastle(player);
		}

		function handlePlayerMove({
			socketId,
			x,
			y,
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
			const snapshot = game.getInventorySnapshot();
			const pointer = game.getCastlePointerSnapshot();

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
		<div className="relative h-screen w-screen overflow-hidden">
			<div
				ref={gameContainer}
				className="h-full w-full"
			/>

			{castlePointer && (
				<div
					className="pointer-events-none absolute right-[18px] top-[18px] grid min-w-[140px] justify-items-center gap-1 rounded-[18px] border border-white/15 bg-[#0a1016]/75 px-4 py-3.5 text-[#f4f7fb] shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl"
					aria-label="Castle direction"
				>
					<div className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">
						Castle
					</div>

					<div
						className="origin-center text-[30px] font-black leading-none text-[#ffcf5c] drop-shadow-[0_2px_12px_rgba(255,207,92,0.5)]"
						style={{
							transform: `rotate(${castlePointer.rotation}rad)`,
						}}
					>
						➤
					</div>

					<div className="text-[13px] font-semibold text-white/85">
						{castlePointer.visible
							? `${castlePointer.direction} · ${castlePointer.bearingDegrees.toFixed(0)}° · ${castlePointer.distance.toFixed(1)} tiles away`
							: "You are here"}
					</div>
				</div>
			)}

			<div className="pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-6">
				<div className="pointer-events-auto">
					<Inventory counts={inventory} />
				</div>
			</div>
		</div>
	);
}