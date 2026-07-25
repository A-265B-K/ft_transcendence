import { Inventory } from "../components/Inventory";
import { useEffect, useRef, useState } from "react"
import { Game } from "../game/game";
import { type CastlePointer } from "./CastlePointer"

export default function GameCanvas () {
	const gameContainer = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Game | null>(null);
	const [inventory, setInventory] = useState({ wood: 0, iron: 0 });
	const [castlePointer, setCastlePointer] = useState<CastlePointer | null>(null);

	// Initialize game on component mount, cleanup on unmount
	useEffect(() => {
		if (!gameContainer.current) return;

		// Create the game instance
		const game = new Game();
		gameRef.current = game;
		void game.start(gameContainer.current);

		const intervalId = window.setInterval(() => {
			const snapshot = game.getInventorySnapshot();
			const pointer = game.getCastlePointerSnapshot();

			if (snapshot) {
				setInventory(snapshot);
			}

			if (pointer) {
				setCastlePointer(pointer);
			}
		}, 32);

		// Cleanup function: destroy game when component unmounts
		return () => {
			window.clearInterval(intervalId);
			gameRef.current = null;
			game.destroy();
		};
	}, []);

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