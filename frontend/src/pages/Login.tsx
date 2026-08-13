import { useState, type CSSProperties, type FormEvent } from "react";
import { connectSocket } from "../socket";

type LoginProps = {
    onBack: () => void;
    onLoginSuccess: (user: {
        id: number;
        username: string;
        email: string;
    }) => void;
};

export default function LogIn({ onBack, onLoginSuccess }: LoginProps) {

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState("");

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
	
		if (!email.trim() || !password.trim()) {
			setStatus("Please fill in all fields.");
			return;
		}

		setStatus("Signing in...");

// calling backend SignIn
		try {
			const response = await fetch("/api/auth/signin", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: email.trim(),
					password,
				}),
			});

			const data = await response.json();

			if (data.requireTwoFactor) {
				window.location.href = "/verify-2fa";
				return;
			}

			if (!response.ok) {
				setStatus(data.message ?? "Login failed");
				return;
			}

			console.log("LOGIN SUCCESS - connecting socket");

			connectSocket();
			onLoginSuccess(data.user);
			setStatus(data.message ?? "Log in successful");

		} catch {
			setStatus("Could not reach the backend Sign up route.");
		}
	}

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "grid",
				placeItems: "center",
				padding: "24px",
				background: "linear-gradient(180deg, #10212a 0%, #081016 100%)",
				color: "#f4f7fb",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: "460px",
					padding: "30px",
					borderRadius: "24px",
					background: "rgba(8, 16, 22, 0.82)",
					border: "1px solid rgba(255,255,255,0.12)",
					boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
					backdropFilter: "blur(14px)",
				}}
			>
				<h2 style={{ marginTop: 0, marginBottom: "8px" }}>Sign in</h2>
				<p style={{ marginTop: 0, marginBottom: "20px", color: "rgba(244,247,251,0.7)" }}>
				</p>

				<form
					onSubmit={handleSubmit}
					style={{ display: "grid", gap: "12px" }}
				>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						style={inputStyle}
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						style={inputStyle}
					/>


					<button type="submit" style={primaryButtonStyle}>
						Sign In
					</button>
				</form>

				{status ? (
					<p style={{ marginTop: "14px", marginBottom: 0, color: "#ffcf5c" }}>
						{status}
					</p>
				) : null}

				<button type="button" onClick={onBack} style={secondaryButtonStyle}>
					Back to menu
				</button>
			</div>
		</div>
	);
}

const inputStyle: CSSProperties = {
	padding: "12px 14px",
	borderRadius: "12px",
	border: "1px solid rgba(255,255,255,0.14)",
	background: "rgba(255,255,255,0.06)",
	color: "#f4f7fb",
	outline: "none",
};

const primaryButtonStyle: CSSProperties = {
	padding: "12px 14px",
	borderRadius: "12px",
	border: "none",
	background: "linear-gradient(135deg, #ffcf5c 0%, #ff9f43 100%)",
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
	border: "1px solid rgba(255,255,255,0.14)",
	background: "transparent",
	color: "#f4f7fb",
	cursor: "pointer",
};