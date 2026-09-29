import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { nl } from "./locales/nl";
import { ru } from "./locales/ru";
import { uk } from "./locales/uk";

const savedLanguage =
	localStorage.getItem("language") ?? "en";

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en,
			nl,
			uk,
			ru,
		},
		lng: savedLanguage,
		fallbackLng: "en",
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;