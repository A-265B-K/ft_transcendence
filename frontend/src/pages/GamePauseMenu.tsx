import { useEffect } from "react";
import type { GamePauseMenuProps } from "./gamePauseMenuProps";

export default function GamePauseMenu({
	roomCode,
	onResume,
	onLeave,
}: GamePauseMenuProps) {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape")
				onResume();
		}

		window.addEventListener(
			"keydown",
			handleKeyDown
		);

		return () => {
			window.removeEventListener(
				"keydown",
				handleKeyDown
			);
		};
	}, [onResume]);

	return (
		<div className="absolute inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
			<div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#081016]/95 p-8 text-center text-[#f4f7fb] shadow-2xl">
				<h2 className="mb-2 text-2xl font-bold">
					Game Menu
				</h2>

				<p className="mb-6 text-sm text-white/50">
					Your game is paused
				</p>

				<div className="mb-5 rounded-2xl border border-[#ffcf5c]/30 bg-[#ffcf5c]/10 p-5">
					<p className="text-sm text-white/50">
						Invitation code
					</p>

					<p className="my-2 text-3xl font-bold tracking-[0.2em] text-[#ffcf5c]">
						{roomCode}
					</p>

					<button
						type="button"
						onClick={() =>
							navigator.clipboard.writeText(
								roomCode
							)
						}
						className="rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10"
					>
						Copy Code
					</button>
				</div>

				<div className="grid gap-3">
					<button
						type="button"
						onClick={onResume}
						className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110"
					>
						Resume Game
					</button>

					<button
						type="button"
						onClick={onLeave}
						className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 font-bold text-red-300 transition hover:bg-red-400/20"
					>
						Leave Game
					</button>
				</div>

				<p className="mt-5 text-xs text-white/30">
					Press ESC to resume
				</p>
			</div>
		</div>
	);
}