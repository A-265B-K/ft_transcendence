import { Inventory } from "../components/Inventory";
import { useEffect, useRef, useState } from "react";
import { Game } from "../game/Game";
import { type CastlePointer } from "./CastlePointer";
import type { JoinedPayload } from "../types/game";
import { connectSocket } from "../socket";
import type { GameCanvasProps } from "./gameCanvasProps";

export default function GameCanvas({
	joinedData,
}: GameCanvasProps) {
	const gameContainer = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Game | null>(null);

	const [inventory, setInventory] = useState({
		wood: joinedData.player.inventory.wood,
		iron: joinedData.player.inventory.iron,
	});

	const [hp, setHp] = useState(joinedData.player.hp);

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

		function handlePlayerLeft(
			player: JoinedPayload["players"][number],
		) {
			console.log("Player left:", player);

			game.removeRemotePlayer(player);
			game.removeRemoteCastle(player);
		}

		function handlePlayerHP({
			socketId,
			hp
		}: {
			socketId: string;
			hp: number;
		}) {
				if (socketId !== joinedData.player.socketId)
					return;

				setHp(hp);
		}

		function handleJoinError({
			message,
		}: {
			message: string;
		}) {
			console.error("Join failed:", message);
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
			if (socketId === socket.id) {
				game.correctLocalPlayer(x, y);
				return;
			}

			game.updateRemotePlayer(socketId, x, y);
		}

		function handleResourceCollected({
			x,
			y,
			playerId,
			inventory,
		}: {
			x: number;
			y: number;
			playerId: string;
			inventory: { wood: number; iron: number };
		}) {
			game.removeResourceTile(x, y);

			if (playerId === joinedData.player.userId) {
				game.syncInventory(inventory.wood, inventory.iron);
			}
		}

		function handleResourceSpawned({
			x,
			y,
			type,
		}: {
			x: number;
			y: number;
			type: "wood" | "iron";
		}) {
			game.spawnResourceTile(x, y, type);
		}

		function handleCastleUpgrade({
			socketId,
			level,
		}: {
			socketId: string;
			level: number;
		}) {
			game.updateRemoteCastle(socketId, level);
		}

		socket.on("player_joined", handlePlayerJoined);
		socket.on("player_move", handlePlayerMove);
		socket.on("player_left", handlePlayerLeft);
		socket.on("resource_collected", handleResourceCollected);
		socket.on("join_error", handleJoinError);
		socket.on("player_hp", handlePlayerHP);
		socket.on("resource_spawned", handleResourceSpawned);
		socket.on("castle_update", handleCastleUpgrade);

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
			socket.off("player_left", handlePlayerLeft);
			socket.off("player_hp", handlePlayerHP);
			socket.off("resource_collected", handleResourceCollected);
			socket.off("resource_spawned", handleResourceSpawned);
			socket.off("join_error", handleJoinError);
			socket.off("castle_update", handleCastleUpgrade);
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

			<div className="pointer-events-none absolute left-4 top-4 z-50">
				<div className="w-64">
					<div className="mb-1 text-sm font-bold text-white">
						HP {hp} / 100
					</div>

					<div className="h-4 overflow-hidden rounded-full bg-black/50">
						<div
							className="h-full bg-red-500 transition-all"
							style={{
								width: `${Math.max(
									0,
									Math.min(100, hp),
								)}%`,
							}}
						/>
					</div>
				</div>
			</div>

			<div className="pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-6">
				<div className="pointer-events-auto">
					<Inventory counts={inventory} />
				</div>
			</div>
		</div>
	);
}