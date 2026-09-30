import { connectSocket } from '../socket';
import { useEffect, useState } from 'react';
import type { JoinedPayload } from '../types/game';

type LobbyRoom = {
    roomId: string;
    name: string;
    code?: string;
    playerCount: number;
    maxPlayers: number;
};

type JoinRoomProps = {
    onBack: () => void;
    onJoined: (data: JoinedPayload) => void;
};

export default function JoinRoom({ onBack, onJoined }: JoinRoomProps) {
    const [loading, setLoading] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const [rooms, setRooms] = useState<LobbyRoom[]>([]);

    function loadRooms() {
        if (loading) return;

        setError('');

        const socket = connectSocket();

        socket.once('rooms_list', (roomList: LobbyRoom[]) => {
            setRooms(roomList);
        });

        socket.once('join_error', ({ message }: { message: string }) => {
            setError(message);
        });

        socket.emit('get_rooms');
    }

    useEffect(() => {
        const socket = connectSocket();

        const handleRoomsList = (roomList: LobbyRoom[]) => {
            console.log('Available rooms:', roomList);

            setRooms(roomList);
        };

        const handleJoinError = ({ message }: { message: string }) => {
            setError(message);
        };

        socket.on('rooms_list', handleRoomsList);

        socket.on('join_error', handleJoinError);

        socket.emit('get_rooms');

        return () => {
            socket.off('rooms_list', handleRoomsList);

            socket.off('join_error', handleJoinError);
        };
    }, []);

    function joinSelectedRoom(roomId: string) {
        if (loading) return;

        setLoading(true);
        setError('');

        const socket = connectSocket();

        socket.once('joined', (data: JoinedPayload) => {
            console.log('Joined room:', data);

            setLoading(false);
            onJoined(data);
        });

        socket.once('join_error', ({ message }: { message: string }) => {
            setError(message);
            setLoading(false);
        });

        socket.emit('join_room', {
            roomId
        });
    }

    function joinWithCode() {
        if (loading) return;

        const code = roomCode.trim().toUpperCase();

        if (!code) {
            setError('Enter a room code.');
            return;
        }

        setLoading(true);
        setError('');

        const socket = connectSocket();

        socket.once('room_info', (room: LobbyRoom) => {
            console.log('Room found:', room);

            setLoading(false);
            setRooms([room]);
        });

        socket.once('join_error', ({ message }: { message: string }) => {
            setError(message);
            setLoading(false);
        });

        socket.emit('get_room_by_code', {
            code
        });
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                <h2 className="mb-2 text-2xl font-bold">Join Room</h2>

                <p className="mb-6 text-white/60">Game Lobby</p>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Available Rooms</h3>

                        <button
                            type="button"
                            onClick={loadRooms}
                            disabled={loading}
                            className="text-sm text-white/50 transition hover:text-white"
                        >
                            Refresh
                        </button>
                    </div>

                    {rooms.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6">
                            <p className="text-sm text-white/50">
                                No rooms available.
                            </p>

                            <p className="mt-1 text-xs text-white/30">
                                Create a room and invite your friends.
                            </p>
                        </div>
                    ) : (
                        <div className="grid max-h-80 gap-2 overflow-y-auto">
                            {rooms.map((room) => (
                                <div
                                    key={room.roomId}
                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                                >
                                    <div className="min-w-0 text-left">
                                        <p className="truncate font-bold">
                                            {room.name}
                                        </p>

                                        <p className="text-sm text-white/50">
                                            {room.playerCount} /{' '}
                                            {room.maxPlayers} players
                                        </p>

                                        {room.code && (
                                            <p className="mt-1 text-xs text-white/30">
                                                Code: {room.code}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            joinSelectedRoom(room.roomId)
                                        }
                                        disabled={
                                            loading ||
                                            room.playerCount >= room.maxPlayers
                                        }
                                        className="ml-3 rounded-xl bg-[#ffcf5c] px-4 py-2 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-40"
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(event) =>
                                setRoomCode(event.target.value)
                            }
                            placeholder="Room code"
                            maxLength={6}
                            disabled={loading}
                            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center uppercase outline-none placeholder:text-white/30 focus:border-[#ffcf5c] disabled:opacity-50"
                        />

                        <button
                            type="button"
                            onClick={joinWithCode}
                            disabled={loading}
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10 disabled:opacity-50"
                        >
                            Join
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onBack}
                        disabled={loading}
                        className="mt-3 rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[#f4f7fb] transition hover:bg-white/10"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}
