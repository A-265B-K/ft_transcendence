type InventoryCounts = {
	wood: number;
	iron: number;
};

type InventoryProps = {
	counts: InventoryCounts;
};

export function Inventory({ counts }: InventoryProps) {
	return (
		<div
			className="pointer-events-auto min-w-[220px] rounded-[18px] border border-white/15 bg-[#0a1016]/75 px-[18px] py-3.5 text-[#f4f7fb] shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl"
			aria-label="Player inventory"
		>
			<div className="mb-2.5 text-xs uppercase tracking-[0.16em] text-white/70">
				Inventory
			</div>

			<div className="grid grid-cols-2 gap-2.5">
				<div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.06] px-3 py-2.5">
					<span className="text-sm font-semibold text-[#f0b35f]">
						Wood
					</span>

					<span className="min-w-6 text-right text-base font-bold">
						{counts.wood}
					</span>
				</div>

				<div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.06] px-3 py-2.5">
					<span className="text-sm font-semibold text-[#91c8d8]">
						Iron
					</span>

					<span className="min-w-6 text-right text-base font-bold">
						{counts.iron}
					</span>
				</div>
			</div>
		</div>
	);
}