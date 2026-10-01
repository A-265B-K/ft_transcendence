import { useTranslation } from 'react-i18next';
import { type MenuProps } from './menuProps';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Menu({ onCreateAccount, onLogin }: MenuProps) {
    const { t } = useTranslation();

    return (
        <div className="relative grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] p-6">
            <div className="absolute right-6 top-6">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#081016]/85 p-7 text-[#f4f7fb] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[14px]">
                <h2 className="mb-2 text-2xl font-bold">{t('readyToPlay')}</h2>

                <p className="mb-5 text-white/70">{t('createOrSignIn')}</p>

                <div className="flex flex-col gap-2.5">
                    <button
                        type="button"
                        onClick={onCreateAccount}
                        className="rounded-xl bg-linear-to-br from-[#ffcf5c] to-[#ff9f43] px-3.5 py-3 font-bold text-[#10212a] transition hover:brightness-110"
                    >
                        {t('createAccount')}
                    </button>

                    <button
                        type="button"
                        onClick={onLogin}
                        className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-3 font-semibold text-[#f4f7fb] transition hover:bg-white/[0.08]"
                    >
                        {t('signIn')}
                    </button>
                </div>
            </div>
        </div>
    );
}
