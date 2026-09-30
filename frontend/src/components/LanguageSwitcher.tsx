import i18n from '../i18n';

export default function LanguageSwitcher() {
    return (
        <select
            value={i18n.language}
            onChange={(event) => {
                const language = event.target.value;

                i18n.changeLanguage(language);
                localStorage.setItem('language', language);
            }}
            className="rounded-xl border border-white/15 bg-[#0a1016]/75 px-3 py-2 text-sm font-bold text-white"
        >
            <option value="en">🇬🇧 English</option>
            <option value="nl">🇳🇱 Nederlands</option>
            <option value="uk">🇺🇦 Українська</option>
            <option value="ru">🇷🇺 Русский</option>
        </select>
    );
}
