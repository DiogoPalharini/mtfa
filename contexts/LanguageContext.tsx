import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

export type LanguageCode = 'pt' | 'en' | 'de';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  availableLanguages: { code: LanguageCode; name: string; flag: string }[];
  resetToDeviceLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// Mapeamento de idiomas suportados
const SUPPORTED_LANGUAGES = {
  pt: { name: 'Português', flag: '🇧🇷' },
  en: { name: 'English', flag: '🇺🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
} as const;

// Função para detectar idioma do dispositivo
function detectDeviceLanguage(): LanguageCode {
  try {
    // Tentar diferentes métodos para obter o idioma do dispositivo
    let deviceLocale: string | undefined;
    
    // Método 1: Localization.locale
    if (Localization.locale) {
      deviceLocale = Localization.locale;
    }
    
    // Método 2: Localization.locales (array de locales)
    if (!deviceLocale && Localization.locales && Localization.locales.length > 0) {
      deviceLocale = Localization.locales[0];
    }
    
    // Método 3: Localization.getLocales() se disponível
    if (!deviceLocale && typeof Localization.getLocales === 'function') {
      try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
          deviceLocale = locales[0].languageCode;
        }
      } catch (getLocalesError) {
        // Silenciar erro
      }
    }
    
    if (!deviceLocale) {
      return 'en';
    }
    
    // Extrair código do idioma (ex: 'pt-BR' -> 'pt', 'en-US' -> 'en')
    const languageCode = deviceLocale.split('-')[0].toLowerCase();
    
    // Verificar se é um idioma suportado
    if (languageCode in SUPPORTED_LANGUAGES) {
      return languageCode as LanguageCode;
    }
    
    // Fallback para inglês se não for suportado
    return 'en';
  } catch (error) {
    return 'en'; // Fallback para inglês
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('en'); // Inicializar com inglês temporariamente
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar idioma salvo ou detectar do dispositivo
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // SEMPRE detectar idioma do dispositivo primeiro
        const deviceLanguage = detectDeviceLanguage();
        
        // Verificar se há idioma salvo pelo usuário
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        const savedTimestamp = await AsyncStorage.getItem('languageTimestamp');
        
        // Se não há idioma salvo ou se passou mais de 1 hora desde a última detecção
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hora em millisegundos
        
        if (!savedLanguage || !savedTimestamp || parseInt(savedTimestamp) < oneHourAgo) {
          setLanguage(deviceLanguage);
          await AsyncStorage.setItem('userLanguage', deviceLanguage);
          await AsyncStorage.setItem('languageTimestamp', now.toString());
        } else if (savedLanguage !== deviceLanguage) {
          setLanguage(deviceLanguage);
          await AsyncStorage.setItem('userLanguage', deviceLanguage);
          await AsyncStorage.setItem('languageTimestamp', now.toString());
        } else {
          setLanguage(savedLanguage as LanguageCode);
        }
      } catch (error) {
        // Fallback para inglês
        setLanguage('en');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  // Salvar idioma quando mudado pelo usuário
  const handleSetLanguage = async (lang: LanguageCode) => {
    try {
      setLanguage(lang);
      await AsyncStorage.setItem('userLanguage', lang);
    } catch (error) {
      // Silenciar erro
    }
  };

  const availableLanguages = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code: code as LanguageCode,
    name: info.name,
    flag: info.flag,
  }));

  // Função para resetar para o idioma do dispositivo
  const resetToDeviceLanguage = async () => {
    try {
      const deviceLanguage = detectDeviceLanguage();
      await AsyncStorage.setItem('userLanguage', deviceLanguage);
      setLanguage(deviceLanguage);
    } catch (error) {
      // Silenciar erro
    }
  };

  const value = useMemo(() => ({ 
    language, 
    setLanguage: handleSetLanguage,
    availableLanguages,
    resetToDeviceLanguage
  }), [language]);

  // Não renderizar até que o idioma seja inicializado
  if (!isInitialized) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage deve ser usado dentro de LanguageProvider');
  return ctx;
}
