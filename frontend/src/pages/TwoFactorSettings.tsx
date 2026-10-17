import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TwoFactorSettings() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function loadStatus() {
            try {
                const response = await fetch('/api/auth/2fa/status', {
                    credentials: 'include'
                });

                const data = await response.json();

                if (!response.ok || !data.ok) {
                    setMessage(data.message ?? t('backendError'));
                    return;
                }

                setEnabled(Boolean(data.user.enabled2FA));
            } catch {
                setMessage(t('backendError'));
            }
        }

        loadStatus();
    }, [t]);

    async function disable2FA() {
        if (!password) {
            setMessage(t('fillAllFields'));
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                setMessage(data.message ?? t('twoFactorDisableFailed'));
                return;
            }

            setEnabled(false);
            setPassword('');
            setMessage(t('twoFactorDisabled'));
        } catch {
            setMessage(t('backendError'));
        } finally {
            setLoading(false);
        }
    }

    async function start2FASetup() {
        if (!password) {
            setMessage(t('fillAllFields'));
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                setMessage(data.message ?? t('twoFactorSetupFailed'));
                return;
            }

            navigate('/settings/2fa/setup', {
                state: { qrCode: data.qrCode }
            });
        } catch {
            setMessage(t('backendError'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] px-4 py-8 text-[#f4f7fb]">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 shadow-2xl">
                <h1 className="mb-6 text-center text-2xl font-bold">
                    {t('twoFactorAuthentication')}
                </h1>

                {enabled === null ? (
                    <p role="status">{t('loading')}</p>
                ) : (
                    <>
                        <p className="mb-4 text-sm text-white/70">
                            {enabled
                                ? t('twoFactorEnabled')
                                : t('twoFactorDisabled')}
                        </p>

                        <label htmlFor="password" className="mb-2 block">
                            {t('password')}
                        </label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            disabled={loading}
                            className="mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[#ffcf5c]"
                        />

                        {enabled ? (
                            <button
                                type="button"
                                onClick={disable2FA}
                                disabled={loading || !password}
                                className="w-full rounded-xl border border-red-400/40 px-4 py-3 font-bold text-red-300 disabled:opacity-50"
                            >
                                {loading ? t('loading') : t('disableTwoFactor')}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={start2FASetup}
                                disabled={loading || !password}
                                className="w-full rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] disabled:opacity-50"
                            >
                                {loading ? t('loading') : t('generateQrCode')}
                            </button>
                        )}
                    </>
                )}

                {message && (
                    <p
                        role="status"
                        aria-live="polite"
                        className="mt-4 text-sm"
                    >
                        {message}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3"
                >
                    {t('back')}
                </button>
            </div>
        </div>
    );
}
