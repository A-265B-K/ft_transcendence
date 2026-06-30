import { useEffect, useRef } from "react"
import { Game } from "./game/game";

export default function App() {
	const gameContainer = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!gameContainer.current) return;

		const game = new Game(gameContainer.current);

		return () => {
			game.destroy();
		};
	}, []);

	return (
		<div
			ref={gameContainer}
			style={{
				width: "100vw",
				height: "100vh",
				overflow: "hidden",
			}}
		/>
	);

}