export default function Disconnected() {
	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6">
			<div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#081016]/85 p-7 text-[#f4f7fb] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
				<div className="mb-5 text-4xl">
					⚠️
				</div>

				<h2 className="mb-2 text-2xl font-bold">
					Connection lost
				</h2>

				<p className="mb-6 leading-relaxed text-white/70">
					You were disconnected because the server may have gone
					down or your connection latency became too high.
				</p>
			</div>
		</div>
	);
}