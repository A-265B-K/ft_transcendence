import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PasswordResetRequest() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(
                '/api/auth/password-reset/request',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                }
            );

            const data = await response.json();

            setMessage(
                data.message ??
                    (response.ok
                        ? t('passwordResetRequestSent')
                        : t('passwordResetRequestFailed'))
            );
        } catch {
            setMessage(t('backendError'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] px-4 text-[#f4f7fb]">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 shadow-2xl"
            >
                <h1 className="mb-6 text-center text-2xl font-bold">
                    {t('passwordReset')}
                </h1>

                <label htmlFor="reset-email" className="mb-2 block">
                    {t('email')}
                </label>

                <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    className="mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[#ffcf5c]"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] disabled:opacity-50"
                >
                    {loading ? t('loading') : t('sendResetLink')}
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