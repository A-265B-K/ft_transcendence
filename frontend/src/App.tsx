/**
 * Main React App Component
 * 
 * Serves as the container for the Pixi.js game.
 * Manages the game lifecycle: creation on mount, cleanup on unmount.
 */

import { useEffect, useRef } from "react"
import { Game } from "./game/game";

/**
 * Main App component
 * - Creates a full-viewport container for the game
 * - Initializes the Game instance on mount
 * - Cleans up resources on unmount
 */
export default function App() {
	// Reference to the DOM container where Pixi.js canvas will be appended
	const gameContainer = useRef<HTMLDivElement>(null);

	// Initialize game on component mount, cleanup on unmount
	useEffect(() => {
		if (!gameContainer.current) return;

		// Create the game instance
		const game = new Game(gameContainer.current);

		// Cleanup function: destroy game when component unmounts
		return () => {
			game.destroy();
		};
	}, []);

	// Full-viewport container for the Pixi.js game canvas
	return (
		<div
			ref={gameContainer}
			style={{
				width: "100vw",        // Full viewport width
				height: "100vh",       // Full viewport height
				overflow: "hidden",    // Prevent scrollbars
			}}
		/>
	);

}