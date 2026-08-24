import {
	useState,
	type SubmitEvent,
} from "react";
import type { ForgotPasswordProps } from "./forgotPasswordProps";

export default function ForgotPassword({
	onBack,
}: ForgotPasswordProps) {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(
		e: SubmitEvent
	) {
		e.preventDefault();

		if (!email.trim()) {
			setStatus("Please enter your email.");
			return;
		}

		setLoading(true);
		setStatus("");

		try {
			const response = await fetch(
				"/api/auth/password-reset/request",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: email.trim(),
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				setStatus(
					data.message ??
						"Could not request password reset."
				);
				return;
			}

			setSuccess(true);

			setStatus(
				data.message ??
					"If an account exists for this email, a reset link has been sent."
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
					Forgot password
				</h2>

				<p className="mb-5 text-white/70">
					Enter your email address and we'll
					send you a password reset link.
				</p>

				{!success && (
					<form
						onSubmit={handleSubmit}
						className="grid gap-3"
					>
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) =>
								setEmail(e.target.value)
							}
							autoComplete="email"
							disabled={loading}
							className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c] disabled:cursor-not-allowed disabled:opacity-50"
						/>

						<button
							type="submit"
							disabled={loading}
							className="mt-1 rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading
								? "Sending..."
								: "Send reset link"}
						</button>
					</form>
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

				<button
					type="button"
					onClick={onBack}
					className="mt-3 w-full rounded-xl border border-white/15 bg-transparent px-3.5 py-3 text-[#f4f7fb] transition hover:bg-white/5"
				>
					Back to login
				</button>
			</div>
		</div>
	);
}