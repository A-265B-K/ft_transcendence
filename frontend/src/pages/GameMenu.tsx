import { connectSocket } from "../socket";
import { type JoinedPayload } from "../types/game";

type GameMenuProps = {
	user: {
		id: number;
		username: string;
		email: string;
	};

	onLogout: () => void;
	onStartGame: (data: JoinedPayload) => void;
};


export default function GameMenu({
	user,
	onStartGame,
	onLogout
}: GameMenuProps) {


		function startGame() {

		console.log("Starting game...");

		const socket = connectSocket();


		socket.once("joined", (data: JoinedPayload) => {

			console.log(
				"Joined game:",
				data
			);


			onStartGame(data);

		});


		socket.emit("join");
	}


	return (
		<div
			style={{
				minHeight: "100vh",
				display: "grid",
				placeItems: "center",
				background: "linear-gradient(180deg,#10212a,#081016)",
				color:"#f4f7fb"
			}}
		>

			<div
				style={{
					padding:"30px",
					borderRadius:"24px",
					background:"rgba(8,16,22,.8)",
					textAlign:"center"
				}}
			>

				<h2>
					Welcome {user.username}
				</h2>


				<p>
					Ready to play?
				</p>



				<button onClick={startGame}>
					Start Game
				</button>


				<button
					onClick={onLogout}
				>
					Logout
				</button>

			</div>

		</div>
	);
}