import { useState, type CSSProperties, type FormEvent } from "react";

type LoginProps = {
	onBack: () => void;
};

export default function Login({ onBack }: LoginProps) {
	//const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState("");

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

// !username.trim() ||
		if (!email.trim() || !password.trim()) {
			setStatus("Please fill in all fields.");
			return;
		}

		setStatus("Creating account...");

// calling backend SignIn
		try {
			console.log("[frontend] sending signin request");
			const response = await fetch("/signin", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: username.trim(),
					email: email.trim(),
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setStatus(data.message ?? "Signup failed");
				return;
			}

			setStatus(data.message ?? "Account created");
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
					{/*<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						style={inputStyle}
					/>*/}
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