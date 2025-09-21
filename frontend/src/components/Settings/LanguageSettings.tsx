import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const { addToast } = useToastStore();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const languages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸'
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪'
    }
  ];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      setSelectedLanguage(languageCode);

      // Save to localStorage
      localStorage.setItem('i18nextLng', languageCode);

      addToast('success', t('settings.languageChanged'), t('settings.languageChangedMessage'));
    } catch (error) {
      addToast('error', t('settings.languageError'), t('settings.languageErrorMessage'));
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Globe className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('settings.language')}
        </h3>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('settings.languageDescription')}
      </p>

      <div className="space-y-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedLanguage === language.code
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{language.flag}</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {language.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {language.nativeName}
                  </div>
                </div>
              </div>
              {selectedLanguage === language.code && (
                <Check className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}