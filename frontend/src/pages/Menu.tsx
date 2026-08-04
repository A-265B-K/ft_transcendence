import { useEffect } from "react";
import { getSocket } from "../socket";
import { type MenuProps } from "./MenuProps";

export default function Menu({
	onMenu,
	onCreateAccount,
	onLogin,
	user,
}: MenuProps) {

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const socket = getSocket();

		if (!socket) {
			console.log("No socket connection");
			return;
		}

		console.log("Joining game as:", user?.username);

		socket.emit("join");
	}


	useEffect(() => {
		const socket = getSocket();

		if (!socket) {
			console.log("No socket connection yet");
			return;
		}


		function handleJoined(data: {
			roomId: string;
			player: {
				id: string;
				username: string;
			};
		}) {
			console.log("Joined room:", data.roomId);
			console.log("Player:", data.player);

			onMenu(data.player.username);
		}


		socket.on("joined", handleJoined);


		return () => {
			socket.off("joined", handleJoined);
		};

	}, [onMenu]);


	return (
		<div
			className="Menu-container"
			style={{
				minHeight: "100vh",
				display: "grid",
				placeItems: "center",
				padding: "24px",
			}}
		>

			<div
				style={{
					width: "100%",
					maxWidth: "420px",
					padding: "28px",
					borderRadius: "24px",
					background: "rgba(8, 16, 22, 0.78)",
					border: "1px solid rgba(255,255,255,0.12)",
					boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
					color: "#f4f7fb",
					backdropFilter: "blur(14px)",
					textAlign: "left",
				}}
			>

				<h2 style={{ marginTop: 0, marginBottom: "8px" }}>
					Ready to play?
				</h2>


				<p
					style={{
						marginTop: 0,
						marginBottom: "20px",
						color: "rgba(244,247,251,0.7)",
					}}
				>
					Join the game.
				</p>


				{user ? (
					<form
						onSubmit={handleSubmit}
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "10px",
						}}
					>

						<p>
							Welcome {user.username}
						</p>


						<button type="submit">
							Start Game
						</button>

					</form>

				) : (

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "10px",
						}}
					>

						<button
							type="button"
							onClick={onCreateAccount}
						>
							Create account
						</button>


						<button
							type="button"
							onClick={onLogin}
						>
							Sign in
						</button>

					</div>
				)}

			</div>

		</div>
	);
}