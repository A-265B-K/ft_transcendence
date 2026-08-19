import { type MenuProps } from "./MenuProps";

export default function Menu({
	onCreateAccount,
	onLogin,
}: MenuProps) {
	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6">
			<div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#081016]/85 p-7 text-[#f4f7fb] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
				<h2 className="mb-2 text-2xl font-bold">
					Ready to play?
				</h2>

				<p className="mb-5 text-white/70">
					Create an account or sign in.
				</p>

				<div className="flex flex-col gap-2.5">
					<button
						type="button"
						onClick={onCreateAccount}
						className="rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110"
					>
						Create account
					</button>

					<button
						type="button"
						onClick={onLogin}
						className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-3 font-semibold text-[#f4f7fb] transition hover:bg-white/[0.08]"
					>
						Sign in
					</button>
				</div>
			</div>
		</div>
	);
}