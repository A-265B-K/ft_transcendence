export default function GameMenu({
	user,
	onLogout,
}: GameMenuProps) {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
			<div className="absolute right-6 top-6">
				<LanguageSwitcher />
			</div>

			<div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
				<h2 className="mb-2 text-2xl font-bold">
					{t("welcome")} {user.username}
				</h2>

				<p className="mb-6 text-white/60">
					{t("gameLobby")}
				</p>

				<div className="grid gap-3">
					<button
						type="button"
						onClick={() => {
							navigate(
								"/game-menu/create-room"
							);
						}}
						className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110"
					>
						{t("createRoom")}
					</button>

					<button
						type="button"
						onClick={() => {
							navigate(
								"/game-menu/join-room"
							);
						}}
						className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10"
					>
						{t("joinRoom")}
					</button>

					<button
						type="button"
						onClick={onLogout}
						className="mt-3 rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[#f4f7fb] transition hover:bg-white/10"
					>
						{t("logout")}
					</button>
				</div>
			</div>
		</div>
	);
}