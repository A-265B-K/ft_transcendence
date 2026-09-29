import type { GameMenuProps } from "./gameMenuProps";
import { useNavigate } from "react-router-dom";

export default function GameMenu({
	user,
	onLogout,
}: GameMenuProps) {
	const navigate = useNavigate();

	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
			<div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
				<h2 className="mb-2 text-2xl font-bold">
					Welcome {user.username}
				</h2>

				<p className="mb-6 text-white/60">
					Game Lobby
				</p>

				<div className="grid gap-3">
					<button
						type="button"
						onClick={() => {
							navigate(
								"/game-menu/create-room"
							);
						}}
						className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110"
					>
						Create Room
					</button>

					<button
						type="button"
						onClick={() => {
							navigate("/game-menu/join-room");
						}}
						className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10"
					>
						Join Room
					</button>

					<button
						type="button"
						onClick={onLogout}
						className="mt-3 rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[#f4f7fb] transition hover:bg-white/10"
					>
						Logout
					</button>
				</div>
			</div>
		</div>
	);
}