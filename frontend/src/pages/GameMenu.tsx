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
	onLogout,
}: GameMenuProps) {
	function startGame() {
		console.log("Starting game...");

		const socket = connectSocket();

		socket.once("joined", (data: JoinedPayload) => {
			console.log("Joined game:", data);
			onStartGame(data);
		});

		socket.emit("join");
	}

	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
			<div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
				<h2 className="mb-2 text-2xl font-bold">
					Welcome {user.username}
				</h2>

				<p className="mb-6 text-white/60">
					Ready to play?
				</p>

				<div className="grid gap-3">
					<button
						type="button"
						onClick={startGame}
						className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110 active:scale-[0.98]"
					>
						Start Game
					</button>

					<button
						type="button"
						onClick={onLogout}
						className="rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[#f4f7fb] transition hover:bg-white/10 active:scale-[0.98]"
					>
						Logout
					</button>
				</div>
			</div>
		</div>
	);
}