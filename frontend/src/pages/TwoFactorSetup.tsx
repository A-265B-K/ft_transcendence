import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TwoFactorSetup() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(false);

    async function setup2FA() {
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                setMessage(data.message ?? t('twoFactorSetupFailed'));
                return;
            }

            setQrCode(data.qrCode);
            setPassword('');
            setMessage(t('twoFactorScanQr'));
        } catch {
            setMessage(t('backendError'));
        } finally {
            setLoading(false);
        }
    }

    async function confirm2FA(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/2fa/confirm', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                setMessage(data.message ?? t('twoFactorVerificationFailed'));
                return;
            }

            setEnabled(true);
            setMessage(t('twoFactorEnabled'));
        } catch {
            setMessage(t('backendError'));
        } finally {
            setLoading(false);
        }
    }

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                setMessage(data.message ?? t('twoFactorDisableFailed'));
                return;
            }

            setEnabled(false);
            setQrCode('');
            setToken('');
            setPassword('');
            setMessage(t('twoFactorDisabled'));
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

                <label htmlFor="setup-password" className="mb-2 block">
                    {t('password')}
                </label>
                <input
                    id="setup-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    className="mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[#ffcf5c]"
                />

                {!enabled && (
                    <>
                        <button
                            type="button"
                            onClick={setup2FA}
                            disabled={loading}
                            className="w-full rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] disabled:opacity-50"
                        >
                            {loading ? t('loading') : t('generateQrCode')}
                        </button>

                        {qrCode && (
                            <>
                                <h2 className="mt-6 font-bold">
                                    {t('scanQrCode')}
                                </h2>
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
                                        {loading ? t('loading') : t('confirmTwoFactor')}
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                )}

                {enabled && (
                    <button
                        type="button"
                        onClick={disable2FA}
                        disabled={loading}
                        className="w-full rounded-xl border border-red-400/40 px-4 py-3 font-bold text-red-300 disabled:opacity-50"
                    >
                        {loading ? t('loading') : t('disableTwoFactor')}
                    </button>
                )}

                {message && (
                    <p role="status" aria-live="polite" className="mt-4 text-sm">
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