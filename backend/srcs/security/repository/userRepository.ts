import { query } from '../auth/db.js';

// Insertion ..........................................................
export async function insertUser(
    username: string,
    email: string,
    passwordHash: string,
    verification_token_hash: string
) {
    const result = await query(
        `
		INSERT INTO users
		(
			username,
			email,
			password_hash,
			verification_token_hash,
			verification_expires_at
		)
		VALUES
		(
			$1,
			$2,
			$3,
			$4,
			NOW() + INTERVAL '24 hours'
		)
		RETURNING
			id,
			username,
			email,
			email_verified,
			enabled_2FA
		`,
        [username, email, passwordHash, verification_token_hash]
    );
    return result.rows[0];
}

export async function insertUserPasswordVerification(
    email: string,
    password_verification_token_hash: string
) {
    const result = await query(
        `
		UPDATE users
		SET
			password_verification_token_hash = $2,
			password_verification_token_hash_expires_at = NOW() + INTERVAL '5 minutes'
		WHERE email = $1
		RETURNING email, id
		`,
        [email, password_verification_token_hash]
    );
    return result.rows[0];
}

// Search ........................................................................
export async function findUserByEmail(email: string) {
    const result = await query(
        `
		SELECT
			id,
			username,
			email,
			email_verified,
			password_hash,
			enabled_2fa,
			totp_secret,
			failed_login_attempts,
    		login_locked_until
		FROM users
		WHERE email = $1
		`,
        [email]
    );
    return result.rows[0] || null;
}

export async function findUserByVerificationToken(
    verification_token_hash: string
) {
    const result = await query(
        `
		SELECT
			id,
			username,
			email
		FROM users
		WHERE verification_token_hash = $1
		AND verification_expires_at > NOW();
		`,
        [verification_token_hash]
    );
    return result.rows[0] || null;
}

export async function findUserByPasswordResetRequestToken(
    password_reset_token_hash: string
) {
    const result = await query(
        `
		SELECT
			id,
			username,
			email
		FROM users
		WHERE password_verification_token_hash = $1
		AND password_verification_token_hash_expires_at > NOW ();
		`,
        [password_reset_token_hash]
    );
    return result.rows[0] || null;
}

// Modification ..................................................................
export async function changeEmailVerified(userId: number) {
    const result = await query(
        `
		UPDATE users
		SET
			email_verified = TRUE,
			verification_token_hash = NULL,
			verification_expires_at = NULL
		WHERE id = $1
		RETURNING id, email_verified
		`,
        [userId]
    );
    return result.rows[0];
}

export async function addTOTP(email: string, secret: string) {
    const result = await query(
        `
		UPDATE users
		SET
			totp_secret = $2
		WHERE email = $1
		RETURNING id, email
		`,
        [email, secret]
    );
    return result.rows[0];
}

export async function enable2FA(email: string) {
    const result = await query(
        `
		UPDATE users
		SET
			enabled_2fa = TRUE
		WHERE email = $1
		RETURNING id, email, enabled_2fa
		`,
        [email]
    );
    return result.rows[0];
}

export async function disable2FA(email: string) {
    const result = await query(
        `
		UPDATE users
		SET
			enabled_2fa = FALSE,
			totp_secret = NULL
		WHERE email = $1
		RETURNING id, enabled_2fa
		`,
        [email]
    );
    return result.rows[0];
}

export async function updatePassword(email: string, passwordHash: string) {
    const result = await query(
        `
		UPDATE users
		SET
			password_hash = $2
		WHERE email = $1
		RETURNING id
		`,
        [email, passwordHash]
    );
    return result.rows[0];
}

export async function deletePasswordResetToken(email: string) {
    const result = await query(
        `
		UPDATE users
		SET
			password_verification_token_hash = null,
			password_verification_token_hash_expires_at = null
		WHERE email = $1
		RETURNING id
		`,
        [email]
    );
    return result.rows[0];
}

export async function recordFailedLoginAttempt(
    userId: string
): Promise<{ attempts: number; locked: boolean } | null> {
    const result = await query(
        `
        UPDATE users
        SET
            failed_login_attempts =
                CASE
                    WHEN login_locked_until IS NOT NULL
                         AND login_locked_until <= NOW()
                    THEN 1
                    ELSE failed_login_attempts + 1
                END,
            login_locked_until =
                CASE
                    WHEN (
                        CASE
                            WHEN login_locked_until IS NOT NULL
                                 AND login_locked_until <= NOW()
                            THEN 1
                            ELSE failed_login_attempts + 1
                        END
                    ) >= 5
                    THEN NOW() + INTERVAL '5 minutes'
                    ELSE NULL
                END
        WHERE id = $1
          AND (
              login_locked_until IS NULL
              OR login_locked_until <= NOW()
          )
        RETURNING
            failed_login_attempts,
            login_locked_until IS NOT NULL AS locked
        `,
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return {
        attempts: Number(result.rows[0].failed_login_attempts),
        locked: result.rows[0].locked
    };
}

export async function resetFailedLoginAttempts(
    userId: string
): Promise<boolean> {
    const result = await query(
        `
        UPDATE users
        SET
            failed_login_attempts = 0,
            login_locked_until = NULL
        WHERE id = $1
          AND (
              login_locked_until IS NULL
              OR login_locked_until <= NOW()
          )
        RETURNING id
        `,
        [userId]
    );

    return result.rows.length === 1;
}
