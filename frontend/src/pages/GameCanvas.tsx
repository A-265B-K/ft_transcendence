import { Inventory } from '../components/Inventory';
import GamePauseMenu from './GamePauseMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from '../game/Game';
import { type CastlePointer } from './CastlePointer';
import type { JoinedPayload } from '../types/game';
import { connectSocket } from '../socket';
import type { GameCanvasProps } from './gameCanvasProps';
import { useTranslation } from 'react-i18next';

export default function GameCanvas({ joinedData }: GameCanvasProps) {
    const { t } = useTranslation();
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Game | null>(null);

    const [inventory, setInventory] = useState({
        wood: joinedData.player.inventory.wood,
        iron: joinedData.player.inventory.iron
    });

    const [hp, setHp] = useState(joinedData.player.hp);
    const [spectating, setSpectating] = useState(false);
    const [castlePointer, setCastlePointer] = useState<CastlePointer | null>(
        null
    );

    const [paused, setPaused] = useState(false);

    const resumeGame = useCallback(() => {
        setPaused(false);
        gameRef.current?.resume();
    }, []);

    function pauseGame() {
        setPaused(true);
        gameRef.current?.pause();
    }

    useEffect(() => {
        if (!joinedData || !gameContainer.current) return;

        console.log('Starting game with:', joinedData);

        const socket = connectSocket();
        const game = new Game();

        gameRef.current = game;

        void game.start(gameContainer.current, joinedData, socket);

        function handlePlayerJoined(player: JoinedPayload['players'][number]) {
            console.log('Player joined:', player);

            game.addRemotePlayer(player);
            game.addRemoteCastle(player);
        }

        function handlePlayerLeft(player: JoinedPayload['players'][number]) {
            console.log('Player left:', player);

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
            if (socketId !== joinedData.player.socketId) return;

            setHp(hp);
        }

        function handleJoinError({ message }: { message: string }) {
            console.error('Join failed:', message);
        }

        function handlePlayerMove({
            socketId,
            x,
            y,
            moving
        }: {
            socketId: string;
            x: number;
            y: number;
            moving: boolean;
        }) {
            if (socketId === socket.id) {
                game.correctLocalPlayer(x, y);
                return;
            }

            game.updateRemotePlayer(socketId, x, y, moving);
        }

        function handlePlayerDied(data: {
            player: JoinedPayload['players'][number];
        }) {
            if (data.player.userId === joinedData.player.userId) {
                game.setPlayerDead();
                setSpectating(true);
                setHp(0);
                return;
            }

            game.removeRemotePlayer(data.player);
            game.removeRemoteCastle(data.player);
        }

        function handleResourceCollected({
            x,
            y,
            playerId,
            inventory
        }: {
            x: number;
            y: number;
            playerId: string;
            inventory: {
                wood: number;
                iron: number;
            };
        }) {
            game.removeResourceTile(x, y);

            if (playerId === joinedData.player.userId) {
                game.syncInventory(inventory.wood, inventory.iron);
            }
        }

        function handlePlayerAttacked({
            socketId,
            direction
        }: {
            socketId: string;
            direction: 'up' | 'down' | 'left' | 'right';
        }) {
            game.RemotePlayerattack(socketId, direction);
        }
        function handleResourceSpawned({
            x,
            y,
            type
        }: {
            x: number;
            y: number;
            type: 'wood' | 'iron';
        }) {
            game.spawnResourceTile(x, y, type);
        }

        function handleCastleUpgrade({
            socketId,
            level
        }: {
            socketId: string;
            level: number;
        }) {
            game.updateRemoteCastle(socketId, level);
        }

        socket.on('player_joined', handlePlayerJoined);
        socket.on('player_move', handlePlayerMove);
        socket.on('player_left', handlePlayerLeft);
        socket.on('resource_collected', handleResourceCollected);
        socket.on('join_error', handleJoinError);
        socket.on('player_hp', handlePlayerHP);
        socket.on('player_attacked', handlePlayerAttacked);
        socket.on('resource_spawned', handleResourceSpawned);
        socket.on('castle_update', handleCastleUpgrade);
        socket.on('player_died', handlePlayerDied);

        const intervalId = window.setInterval(() => {
            const snapshot = game.getInventorySnapshot();

            const pointer = game.getCastlePointerSnapshot();

            if (snapshot) setInventory(snapshot);

            if (pointer) setCastlePointer(pointer);
        }, 32);

        return () => {
            socket.off('player_joined', handlePlayerJoined);
            socket.off('player_move', handlePlayerMove);
            socket.off('player_left', handlePlayerLeft);
            socket.off('player_hp', handlePlayerHP);
            socket.off('player_attacked', handlePlayerAttacked);
            socket.off('player_died', handlePlayerDied);
            socket.off('resource_collected', handleResourceCollected);
            socket.off('resource_spawned', handleResourceSpawned);
            socket.off('join_error', handleJoinError);
            socket.off('castle_update', handleCastleUpgrade);
            window.clearInterval(intervalId);

            gameRef.current = null;
            game.destroy();
        };
    }, [joinedData]);

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape' || paused) return;

            pauseGame();
        }

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [paused]);

    function handleLeave() {
        gameRef.current?.destroy();
        gameRef.current = null;

        /*
         * For now this only destroys the local game.
         *
         * We will add socket.emit("leave_room")
         * when the backend leave_room event exists.
         */
        window.location.reload();
    }

    return (
        <div className="relative h-screen w-screen overflow-hidden">
            <div ref={gameContainer} className="h-full w-full" />

            {castlePointer && (
                <div
                    className="pointer-events-none absolute left-1/2 top-[18px] -translate-x-1/2 grid min-w-[140px] justify-items-center gap-1 rounded-[18px] border border-white/15 bg-[#0a1016]/75 px-4 py-3.5 text-[#f4f7fb] shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                    aria-label={t('castleDirection')}
                >
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">
                        {t('castle')}
                    </div>

                    <div
                        className="origin-center text-[30px] font-black leading-none text-[#ffcf5c] drop-shadow-[0_2px_12px_rgba(255,207,92,0.5)]"
                        style={{
                            transform: `rotate(${castlePointer.rotation}rad)`
                        }}
                    >
                        ➤
                    </div>

                    <div className="text-[13px] font-semibold text-white/85">
                        {castlePointer.visible
                            ? `${castlePointer.direction} · ${castlePointer.bearingDegrees.toFixed(0)}° · ${castlePointer.distance.toFixed(1)} ${t('tilesAway')}`
                            : t('youAreHere')}
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
                                width: `${Math.max(0, Math.min(100, hp))}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {!spectating && (
                <div className="absolute right-4 top-4 z-50">
                    <button
                        type="button"
                        onClick={pauseGame}
                        className="rounded-xl border border-white/15 bg-[#0a1016]/75 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-xl transition hover:bg-white/10"
                        aria-label="Open game menu"
                    >
                        ☰ {t('menu')}
                    </button>
                </div>
            )}

            <div className="pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-6">
                <div className="pointer-events-auto">
                    <Inventory counts={inventory} />
                </div>
            </div>

            {!spectating && paused && (
                <GamePauseMenu
                    roomCode={joinedData.room.code}
                    onResume={resumeGame}
                    onLeave={handleLeave}
                />
            )}
            {spectating && (
                <div className="absolute left-1/2 top-3 z-[100] -translate-x-1/2">
                    <div className="w-80 rounded-2xl border border-white/10 bg-[#081016]/90 p-5 text-center text-white shadow-2xl backdrop-blur-xl">
                        <div className="mb-2 text-3xl">💀</div>

                        <h2 className="mb-1 text-2xl font-bold">
                            {t('youDied')}
                        </h2>

                        <p className="mb-4 text-sm text-white/50">
                            {t('spectating')}
                        </p>

                        <button
                            type="button"
                            onClick={handleLeave}
                            className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
                        >
                            {t('leaveGame')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
