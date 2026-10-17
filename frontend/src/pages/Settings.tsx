import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Settings() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] px-4 text-[#f4f7fb]">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 shadow-2xl backdrop-blur-md">
                <h1 className="mb-6 text-center text-2xl font-bold">
                    {t('settings')}
                </h1>

                <div className="grid gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/settings/2fa')}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10"
                    >
                        {t('twoFactorAuthentication')}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/settings/password-reset')}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10"
                    >
                        {t('passwordReset')}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/game-menu')}
                        className="mt-3 rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110"
                    >
                        {t('back')}
                    </button>
                </div>
            </div>
        </div>
    );
}
