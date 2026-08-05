import bcrypt from "bcrypt";
import { insertUser } from "../repository/userRepository.js";


export async function registerUser(payload) {

	const { username, email, password } = payload;


	if (!username || !email || !password) {

		return {
			ok:false,
			statusCode:400,
			message:"Missing fields",
		};
	}


	try {

		const passwordHash = await bcrypt.hash(
			password,
			12
		);


		const user = await insertUser(
			username,
			email,
			passwordHash
		);


		return {
			ok:true,
			statusCode:201,
			message:"User registered",
			user,
		};


	} catch(error) {


		if (error.code === "23505") {

			return {
				ok:false,
				statusCode:409,
				message:"Email already exists",
			};
		}


		console.error(
			"[auth.registerUser] failed:",
			error
		);


		return {
			ok:false,
			statusCode:500,
			message:"Database insert failed",
		};
	}
}