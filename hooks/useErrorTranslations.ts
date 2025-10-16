// Hook para usar traduções de erro
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslatedMessage, ErrorMessages } from '../services/translations';

export function useErrorTranslations() {
  const { language } = useLanguage();
  
  const t = (key: keyof ErrorMessages): string => {
    return getTranslatedMessage(key, language);
  };
  
  return { t, language };
}
