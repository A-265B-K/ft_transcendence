import { selectFromSession, selectTemporary2FAFromSession } from "../repository/sessionRepository.js"

export async function getCurrentUser(session_id_hash: string) {
	if (!session_id_hash) {
		return null;
	}

	const user = await selectFromSession(session_id_hash);
	return user;
}

export async function getCurrentUserByTemporary2FA(temporary_auth_hash: string) {
	if (!temporary_auth_hash) {
		return null;
	}

	const user = await selectTemporary2FAFromSession(temporary_auth_hash);
	return user;
}