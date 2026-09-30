import { connectSocket } from '../socket';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JoinedPayload } from '../types/game';

type LobbyRoom = {
    roomId: string;
    name: string;
    code?: string;
    playerCount: number;
    maxPlayers: number;
};

type RoomProps = {
    joinedData: JoinedPayload | null;
    onStartGame: (data: JoinedPayload) => void;
};

export default function Room({ joinedData, onStartGame }: RoomProps) {
    const navigate = useNavigate();
    const { roomId } = useParams();

    const [room, setRoom] = useState<LobbyRoom | null>(
        joinedData?.room ?? null
    );

    const [currentJoinedData, setCurrentJoinedData] =
        useState<JoinedPayload | null>(joinedData);

    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(!joinedData);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!roomId) {
            navigate('/game-menu');
            return;
        }

        const socket = connectSocket();

        const handleJoined = (data: JoinedPayload) => {
            if (data.roomId !== roomId) {
                return;
            }

            console.log('Room restored:', data);

            setCurrentJoinedData(data);
            setRoom(data.room);
            setLoading(false);
            setError('');
        };

        const handleJoinError = ({ message }: { message: string }) => {
            console.error('Could not restore room:', message);

            setError(message);
            setLoading(false);
        };

        const handleRoomUpdate = (data: {
            roomId: string;
            playerCount: number;
            maxPlayers: number;
        }) => {
            if (data.roomId !== roomId) {
                return;
            }

            setRoom((current) => {
                if (!current) return current;

                return {
                    ...current,
                    playerCount: data.playerCount,
                    maxPlayers: data.maxPlayers
                };
            });
        };

        socket.on('joined', handleJoined);
        socket.on('join_error', handleJoinError);
        socket.on('room_update', handleRoomUpdate);

        if (!joinedData) {
            socket.emit('join_room', {
                roomId
            });
        }

        return () => {
            socket.off('joined', handleJoined);
            socket.off('join_error', handleJoinError);
            socket.off('room_update', handleRoomUpdate);
        };
    }, [roomId, joinedData, navigate]);

    async function copyRoomCode() {
        if (!room?.code) return;

        try {
            await navigator.clipboard.writeText(room.code);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch {
            setError('Could not copy the room code.');
        }
    }

    function startCreatedRoom() {
        if (!currentJoinedData) return;

        localStorage.setItem('gameRoomId', currentJoinedData.roomId);

        onStartGame(currentJoinedData);
    }

    function leaveCreatedRoom() {
        localStorage.removeItem('gameRoomId');

        navigate('/game-menu');
    }

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                    <p className="text-white/60">Reconnecting to room...</p>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                    <p className="text-red-300">
                        {error || 'Room is no longer available.'}
                    </p>

                    <button
                        type="button"
                        onClick={leaveCreatedRoom}
                        className="mt-5 w-full rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                <h2 className="mb-2 text-2xl font-bold">Room Created</h2>

                <p className="mb-6 text-white/50">
                    Share the code with your friends
                </p>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="rounded-2xl border border-[#ffcf5c]/30 bg-[#ffcf5c]/10 p-5">
                    <p className="text-sm text-white/50">Room name</p>

                    <p className="mb-5 text-xl font-bold">{room.name}</p>

                    <p className="text-sm text-white/50">Room code</p>

                    <p className="my-2 text-4xl font-bold tracking-[0.25em] text-[#ffcf5c]">
                        {room.code}
                    </p>

                    <button
                        type="button"
                        onClick={copyRoomCode}
                        className="mt-2 rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10"
                    >
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>

                    <div className="mt-5 border-t border-white/10 pt-4">
                        <p className="text-lg font-bold">
                            {room.playerCount} / {room.maxPlayers}
                        </p>

                        <p className="text-sm text-white/50">players</p>
                    </div>
                </div>

                <p className="mt-4 text-sm text-white/40">
                    Waiting for your friends to join...
                </p>

                <div className="mt-5 grid gap-3">
                    <button
                        type="button"
                        onClick={startCreatedRoom}
                        disabled={!currentJoinedData}
                        className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-50"
                    >
                        Start Game
                    </button>

                    <button
                        type="button"
                        onClick={leaveCreatedRoom}
                        className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}
