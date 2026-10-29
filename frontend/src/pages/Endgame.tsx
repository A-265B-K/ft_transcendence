export default function Endgame(winner: boolean) {
    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6">
            <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#081016]/85 p-7 text-[#f4f7fb] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
                {winner && <h2> you won! </h2>}
                {!winner && <h2>you lost..</h2>}
                <br></br>
                <button>back</button>
            </div>
        </div>
    );
}
