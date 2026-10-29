import { useNavigate } from 'react-router-dom';

export default function Endgame({ winner }: { winner: boolean }) {
    const navigate = useNavigate();
    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6">
            <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#081016]/85 p-7 text-[#f4f7fb] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
                <h1 className="mb-6 text-center text-2xl font-bold">
                    {winner ? 'You won! 🏆' : 'You lost…'}
                </h1>
                <button
                    type="button"
                    onClick={() => navigate('/game-menu')}
                    className="w-full rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110"
                >
                    Back to menu
                </button>
            </div>
        </div>
    );
}
