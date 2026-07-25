import GameCanvas  from "./pages/GameCanvas";
import Menu from "./pages/Menu";
import { useState } from "react"; 

/**
 * Main App component
 * - Creates a full-viewport container for the game
 * - Initializes the Game instance on mount
 * - Cleans up resources on unmount
 */
export default function App() {
	// Reference to the DOM container where Pixi.js canvas will be appended
	const [screen, setScreen] = useState("menu");
	const [playerName, setPlayerName] = useState("");


	if (screen === "menu")
		return ( <Menu 
					onMenu={(name) => {
						setPlayerName(name);
						setScreen("game");
					}}
				/>
			);
	if (screen === "game")
		return ( <GameCanvas />);

}