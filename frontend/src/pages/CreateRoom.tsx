import { connectSocket } from '../socket';
import { useState } from 'react';
import type { JoinedPayload } from '../types/game';
import { t } from 'i18next';

type CreateRoomProps = {
    onBack: () => void;
    onCreated: (data: JoinedPayload) => void;
};

export default function CreateRoom({ onBack, onCreated }: CreateRoomProps) {
    const [loading, setLoading] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [error, setError] = useState('');

    function createRoom() {
        if (loading) return;

        const name = roomName.trim();

        if (!name) {
            setError('enterRoomName');
            return;
        }

        setLoading(true);
        setError('');

        const socket = connectSocket();

        socket.once('joined', (data: JoinedPayload) => {
            console.log('Created and joined room:', data);

            localStorage.setItem('gameRoomId', data.roomId);

            setLoading(false);
            onCreated(data);
        });

        socket.once('join_error', ({ message }: { message: string }) => {
            setError(message);
            setLoading(false);
        });

        socket.emit('create_room', {
            name
        });
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
                <h2 className="mb-2 text-2xl font-bold">{t('createRoom')}</h2>

                <p className="mb-6 text-white/60">{t('inviteFriends')}</p>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {t('error')}
                    </div>
                )}

                <div className="grid gap-3">
                    <input
                        type="text"
                        value={roomName}
                        onChange={(event) => {
                            setRoomName(event.target.value);
                            setError('');
                        }}
                        placeholder={t('roomName')}
                        maxLength={30}
                        disabled={loading}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-[#ffcf5c] disabled:opacity-50"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={createRoom}
                            disabled={loading}
                            className="flex-1 rounded-xl bg-[#ffcf5c] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-50"
                        >
                            {loading ? t('creating') : t('create')}
                        </button>

                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading}
                            className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10 disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
