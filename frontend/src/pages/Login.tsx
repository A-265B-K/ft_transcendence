import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { connectSocket } from "../socket";
import type { LoginProps } from "./loginProps";

export default function LogIn({
	onBack,
	onLoginSuccess,
	onForgotPassword,
}: LoginProps) {
	const { t } = useTranslation();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState("");

	async function handleSubmit(
		e: SubmitEvent,
	) {
		e.preventDefault();

		if (!email.trim() || !password.trim()) {
			setStatus(t("fillAllFields"));
			return;
		}

		setStatus(t("signingIn"));

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
					data.message ?? t("loginFailed"),
				);
				return;
			}

			console.log(
				"LOGIN SUCCESS - connecting socket",
			);

			connectSocket();
			onLoginSuccess(data.user);

			setStatus(
				data.message ?? t("loginSuccessful"),
			);
		} catch {
			setStatus(
				t("backendSignInError"),
			);
		}
	}

	return (
		<div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6 text-[#f4f7fb]">
			<div className="w-full max-w-[460px] rounded-3xl border border-white/10 bg-[#081016]/85 p-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
				<h2 className="mb-2 text-2xl font-bold">
					{t("signIn")}
				</h2>

				<p className="mb-5 text-white/70">
					{t("signInContinue")}
				</p>

				<form
					onSubmit={handleSubmit}
					className="grid gap-3"
				>
					<input
						type="email"
						placeholder={t("email")}
						value={email}
						onChange={(e) =>
							setEmail(e.target.value)
						}
						autoComplete="email"
						className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[#f4f7fb] outline-none placeholder:text-white/40 focus:border-[#ffcf5c]"
					/>

					<input
						type="password"
						placeholder={t("password")}
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
						{t("forgotYourPassword")}
					</button>

					<button
						type="submit"
						className="mt-1 rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110"
					>
						{t("signInButton")}
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
					{t("backToMenu")}
				</button>
			</div>
		</div>
	);
}