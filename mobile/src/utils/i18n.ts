import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

const getStoredLanguage = async (): Promise<string> => {
  try {
    const stored = await SecureStore.getItemAsync('userLanguage');
    return stored || 'en';
  } catch {
    return 'en';
  }
};

const initI18n = async () => {
  const language = await getStoredLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export const changeLanguage = async (language: string) => {
  await SecureStore.setItemAsync('userLanguage', language);
  i18n.changeLanguage(language);
};

export default i18n;