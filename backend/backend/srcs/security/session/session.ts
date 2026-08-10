import { selectFromSession } from "../repository/sessionRepository.js"

export async function getCurrentUser(sessionId: string) {

	if (!sessionId) {
		return null;
	}

	const user = await selectFromSession(sessionId);

	return user;
}