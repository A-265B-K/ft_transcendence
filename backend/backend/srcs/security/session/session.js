import { selectFromSession } from "../repository/sessionRepository.js"

export async function getCurrentUser(sessionId) {

	if (!sessionId) {
		return null;
	}

	const user = await selectFromSession(sessionId);

	return user;
}