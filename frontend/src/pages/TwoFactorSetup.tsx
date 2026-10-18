import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TwoFactorSetup() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const qrCode = (location.state as { qrCode?: string } | null)?.qrCode ?? '';

    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function confirm2FA(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (token.length !== 6) {
            setMessage(t('twoFactorVerificationFailed'));
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/2fa/confirm', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                setMessage(data.message ?? t('twoFactorVerificationFailed'));
                return;
            }

            navigate('/settings/2fa', { replace: true });
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

                {qrCode ? (
                    <>
                        <h2 className="font-bold">{t('scanQrCode')}</h2>

                        <p className="mt-2 text-sm text-white/70">
                            {t('twoFactorScanQr')}
                        </p>

                        <img
                            src={qrCode}
                            alt={t('qrCodeAlt')}
                            className="mx-auto my-4 w-64 rounded-xl bg-white p-2"
                        />

                        <form onSubmit={confirm2FA}>
                            <label htmlFor="setup-token" className="mb-2 block">
                                {t('authenticationCode')}
                            </label>

                            <input
                                id="setup-token"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                required
                                value={token}
                                onChange={(event) =>
                                    setToken(
                                        event.target.value.replace(/\D/g, '')
                                    )
                                }
                                disabled={loading}
                                className="mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[#ffcf5c]"
                            />

                            <button
                                type="submit"
                                disabled={loading || token.length !== 6}
                                className="w-full rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] disabled:opacity-50"
                            >
                                {loading ? t('loading') : t('confirmTwoFactor')}
                            </button>
                        </form>
                    </>
                ) : (
                    <div>
                        <p role="status" className="text-sm text-white/70">
                            {t('twoFactorSetupFailed')}
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate('/settings/2fa')}
                            className="mt-4 w-full rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a]"
                        >
                            {t('back')}
                        </button>
                    </div>
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

                {qrCode && (
                    <button
                        type="button"
                        onClick={() => navigate('/settings/2fa')}
                        disabled={loading}
                        className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 disabled:opacity-50"
                    >
                        {t('back')}
                    </button>
                )}
            </div>
        </div>
    );
}
