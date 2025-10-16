// Cliente Axios para Sistema Legado (Stateful)
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_CONFIG = {
  baseUrl: 'https://mtfa.freenetic.ch',
  timeout: 5000, // Reduzido de 8s para 5s
};

// Criar instância do Axios para sistema legado
const legacyApiClient: AxiosInstance = axios.create({
  baseURL: LEGACY_CONFIG.baseUrl,
  timeout: LEGACY_CONFIG.timeout,
  maxRedirects: 0, // Não seguir redirecionamentos
  validateStatus: (status) => {
    // Aceitar status 200 e 302 como válidos
    return status === 200 || status === 302;
  },
});

// Interceptor para adicionar cookie PHPSESSID automaticamente
legacyApiClient.interceptors.request.use(
  async (config) => {
    try {
      // Ler cookie PHPSESSID do AsyncStorage
      const sessionCookie = await AsyncStorage.getItem('PHPSESSID');
      
      if (sessionCookie) {
        config.headers.Cookie = sessionCookie;
        if (__DEV__) {
          console.log('🍪 Sistema Legado - Cookie adicionado');
        }
      } else if (__DEV__) {
        console.warn('⚠️ Sistema Legado - Nenhum cookie PHPSESSID encontrado');
      }
    } catch (error) {
      console.error('❌ Sistema Legado - Erro ao carregar cookie:', error);
    }
    
    // Logs apenas em modo de desenvolvimento
    if (__DEV__) {
      console.log('🌐 Sistema Legado - Requisição:', {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Sistema Legado - Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
legacyApiClient.interceptors.response.use(
  (response) => {
    // Logs apenas em modo de desenvolvimento
    if (__DEV__) {
      console.log('📡 Sistema Legado - Resposta:', {
        status: response.status,
      });
    }
    return response;
  },
  (error) => {
    console.error('❌ Sistema Legado - Erro na resposta:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status && error.response.status >= 500) {
        throw new Error('Erro interno do servidor. Tente novamente.');
      } else if (!error.response) {
        throw new Error('Sem conexão com o servidor. Verifique sua internet.');
      }
    }
    
    return Promise.reject(error);
  }
);

export { legacyApiClient, LEGACY_CONFIG };
