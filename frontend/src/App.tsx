import GameCanvas from "./pages/GameCanvas";
import Menu from "./pages/Menu";
import Signup from "./pages/SignUp";
import LogIn from "./pages/Login";
import GameMenu from "./pages/GameMenu";
import { useState, useEffect } from "react";
import { type JoinedPayload } from "./types/game";

type User = {
	id: number;
	username: string;
	email: string;
};


export default function App() {

	const [screen, setScreen] = useState<
		"loading" | "menu" | "signup" | "login" | "gameMenu" | "game"
	>("loading");


	const [user, setUser] = useState<User | null>(null);
	const [joinedData, setJoinedData] = useState<JoinedPayload | null>(null);


	useEffect(() => {

		async function checkSession() {

			try {

				const response = await fetch("/me", {
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



	async function logout() {

		await fetch("/logout", {
			method:"POST",
			credentials:"include",
		});


		setUser(null);
		setScreen("menu");

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



	if(screen === "login") {

		return (
			<LogIn

				onBack={() => {
					setScreen("menu");
				}}

				onLoginSuccess={(loggedUser)=>{

					setUser(loggedUser);
					setScreen("gameMenu");

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