import { useState, type SubmitEvent } from "react";
import type { SignupProps } from "./signUpProps";

export default function Signup({ onBack }: SignupProps) {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [status, setStatus] = useState("");

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if ( 
			!username.trim() ||
			!email.trim() ||
			!password.trim() ||
			!confirmPassword.trim()
		) {
			setStatus("Please fill in all fields.");
			return;
		}

		if (password !== confirmPassword) {
			setStatus("Passwords do not match.");
			return;
		}

		if (!acceptedPrivacy) {
			setStatus("You must accept the Privacy Policy.");
			return;
		}

		if (!acceptedTerms) {
			setStatus("You must accept the Terms of Service.");
			return;
		}

		setStatus("Creating account...");

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: username.trim(),
					email: email.trim(),
					password,
					acceptedPrivacy,
					acceptedTerms,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setStatus(data.message ?? "Signup failed");
				return;
			}

			setStatus(data.message ?? "Account created");
		} catch {
			setStatus(
				"Could not reach the backend register route."
			);
		}
	}

	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6 text-[#f4f7fb]">
			<div className="w-full max-w-[460px] rounded-3xl border border-white/10 bg-[#081016]/85 p-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
				<h2 className="mb-2 text-2xl font-bold">
					Create account
				</h2>

				<p className="mb-5 text-white/70">
					Create your account to start playing.
				</p>

				<form
					onSubmit={handleSubmit}
					className="grid gap-3"
				>
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) =>
							setUsername(e.target.value)
						}
						className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c]"
					/>

					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) =>
							setEmail(e.target.value)
						}
						className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c]"
					/>

					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) =>
							setPassword(e.target.value)
						}
						className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c]"
					/>

					<input
						type="password"
						placeholder="Confirm password"
						value={confirmPassword}
						onChange={(e) =>
							setConfirmPassword(e.target.value)
						}
						className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c]"
					/>

					<label className="mt-2 flex items-center gap-2 text-sm text-white/75">
						<input
							type="checkbox"
							checked={acceptedPrivacy}
							onChange={(e) =>
								setAcceptedPrivacy(
									e.target.checked
								)
							}
							className="h-4 w-4 accent-[#ffcf5c]"
						/>

						<span>
							I agree to the{" "}
							<a
								href="/privacy"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#ffcf5c] underline hover:text-[#ff9f43]"
							>
								Privacy Policy
							</a>
						</span>
					</label>

					<label className="flex items-center gap-2 text-sm text-white/75">
						<input
							type="checkbox"
							checked={acceptedTerms}
							onChange={(e) =>
								setAcceptedTerms(
									e.target.checked
								)
							}
							className="h-4 w-4 accent-[#ffcf5c]"
						/>

						<span>
							I agree to the{" "}
							<a
								href="/terms"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#ffcf5c] underline hover:text-[#ff9f43]"
							>
								Terms of Service
							</a>
						</span>
					</label>

					<button
						type="submit"
						disabled={
							!acceptedPrivacy ||
							!acceptedTerms
						}
						className="mt-1 rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Create account
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