import {
	useState,
	type SubmitEvent,
} from "react";

import type { ResetPasswordProps } from "./resetPasswordProps";

export default function ResetPassword({
	onBack,
}: ResetPasswordProps) {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [status, setStatus] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(
		e: SubmitEvent
	) {
		e.preventDefault();

		if (!password || !confirmPassword) {
			setStatus("Please fill in all fields.");
			return;
		}

		if (password !== confirmPassword) {
			setStatus("Passwords do not match.");
			return;
		}

		const params = new URLSearchParams(
			window.location.search
		);

		const token = params.get("token");

		if (!token) {
			setStatus(
				"Invalid or missing password reset token."
			);
			return;
		}

		setLoading(true);
		setStatus("");

		try {
			const response = await fetch(
				"/api/auth/password-reset",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						token,
						password,
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				setStatus(
					data.message ??
						"Password reset failed."
				);
				return;
			}

			setSuccess(true);

			setStatus(
				data.message ??
					"Password reset successfully."
			);
		} catch {
			setStatus(
				"Could not reach the backend."
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6 text-[#f4f7fb]">
			<div className="w-full max-w-[460px] rounded-3xl border border-white/10 bg-[#081016]/85 p-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
				<h2 className="mb-2 text-2xl font-bold">
					Reset password
				</h2>

				{!success && (
					<>
						<p className="mb-5 text-white/70">
							Enter your new password below.
						</p>

						<form
							onSubmit={handleSubmit}
							className="grid gap-3"
						>
							<input
								type="password"
								placeholder="New password"
								value={password}
								onChange={(e) =>
									setPassword(
										e.target.value
									)
								}
								autoComplete="new-password"
								disabled={loading}
								className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c] disabled:cursor-not-allowed disabled:opacity-50"
							/>

							<input
								type="password"
								placeholder="Confirm new password"
								value={confirmPassword}
								onChange={(e) =>
									setConfirmPassword(
										e.target.value
									)
								}
								autoComplete="new-password"
								disabled={loading}
								className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c] disabled:cursor-not-allowed disabled:opacity-50"
							/>

							<button
								type="submit"
								disabled={loading}
								className="mt-1 rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loading
									? "Resetting..."
									: "Reset password"}
							</button>
						</form>
					</>
				)}

				{status && (
					<p
						className={`mt-3.5 ${
							success
								? "text-[#8ee6a8]"
								: "text-[#ffcf5c]"
						}`}
					>
						{status}
					</p>
				)}

				{success ? (
					<button
						type="button"
						onClick={onBack}
						className="mt-3 w-full rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110"
					>
						Back to main menu
					</button>
				) : (
					<button
						type="button"
						onClick={onBack}
						className="mt-3 w-full rounded-xl border border-white/15 bg-transparent px-3.5 py-3 text-[#f4f7fb] transition hover:bg-white/5"
					>
						Back
					</button>
				)}
			</div>
		</div>
	);
}