import { selectFromSession, selectTemporary2FAFromSession } from "../repository/sessionRepository.js"

export async function getCurrentUser(sessionId: string) {
	if (!sessionId) {
		return null;
	}

	const user = await selectFromSession(sessionId);
	return user;
}

export async function getCurrentUserByTemporary2FA(temporary_auth: string) {
	if (!temporary_auth) {
		return null;
	}

	const user = await selectTemporary2FAFromSession(temporary_auth);
	return user;
}