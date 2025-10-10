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
    console.log('🔍 Iniciando detecção de idioma do dispositivo...');
    
    // Tentar diferentes métodos para obter o idioma do dispositivo
    let deviceLocale: string | undefined;
    
    // Método 1: Localization.locale
    if (Localization.locale) {
      deviceLocale = Localization.locale;
      console.log('✅ Idioma encontrado via Localization.locale:', deviceLocale);
    }
    
    // Método 2: Localization.locales (array de locales)
    if (!deviceLocale && Localization.locales && Localization.locales.length > 0) {
      deviceLocale = Localization.locales[0];
      console.log('✅ Idioma encontrado via Localization.locales:', deviceLocale);
    }
    
    // Método 3: Localization.getLocales() se disponível
    if (!deviceLocale && typeof Localization.getLocales === 'function') {
      try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
          deviceLocale = locales[0].languageCode;
          console.log('✅ Idioma encontrado via Localization.getLocales():', deviceLocale);
        }
      } catch (getLocalesError) {
        console.log('⚠️ Erro ao usar getLocales():', getLocalesError);
      }
    }
    
    console.log('🌍 Idioma final detectado:', deviceLocale);
    
    if (!deviceLocale) {
      console.log('⚠️ Não foi possível detectar idioma do dispositivo, usando inglês como fallback');
      return 'en';
    }
    
    // Extrair código do idioma (ex: 'pt-BR' -> 'pt', 'en-US' -> 'en')
    const languageCode = deviceLocale.split('-')[0].toLowerCase();
    console.log('🔤 Código do idioma extraído:', languageCode);
    
    // Verificar se é um idioma suportado
    if (languageCode in SUPPORTED_LANGUAGES) {
      console.log('✅ Idioma suportado encontrado:', languageCode);
      return languageCode as LanguageCode;
    }
    
    // Fallback para inglês se não for suportado
    console.log('⚠️ Idioma não suportado, usando inglês como fallback');
    return 'en';
  } catch (error) {
    console.error('❌ Erro ao detectar idioma do dispositivo:', error);
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
        console.log('🌍 Idioma do dispositivo detectado:', deviceLanguage);
        
        // Verificar se há idioma salvo pelo usuário
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        const savedTimestamp = await AsyncStorage.getItem('languageTimestamp');
        
        // Se não há idioma salvo ou se passou mais de 1 hora desde a última detecção
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hora em millisegundos
        
        if (!savedLanguage || !savedTimestamp || parseInt(savedTimestamp) < oneHourAgo) {
          console.log('🔄 Detectando idioma do dispositivo (primeira vez ou após 1 hora)');
          setLanguage(deviceLanguage);
          await AsyncStorage.setItem('userLanguage', deviceLanguage);
          await AsyncStorage.setItem('languageTimestamp', now.toString());
        } else if (savedLanguage !== deviceLanguage) {
          console.log('📱 Idioma do dispositivo mudou. Atualizando de', savedLanguage, 'para', deviceLanguage);
          setLanguage(deviceLanguage);
          await AsyncStorage.setItem('userLanguage', deviceLanguage);
          await AsyncStorage.setItem('languageTimestamp', now.toString());
        } else {
          console.log('📱 Usando idioma salvo (igual ao dispositivo):', savedLanguage);
          setLanguage(savedLanguage as LanguageCode);
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar idioma:', error);
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
      console.log('💾 Idioma salvo pelo usuário:', lang);
    } catch (error) {
      console.error('❌ Erro ao salvar idioma:', error);
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
      console.log('🔄 Resetando para idioma do dispositivo...');
      const deviceLanguage = detectDeviceLanguage();
      await AsyncStorage.setItem('userLanguage', deviceLanguage);
      setLanguage(deviceLanguage);
      console.log('✅ Resetado para idioma do dispositivo:', deviceLanguage);
    } catch (error) {
      console.error('❌ Erro ao resetar para idioma do dispositivo:', error);
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
