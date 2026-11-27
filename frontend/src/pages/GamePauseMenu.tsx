import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePauseMenuProps } from './gamePauseMenuProps';

export default function GamePauseMenu({
    onResume,
    onLeave
}: GamePauseMenuProps) {
    const { t } = useTranslation();

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onResume();
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onResume]);

    const controls = [
        { keys: ['W', 'A', 'S', 'D'], action: t('move') },
        { keys: ['R'], action: t('castleAttack') },
        { keys: ['SPACE'], action: t('weaponAttack') }
    ];

    return (
        <div className="absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#081016]/95 p-8 text-center text-[#f4f7fb] shadow-2xl">
                <h2 className="mb-2 text-2xl font-bold">{t('gameMenu')}</h2>

                <p className="mb-6 text-sm text-white/50">{t('gamePaused')}</p>

                <div className="grid gap-3">
                    <button
                        type="button"
                        onClick={onResume}
                        className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110"
                    >
                        {t('resumeGame')}
                    </button>

                    <button
                        type="button"
                        onClick={onLeave}
                        className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 font-bold text-red-300 transition hover:bg-red-400/20"
                    >
                        {t('leaveGame')}
                    </button>
                </div>

                <div className="mt-7 border-t border-white/10 pt-5">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/60">
                        {t('controls')}
                    </h3>

                    <div className="grid gap-3">
                        {controls.map((control) => (
                            <div
                                key={control.action}
                                className="flex items-center justify-between gap-3"
                            >
                                <span className="text-sm text-white/70">
                                    {control.action}
                                </span>

                                <div className="flex gap-1">
                                    {control.keys.map((key) => (
                                        <span
                                            key={key}
                                            className="flex min-w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs font-bold text-white shadow-sm"
                                        >
                                            {key}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="mt-5 text-xs text-white/30">
                    {t('pressEscToResume')}
                </p>
            </div>
        </div>
    );
}
