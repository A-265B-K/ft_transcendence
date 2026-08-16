import {
	useState,
	type CSSProperties,
	type FormEvent,
} from "react";

type ResetPasswordProps = {
	onBack: () => void;
};

export default function ResetPassword({
	onBack,
}: ResetPasswordProps) {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [status, setStatus] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(
		e: FormEvent<HTMLFormElement>
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
		<div
			style={{
				minHeight: "100vh",
				display: "grid",
				placeItems: "center",
				padding: "24px",
				background:
					"linear-gradient(180deg, #10212a 0%, #081016 100%)",
				color: "#f4f7fb",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: "460px",
					padding: "30px",
					borderRadius: "24px",
					background:
						"rgba(8, 16, 22, 0.82)",
					border:
						"1px solid rgba(255,255,255,0.12)",
					boxShadow:
						"0 20px 60px rgba(0,0,0,0.35)",
					backdropFilter: "blur(14px)",
				}}
			>
				<h2
					style={{
						marginTop: 0,
						marginBottom: "8px",
					}}
				>
					Reset password
				</h2>

				{!success ? (
					<>
						<p
							style={{
								marginTop: 0,
								marginBottom: "20px",
								color:
									"rgba(244,247,251,0.7)",
							}}
						>
							Enter your new password below.
						</p>

						<form
							onSubmit={handleSubmit}
							style={{
								display: "grid",
								gap: "12px",
							}}
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
								style={inputStyle}
								autoComplete="new-password"
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
								style={inputStyle}
								autoComplete="new-password"
							/>

							<button
								type="submit"
								style={primaryButtonStyle}
								disabled={loading}
							>
								{loading
									? "Resetting..."
									: "Reset password"}
							</button>
						</form>
					</>
				) : null}

				{status ? (
					<p
						style={{
							marginTop: "14px",
							marginBottom: 0,
							color: success
								? "#8ee6a8"
								: "#ffcf5c",
						}}
					>
						{status}
					</p>
				) : null}

				{success ? (
					<button
						type="button"
						onClick={onBack}
						style={primaryButtonStyle}
					>
						Back to main menu
					</button>
				) : (
					<button
						type="button"
						onClick={onBack}
						style={secondaryButtonStyle}
					>
						Back
					</button>
				)}
			</div>
		</div>
	);
}

const inputStyle: CSSProperties = {
	padding: "12px 14px",
	borderRadius: "12px",
	border:
		"1px solid rgba(255,255,255,0.14)",
	background: "rgba(255,255,255,0.06)",
	color: "#f4f7fb",
	outline: "none",
};

const primaryButtonStyle: CSSProperties = {
	padding: "12px 14px",
	borderRadius: "12px",
	border: "none",
	background:
		"linear-gradient(135deg, #ffcf5c 0%, #ff9f43 100%)",
	color: "#10212a",
	fontWeight: 700,
	cursor: "pointer",
	marginTop: "4px",
};

const secondaryButtonStyle: CSSProperties = {
	marginTop: "12px",
	width: "100%",
	padding: "12px 14px",
	borderRadius: "12px",
	border:
		"1px solid rgba(255,255,255,0.14)",
	background: "transparent",
	color: "#f4f7fb",
	cursor: "pointer",
};