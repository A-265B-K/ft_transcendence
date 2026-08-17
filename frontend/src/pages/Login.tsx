import { useState, type FormEvent } from "react";
import { connectSocket } from "../socket";

type LoginProps = {
	onBack: () => void;
	onLoginSuccess: (user: {
		id: number;
		username: string;
		email: string;
	}) => void;
	onForgotPassword: () => void;
};

export default function LogIn({
	onBack,
	onLoginSuccess,
	onForgotPassword,
}: LoginProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState("");

	async function handleSubmit(
		e: FormEvent<HTMLFormElement>,
	) {
		e.preventDefault();

		if (!email.trim() || !password.trim()) {
			setStatus("Please fill in all fields.");
			return;
		}

		setStatus("Signing in...");

		try {
			const response = await fetch(
				"/api/auth/signin",
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: email.trim(),
						password,
					}),
				},
			);

			const data = await response.json();

			if (data.requireTwoFactor) {
				window.location.href = "/verify-2fa";
				return;
			}

			if (!response.ok) {
				setStatus(
					data.message ?? "Login failed",
				);
				return;
			}

			console.log(
				"LOGIN SUCCESS - connecting socket",
			);

			connectSocket();
			onLoginSuccess(data.user);

			setStatus(
				data.message ?? "Log in successful",
			);
		} catch {
			setStatus(
				"Could not reach the backend sign in route.",
			);
		}
	}

	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6 text-[#f4f7fb]">
			<div className="w-full max-w-[460px] rounded-3xl border border-white/10 bg-[#081016]/85 p-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
				<h2 className="mb-2 text-2xl font-bold">
					Sign in
				</h2>

				<p className="mb-5 text-white/70">
					Sign in to continue playing.
				</p>

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
						className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c]"
					/>

					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) =>
							setPassword(e.target.value)
						}
						autoComplete="current-password"
						className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c]"
					/>

					<button
						type="button"
						onClick={onForgotPassword}
						className="self-end border-0 bg-transparent p-0 text-sm text-[#ffcf5c] hover:text-[#ff9f43]"
					>
						Forgot your password?
					</button>

					<button
						type="submit"
						className="mt-1 rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110"
					>
						Sign In
					</button>
				</form>

				{status && (
					<p className="mt-3.5 text-[#ffcf5c]">
						{status}
					</p>
				)}

				<button
					type="button"
					onClick={onBack}
					className="mt-3 w-full rounded-xl border border-white/15 bg-transparent px-3.5 py-3 text-[#f4f7fb] transition hover:bg-white/5"
				>
					Back to menu
				</button>
			</div>
		</div>
	);
}