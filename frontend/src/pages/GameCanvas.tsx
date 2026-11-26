import { Forgemenu } from '../components/Forgemenu';
import { Inventory } from '../components/Inventory';
import GamePauseMenu from './GamePauseMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from '../game/Game';
import { type CastlePointer } from './CastlePointer';
import type { JoinedPayload, UpgradeCastleResult, Vec2 } from '../types/game';
import { connectSocket, disconnectSocket, getSocket } from '../socket';
import type { GameCanvasProps } from './gameCanvasProps';
import { useTranslation } from 'react-i18next';
import type { WeaponType } from '../game/entities/weapons/weapon';
import healingIcon from '../assets/castleboons/healing.png';
import shieldIcon from '../assets/castleboons/shield.png';
import attackIcon from '../assets/weapons/sword/sword-spacebar.png';
import boulderIcon from '../assets/boulder-r.png';
import Endgame from './Endgame';

const CASTLE_HEAL_RADIUS = 10;

export default function GameCanvas({ joinedData }: GameCanvasProps) {
    const { t } = useTranslation();
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [castlelvl, setcastlelvl] = useState(
        joinedData.player.inventory.castleLevel
    );
    const [castleHp, setCastleHp] = useState(joinedData.player.castleHp ?? 100);
    const [upgrading, setUpgrading] = useState(false);
    const upgradePending = useRef(false);
    const [inventory, setInventory] = useState({
        wood: joinedData.player.inventory.wood,
        iron: joinedData.player.inventory.iron
    });

    const [hp, setHp] = useState(joinedData.player.hp);
    const [opponents, setOpponents] = useState(() =>
        joinedData.players.filter(
            (player) =>
                player.userId !== joinedData.player.userId && player.hp > 0
        )
    );
    const [armorActive, setArmorActive] = useState(false);
    const [spectating, setSpectating] = useState(false);
    const [castlePointer, setCastlePointer] = useState<CastlePointer | null>(
        null
    );

    const [nearCastle, setNearCastle] = useState(false);
    const [withinHealingRange, setWithinHealingRange] = useState(false);
    const [boulderReady, setboulderready] = useState(false);

    const [paused, setPaused] = useState(false);

    const [winner, setWinner] = useState('');
    const [canattack, setCanAttack] = useState(false);
    const canSpectate = spectating && castlelvl === 0;

    const resumeGame = useCallback(() => {
        setPaused(false);
        gameRef.current?.resume();
    }, []);

    function pauseGame() {
        setPaused(true);
        gameRef.current?.pause();
    }

    function upgradeCastle() {
        if (
            upgradePending.current ||
            spectating ||
            !nearCastle ||
            castlelvl >= 4
        )
            return;

        const socket = getSocket();
        const game = gameRef.current;
        if (!socket?.connected || !game) return;

        upgradePending.current = true;
        setUpgrading(true);
        socket
            .timeout(5000)
            .emit(
                'upgrade_castle',
                {},
                (error: Error | null, result?: UpgradeCastleResult) => {
                    if (gameRef.current !== game) return;

                    upgradePending.current = false;
                    setUpgrading(false);
                    if (error || !result?.success) return;

                    const { level, inventory } = result;
                    const { wood, iron } = inventory;
                    game.syncInventory(wood, iron);
                    setcastlelvl(level);
                    game.updateRemoteCastle(joinedData.player.socketId, level);
                }
            );
    }

    useEffect(() => {
        if (!joinedData || !gameContainer.current || winner) return;

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

            setOpponents((current) =>
                current.filter((opponent) => opponent.userId !== player.userId)
            );
            game.removeRemotePlayer(player);
            game.removeRemoteCastle(player);
        }
        function handlePlayerWeaponEquipped({
            socketId,
            weapon
        }: {
            socketId: string;
            weapon: WeaponType;
        }) {
            game.equipremoteweapon(socketId, weapon);
        }

        function handlePlayerHP({
            socketId,
            hp,
            reason
        }: {
            socketId: string;
            hp: number;
            reason: string;
        }) {
            if (socketId === joinedData.player.socketId) {
                setHp(hp);
                if (reason === 'damage') game.playerhitanimation();
            } else {
                if (reason === 'damage')
                    game.remoteplayerhitanimation(socketId);
            }
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
            setOpponents((current) =>
                current.filter(
                    (opponent) => opponent.userId !== data.player.userId
                )
            );
            if (data.player.userId === joinedData.player.userId) {
                game.setPlayerDead();
                setSpectating(true);
                setHp(0);
                return;
            }

            game.removeRemotePlayer(data.player);
        }

        function handlePlayerRespawned(data: {
            player: JoinedPayload['players'][number];
        }) {
            const player = data.player;
            if (player.userId === joinedData.player.userId) {
                game.equipWeapon(player.equippedWeapon);
                game.respawnLocalPlayer(player.x, player.y);
                setHp(player.hp);
                setSpectating(false);
                return;
            }

            game.addRemotePlayer(player);
            setOpponents((current) =>
                current.some((opponent) => opponent.userId === player.userId)
                    ? current
                    : [...current, player]
            );
        }

        function handleResourceCollected({ x, y }: { x: number; y: number }) {
            game.removeResourceTile(x, y);
        }

        function handleInventoryUpdated({
            playerId,
            inventory
        }: {
            playerId: string;
            inventory: {
                wood: number;
                iron: number;
            };
        }) {
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

        function handleCastleLvlupdate({
            socketId,
            level
        }: {
            socketId: string;
            level: number;
        }) {
            game.updateRemoteCastle(socketId, level);
            if (socketId === joinedData.player.socketId) {
                setcastlelvl(level);
            }
        }

        function handleTrebuchetSpawn({
            trebuchetId,
            position
        }: {
            trebuchetId: string;
            position: Vec2;
        }) {
            game.spawnTrebuchet(trebuchetId, position);
        }

        function handletrebuchetbroken({ trebuchetId }: { trebuchetId: string }) {
            game.breakTrebuchet(trebuchetId);
        }

        function handleTrebuchetFire({
            trebuchetId,
            direction
        }: {
            trebuchetId: string;
            direction: 'up' | 'down' | 'left' | 'right';
        }) {
            game.fireTrebuchet(trebuchetId, direction);
        }

        function handleTrebuchetDamaged(data: {
            trebuchetId: string;
            health: number;
            maxHealth: number;
        }) {
            game.updateTrebuchetHealth(
                data.trebuchetId,
                data.health,
                data.maxHealth
            );
        }

        function handleTrebuchetMove({
            trebuchetId,
            position
        }: {
            trebuchetId: string;
            position: Vec2;
        }) {
            game.updateTrebuchet(trebuchetId, position);
        }

        function handleCastleAttackStarted(data: {
            socketId: string;
            start: { x: number; y: number };
            target: { x: number; y: number };
            durationMs: number;
        }) {
            game.launchboulder(data);
        }

        function handleTrebuchetAttack(data: {
            start: Vec2;
            target: Vec2;
            durationMs: number;
        }) {
            game.launchTrebuchetShot(data);
        }

        function handleCastleDamaged(data: {
            playerSlot: number;
            health: number;
            level: number;
        }) {
            game.updateCastleHealth(data.playerSlot, data.health, data.level);
            if (data.playerSlot === joinedData.player.slot) {
                setCastleHp(data.health);
                setcastlelvl(data.level);
            }
        }

        const handlearmor = (data: { armor: boolean }) => {
            setArmorActive(data.armor);
        };

        const handleGameEnd = (data: { winnerid: string }) => {
            if (!data?.winnerid) return;
            setWinner(data.winnerid);
            socket.emit('leave_room');
        };

        const handleboulderready = (data: { ready: boolean }) => {
            if (data && data.ready !== undefined) {
                setboulderready(data.ready);
            }
        };
        const handleCanAttack = ({ ready }: { ready: boolean }) => {
            setCanAttack(ready);
        };

        socket.on('player_joined', handlePlayerJoined);
        socket.on('player_move', handlePlayerMove);
        socket.on('player_left', handlePlayerLeft);
        socket.on('resource_collected', handleResourceCollected);
        socket.on('inventory_updated', handleInventoryUpdated);
        socket.on('join_error', handleJoinError);
        socket.on('player_hp', handlePlayerHP);
        socket.on('player_attacked', handlePlayerAttacked);
        socket.on('can_attack', handleCanAttack);
        socket.on('resource_spawned', handleResourceSpawned);
        socket.on('castlelvlupdate', handleCastleLvlupdate);
        socket.on('player_died', handlePlayerDied);
        socket.on('player_respawned', handlePlayerRespawned);
        socket.on('player_weapon_equipped', handlePlayerWeaponEquipped);
        socket.on('armor', handlearmor);
        socket.on('castle_attack_started', handleCastleAttackStarted);
        socket.on('trebuchet_attack', handleTrebuchetAttack);
        socket.on('castle_damaged', handleCastleDamaged);
        socket.on('trebuchet_spawn', handleTrebuchetSpawn);
        socket.on('trebuchet_move', handleTrebuchetMove);
        socket.on('trebuchet_fire', handleTrebuchetFire);
        socket.on('trebuchet_damaged', handleTrebuchetDamaged);
        socket.on('trebuchet_broken', handletrebuchetbroken);
        socket.on('boulderready', handleboulderready);
        socket.on('game_end', handleGameEnd);

        const intervalId = window.setInterval(() => {
            const snapshot = game.getInventorySnapshot();

            const pointer = game.getCastlePointerSnapshot();

            if (snapshot) setInventory(snapshot);

            if (pointer) setCastlePointer(pointer);
            setNearCastle(game.isPlayerNearCastle(7));
            setWithinHealingRange(game.isPlayerNearCastle(CASTLE_HEAL_RADIUS));
        }, 32);

        return () => {
            upgradePending.current = false;
            socket.off('player_joined', handlePlayerJoined);
            socket.off('player_move', handlePlayerMove);
            socket.off('player_left', handlePlayerLeft);
            socket.off('player_hp', handlePlayerHP);
            socket.off('player_attacked', handlePlayerAttacked);
            socket.off('can_attack', handleCanAttack);
            socket.off('player_died', handlePlayerDied);
            socket.off('player_respawned', handlePlayerRespawned);
            socket.off('resource_collected', handleResourceCollected);
            socket.off('inventory_updated', handleInventoryUpdated);
            socket.off('resource_spawned', handleResourceSpawned);
            socket.off('join_error', handleJoinError);
            socket.off('castlelvlupdate', handleCastleLvlupdate);
            socket.off('player_weapon_equipped', handlePlayerWeaponEquipped);
            socket.off('armor', handlearmor);
            socket.off('castle_attack_started', handleCastleAttackStarted);
            socket.off('trebuchet_attack', handleTrebuchetAttack);
            socket.off('castle_damaged', handleCastleDamaged);
            socket.off('trebuchet_spawn', handleTrebuchetSpawn);
            socket.off('trebuchet_move', handleTrebuchetMove);
            socket.off('trebuchet_fire', handleTrebuchetFire);
            socket.off('trebuchet_damaged', handleTrebuchetDamaged);
            socket.off('trebuchet_broken', handletrebuchetbroken);
            socket.off('game_end', handleGameEnd);
            socket.off('boulderready', handleboulderready);
            window.clearInterval(intervalId);

            gameRef.current = null;
            game.destroy();
        };
    }, [joinedData, winner]);

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

        localStorage.removeItem('gameRoomId');

        disconnectSocket();

        window.location.href = '/game-menu';
    }

    if (winner) {
        return <Endgame winner={joinedData.player.userId === winner} />;
    }
    return (
        <div
            className="relative h-screen w-screen overflow-hidden"
            onContextMenuCapture={(event) => event.preventDefault()}
        >
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
                <div className="w-64 shrink-0">
                    <div className="mb-1 flex h-12 items-center justify-between">
                        <div className="text-sm font-bold text-white">
                            HP {hp} / 100
                        </div>
                        <div className="flex items-center gap-1">
                            {castlelvl >= 2 &&
                                withinHealingRange &&
                                !spectating && (
                                    <img
                                        src={healingIcon}
                                        alt="Healing"
                                        className="h-12 w-12 object-contain"
                                    />
                                )}
                            {!spectating && armorActive && (
                                <img
                                    src={shieldIcon}
                                    alt="Armor"
                                    className="h-12 w-12 object-contain"
                                />
                            )}
                            {canattack && !spectating && (
                                <img
                                    src={attackIcon}
                                    alt="Attack ready (Space)"
                                    className="h-12 w-12 object-contain"
                                />
                            )}
                            {boulderReady && (
                                <img
                                    src={boulderIcon}
                                    alt="boulder"
                                    className="h-12 w-12 object-contain"
                                />
                            )}
                        </div>
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

            {nearCastle && !spectating && castleHp > 0 && (
                <Forgemenu
                    castleLevel={castlelvl}
                    inventory={inventory}
                    onUpgrade={upgradeCastle}
                    upgrading={upgrading}
                    opponents={opponents}
                    onInventoryChange={(updatedInventory) => {
                        gameRef.current?.syncInventory(
                            updatedInventory.wood,
                            updatedInventory.iron
                        );
                        setInventory(updatedInventory);
                    }}
                    onEquip={(weapon, updatedInventory) => {
                        gameRef.current?.equipWeapon(weapon);
                        gameRef.current?.syncInventory(
                            updatedInventory.wood,
                            updatedInventory.iron
                        );
                        setInventory(updatedInventory);
                    }}
                />
            )}

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
                            {canSpectate
                                ? t('spectating')
                                : t('waitingToRespawn')}
                        </p>

                        {canSpectate && (
                            <button
                                type="button"
                                onClick={handleLeave}
                                className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
                            >
                                {t('leaveGame')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
