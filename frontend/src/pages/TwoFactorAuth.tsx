import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type TwoFactorAuthProps } from './TwoFactorAuthProps';

export default function TwoFactorAuth({ onLoginSuccess }: TwoFactorAuthProps) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function verify2FA(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (response.ok && data.ok) {
                const sessionResponse = await fetch('/api/auth/me', {
                    credentials: 'include'
                });

                if (!sessionResponse.ok) {
                    setMessage(t('twoFactorVerificationFailed'));
                    return;
                }

                const sessionData = await sessionResponse.json();

                setMessage(t('twoFactorVerified'));

                window.setTimeout(() => {
                    onLoginSuccess(sessionData.user);
                }, 1000);
            } else {
                setMessage(data.message ?? t('twoFactorVerificationFailed'));
            }
        } catch {
            setMessage(t('backendError'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] px-4 text-[#f4f7fb]">
            <form
                onSubmit={verify2FA}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 shadow-2xl"
            >
                <h1 className="mb-6 text-center text-2xl font-bold">
                    {t('twoFactorAuthentication')}
                </h1>

                <label htmlFor="token" className="mb-2 block">
                    {t('authenticationCode')}
                </label>

                <input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={token}
                    onChange={(event) =>
                        setToken(event.target.value.replace(/\D/g, ''))
                    }
                    disabled={loading}
                    className="mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[#ffcf5c]"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] disabled:opacity-50"
                >
                    {loading ? t('loading') : t('verify')}
                </button>

                {message && (
                    <p role="status" className="mt-4 text-sm">
                        {message}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3"
                >
                    {t('back')}
                </button>
            </form>
        </div>
    );
}
