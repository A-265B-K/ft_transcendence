import { connectSocket } from '../socket';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
    JoinedPayload,
    LobbyRoom
} from '../types/game';
import { useTranslation } from 'react-i18next';

type CreatedRoom = {
    roomId: string;
    room: LobbyRoom;
};

type RoomProps = {
    createdRoom: CreatedRoom | null;
    selectedRoom: LobbyRoom | null;
    joinedData: JoinedPayload | null;
    onStartGame: (data: JoinedPayload) => void;
};

export default function Room({
    createdRoom,
    selectedRoom,
    joinedData,
    onStartGame
}: RoomProps) {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const { t } = useTranslation();
    const [loadedRoom, setLoadedRoom] = useState<LobbyRoom | null>(null);

    const room =
        createdRoom?.room ??
        selectedRoom ??
        joinedData?.room ??
        loadedRoom ??
        null;

    const [copied, setCopied] = useState(false);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!roomId) {
            navigate('/game-menu');
            return;
        }

        const isCreatedRoom = createdRoom?.roomId === roomId;
        const isSelectedRoom = selectedRoom?.roomId === roomId;

        const isJoinedRoom = joinedData?.roomId === roomId;
        if (
            !createdRoom &&
            !selectedRoom &&
            !joinedData
        ) {
            return;
        }

        if (
            !isCreatedRoom &&
            !isSelectedRoom &&
            !isJoinedRoom
        ) {
            navigate('/game-menu');
        }
    }, [
        roomId,
        createdRoom,
        selectedRoom,
        joinedData,
        navigate
    ]);

    useEffect(() => {
        if (
            !roomId ||
            createdRoom ||
            selectedRoom ||
            joinedData
        ) {
            return;
        }

        const socket = connectSocket();

        const handleRoomInfo = (
            roomInfo: LobbyRoom
        ) => {
            setLoadedRoom(roomInfo);
        };

        const handleJoinError = ({
            message
        }: {
            message: string;
        }) => {
            setError(message);
        };

        socket.once(
            'room_info',
            handleRoomInfo
        );

        socket.once(
            'join_error',
            handleJoinError
        );

        socket.emit(
            'get_room_by_id',
            {
                roomId
            }
        );

        return () => {
            socket.off(
                'room_info',
                handleRoomInfo
            );

            socket.off(
                'join_error',
                handleJoinError
            );
        };
    }, [
        roomId,
        createdRoom,
        selectedRoom,
        joinedData
    ]);

    async function copyRoomCode() {
        if (!room?.code) return;

        try {
            await navigator.clipboard.writeText(room.code);

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch {
            setError('copyError');
        }
    }

    function startGame() {
        if (joining) {
            return;
        }
        setError('');
        if (joinedData) {
            localStorage.setItem(
                'gameRoomId',
                joinedData.roomId
            );

            onStartGame(joinedData);
            return;
        }
        if (!roomId) {
            return;
        }
        setJoining(true);
        const socket = connectSocket();
        const handleJoined = (
            data: JoinedPayload
        ) => {
            if (data.roomId !== roomId) {
                return;
            }

            localStorage.setItem('gameRoomId',data.roomId);
            onStartGame(data);
        };

        const handleJoinError = ({
            message
        }: {
            message: string;
        }) => {
            setError(message);
            setJoining(false);
            socket.off('joined', handleJoined);
            socket.off('join_error', handleJoinError);
        };
        socket.once('joined', handleJoined);
        socket.once('join_error', handleJoinError);
        socket.emit('join_room', {roomId} );
    }

    function leaveRoom() {
        localStorage.removeItem('gameRoomId');
        navigate('/game-menu');
    }

    if (!room) {
        return (
            <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                    <p className="text-white/60">
                        Loading room...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                <h2 className="mb-2 text-2xl font-bold">
                    {t('roomCreated')}
                </h2>

                <p className="mb-6 text-white/50">
                    {t('shareCode')}
                </p>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {t(error)}
                    </div>
                )}

                <div className="rounded-2xl border border-[#ffcf5c]/30 bg-[#ffcf5c]/10 p-5">
                    <p className="text-sm text-white/50">
                        {t('roomName')}
                    </p>

                    <p className="mb-5 text-xl font-bold">
                        {room.name}
                    </p>

                    <p className="text-sm text-white/50">
                        {t('roomCode')}
                    </p>

                    <p className="my-2 text-4xl font-bold tracking-[0.25em] text-[#ffcf5c]">
                        {room.code}
                    </p>

                    <button
                        type="button"
                        onClick={copyRoomCode}
                        className="mt-2 rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10"
                    >
                        {copied
                            ? t('copied')
                            : t('copyCode')}
                    </button>

                    <div className="mt-5 border-t border-white/10 pt-4">
                        <p className="text-lg font-bold">
                            {room.playerCount} /{' '}
                            {room.maxPlayers}
                        </p>

                        <p className="text-sm text-white/50">
                            {t('players')}
                        </p>
                    </div>
                </div>

                <p className="mt-4 text-sm text-white/40">
                    {t('waitingForFriends')}
                </p>

                <div className="mt-5 grid gap-3">
                    <button
                        type="button"
                        onClick={startGame}
                        disabled={joining}
                        className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-50"
                    >
                        {joining
                            ? t('joining')
                            : t('startGame')}
                    </button>

                    <button
                        type="button"
                        onClick={leaveRoom}
                        disabled={joining}
                        className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10 disabled:opacity-50"
                    >
                        {t('backToLobby')}
                    </button>
                </div>
            </div>
        </div>
    );
}