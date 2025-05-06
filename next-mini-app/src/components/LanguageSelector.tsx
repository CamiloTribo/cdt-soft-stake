"use client";

import { useTranslation } from './TranslationProvider';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
      <button
        onClick={() => setLocale('es')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'es' ? 'bg-[#4ebd0a] text-black' : 'bg-transparent text-white hover:bg-gray-700'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'en' ? 'bg-[#4ebd0a] text-black' : 'bg-transparent text-white hover:bg-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  );
}