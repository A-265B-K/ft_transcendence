import { connectSocket } from '../socket';
import { useEffect, useState } from 'react';
import type { LobbyRoom } from '../types/game';
import { useTranslation } from 'react-i18next';

type JoinRoomProps = {
    onBack: () => void;
    onJoined: (room: LobbyRoom) => void;
};

export default function JoinRoom({ onBack, onJoined }: JoinRoomProps) {
    const { t } = useTranslation();
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
        if (loading) {
            return;
        }

        const room = rooms.find((currentRoom) => currentRoom.roomId === roomId);

        if (!room) {
            setError('roomNotFound');
            return;
        }

        setError('');
        onJoined(room);
    }

    function joinWithCode() {
        if (loading) return;

        const code = roomCode.trim().toUpperCase();
        if (!code) {
            setError('enterRoomCode');
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

        socket.emit('get_room_by_code', { code });
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                <h2 className="mb-2 text-2xl font-bold">{t('joinRoom')}</h2>

                <p className="mb-6 text-white/60">{t('gameLobby')}</p>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {t(error)}
                    </div>
                )}

                <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">
                            {t('availableRooms')}
                        </h3>

                        <button
                            type="button"
                            onClick={loadRooms}
                            disabled={loading}
                            className="text-sm text-white/50 transition hover:text-white"
                        >
                            {t('refresh')}
                        </button>
                    </div>

                    {rooms.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6">
                            <p className="text-sm text-white/50">
                                {t('noRooms')}
                            </p>

                            <p className="mt-1 text-xs text-white/30">
                                {t('inviteFriends')}
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
                                            {room.maxPlayers} {t('players')}
                                        </p>
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
                                        {t('join')}
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
                            placeholder={t('roomCode')}
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
                            {t('join')}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onBack}
                        disabled={loading}
                        className="mt-3 rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[#f4f7fb] transition hover:bg-white/10"
                    >
                        {t('back')}
                    </button>
                </div>
            </div>
        </div>
    );
}
