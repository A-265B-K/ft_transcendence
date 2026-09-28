import GameCanvas from "./pages/GameCanvas";
import Menu from "./pages/Menu";
import Signup from "./pages/SignUp";
import LogIn from "./pages/Login";
import GameMenu from "./pages/GameMenu";
import Disconnected from "./pages/Disconnected";
import { useState, useEffect } from "react";
import { type JoinedPayload } from "./types/game";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { disconnectSocket } from "./socket";

type User = {
	id: number;
	username: string;
	email: string;
};

export default function App() {

	const [screen, setScreen] = useState<
			| "loading" 
			| "menu" 
			| "signup" 
			| "login" 
			| "gameMenu" 
			| "game" 
			| "forgotPassword" 
			| "resetPassword" 
			| "disconnected"
	>("loading");

	const [user, setUser] = useState<User | null>(null);
	const [joinedData, setJoinedData] = useState<JoinedPayload | null>(null);

	useEffect(() => {
		const path = window.location.pathname;

		if (path === "/reset-password") {
			setScreen("resetPassword");
			return;
		}

		async function checkSession() {
			try {
				const response = await fetch("/api/auth/me", {
					credentials: "include",
				});
				if (response.ok) {

					const data = await response.json();

					console.log(
						"Restored session:",
						data.user
					);
					setUser(data.user);
					setScreen("gameMenu");
					return;
				}
			} catch(error) {
				console.log(
					"Session check failed",
					error
				);
			}
			setScreen("menu");
		}
		checkSession();
	}, []);

	useEffect(() => {
		if (!user) {
			return;
		}

		let stopped = false;
		let failedChecks = 0;

		async function checkServer() {
			const controller = new AbortController();

			// Allow requests up to 2 seconds
			const timeout = window.setTimeout(() => {
				controller.abort();
			}, 2000);

			try {
				const response = await fetch("/api/ping", {
					method: "GET",
					cache: "no-store",
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error(`Health check failed: ${response.status}`);
				}

				failedChecks = 0;
			} catch (error) {
				failedChecks += 1;

				console.error(
					`Health check failed ${failedChecks} time(s):`,
					error
				);

				// Three failures × two seconds between checks
				if (failedChecks >= 3 && !stopped) {
					setUser(null);
					setJoinedData(null);
					setScreen("disconnected");
					disconnectSocket();
				}
			} finally {
				window.clearTimeout(timeout);
			}
		}

		checkServer();

		const interval = window.setInterval(checkServer, 2000);

		return () => {
			stopped = true;
			window.clearInterval(interval);
		};
	}, [user]);



	async function logout() {
		await fetch("/api/auth/logout", {
			method:"POST",
			credentials:"include",
		});
		setUser(null);
		setScreen("menu");
	}

	if (screen === "disconnected") {
		return (
			<Disconnected/>
		);	
	}

	if(screen === "loading") {
		return (
			<div>
				Checking session...
			</div>
		);
	}

	if(screen === "menu") {
		return (
			<Menu
				onCreateAccount={() => {
					setScreen("signup");
				}}
				onLogin={() => {
					setScreen("login");
				}}
			/>
		);
	}

	if(screen === "signup") {
		return (
			<Signup
				onBack={() => {
					setScreen("menu");
				}}
			/>
		);
	}

	if (screen === "login") {
		return (
			<LogIn
				onBack={() => {
					setScreen("menu");
				}}
				onLoginSuccess={(loggedUser) => {
					setUser(loggedUser);
					setScreen("gameMenu");
				}}
				onForgotPassword={() => {
					setScreen("forgotPassword");
				}}
			/>
		);
	}

	if (screen === "forgotPassword") {
		return (
			<ForgotPassword
				onBack={() => {
					setScreen("login");
				}}
			/>
		);
	}

	if (screen === "resetPassword") {
	return (
		<ResetPassword
			onBack={() => {
				setScreen("login");
			}}
		/>
		);
	}

	if(screen === "gameMenu" && user) {
		return (
			<GameMenu
			user={user}
			onStartGame={(data)=>{
				setJoinedData(data);
				setScreen("game");
			}}
			onLogout={logout}
			/>
		);
	}

	if(screen === "game" && user && joinedData) {
		return (
			<GameCanvas
				joinedData={joinedData}
			/>
		);
	}

	return null;
}