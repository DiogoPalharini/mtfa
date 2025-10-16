// Cliente Axios para API Moderna (Stateless)
import axios, { AxiosInstance } from 'axios';

const API_CONFIG = {
  baseUrl: 'https://mtfa.freenetic.ch/pages/login/',
  timeout: 3000, // Reduzido de 5s para 3s
  apiKey: 'gK7@p#R9!zW3*sV5bN8m$qX1aC4dF7hJ',
};

// Criar instância do Axios para API moderna
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': API_CONFIG.apiKey,
  },
});

// Interceptor para logs de debug (apenas em desenvolvimento)
apiClient.interceptors.request.use(
  (config) => {
    // Logs apenas em modo de desenvolvimento
    if (__DEV__) {
      console.log('🌐 API Moderna - Requisição:', {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
    }
    return config;
  },
  (error) => {
    console.error('❌ API Moderna - Erro na requisição:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // Logs apenas em modo de desenvolvimento
    if (__DEV__) {
      console.log('📡 API Moderna - Resposta:', {
        status: response.status,
      });
    }
    return response;
  },
  (error) => {
    console.error('❌ API Moderna - Erro na resposta:', error);
    return Promise.reject(error);
  }
);

export { apiClient, API_CONFIG };
