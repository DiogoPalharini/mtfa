// src/services/cloudLogin.js (ou .ts)

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CONFIGURAÇÃO ---
const SERVER_CONFIG = {
  // ATENÇÃO: A URL base é a pasta, não o arquivo final.
  baseUrl: 'https://mtfa.freenetic.ch/pages/login/', 
  timeout: 10000,
  apiKey: 'gK7@p#R9!zW3*sV5bN8m$qX1aC4dF7hJ',
};

// --- INTERFACES ---
export interface CloudUser {
  id: number;
  name: string;
  email: string;
  level: string; // O nível geralmente é uma string, como 'Superadmin'
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: CloudUser;
  error?: string;
}

// --- SERVIÇO DE LOGIN ---
class CloudLoginService {
  private apiClient: AxiosInstance;
  private currentUser: CloudUser | null = null;

  constructor() {
    this.apiClient = axios.create({
      baseURL: SERVER_CONFIG.baseUrl,
      timeout: SERVER_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        // A chave de API é adicionada a todas as requisições
        'X-API-KEY': SERVER_CONFIG.apiKey,
      },
    });

    // Tenta carregar o usuário salvo ao iniciar o app
    this.loadUserFromStorage();
  }

  // Carrega o usuário do AsyncStorage para a memória
  private async loadUserFromStorage(): Promise<void> {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
      }
    } catch (error) {
      console.error('Falha ao carregar usuário salvo:', error);
    }
  }

  // Salva o objeto do usuário no AsyncStorage
  private async saveUserToStorage(user: CloudUser): Promise<void> {
    try {
      const userJson = JSON.stringify(user);
      await AsyncStorage.setItem('currentUser', userJson);
      this.currentUser = user;
    } catch (error) {
      console.error('Falha ao salvar usuário:', error);
    }
  }

  // Limpa o usuário salvo (logout)
  public async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('currentUser');
      this.currentUser = null;
    } catch (error) {
      console.error('Falha ao fazer logout:', error);
    }
  }

  // Função principal de login
  public async loginUser(email: string, password: string): Promise<LoginResponse> {
    console.log('🚀 ===== INICIANDO PROCESSO DE LOGIN =====');
    console.log('🌐 URL completa:', SERVER_CONFIG.baseUrl + 'api_login.php');
    console.log('👤 Email:', email);
    console.log('🔒 Senha:', password ? '***' : 'VAZIA');
    
    try {
      const response = await this.apiClient.post<LoginResponse>(
        'api_login.php', // O final da URL
        { email, password }
      );

      console.log('📡 ===== RESPOSTA RECEBIDA =====');
      console.log('📊 Status:', response.status);
      console.log('📋 Headers:', JSON.stringify(response.headers, null, 2));
      console.log('📄 Dados brutos:', response.data);
      console.log('🔍 Tipo dos dados:', typeof response.data);

      // Extrair JSON válido da resposta (pode conter HTML de erro PHP)
      let apiResponse: any;
      
      if (typeof response.data === 'string') {
        console.log('🔧 Extraindo JSON de string com possível HTML...');
        
        // Procurar por JSON válido na string
        const jsonMatch = (response.data as string).match(/\{.*\}/s);
        if (jsonMatch) {
          try {
            apiResponse = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON extraído com sucesso:', apiResponse);
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse do JSON:', parseError);
            throw new Error('Resposta do servidor contém dados inválidos.');
          }
        } else {
          console.error('❌ Nenhum JSON válido encontrado na resposta');
          throw new Error('Resposta do servidor não contém JSON válido.');
        }
      } else {
        apiResponse = response.data;
      }

      console.log('🔍 ===== ANÁLISE DA RESPOSTA =====');
      console.log('✅ Tem success?', 'success' in apiResponse);
      console.log('✅ Success value:', apiResponse?.success);
      console.log('✅ Tem user?', 'user' in apiResponse);
      console.log('✅ Tem error?', 'error' in apiResponse);
      console.log('✅ Error value:', apiResponse?.error);
      console.log('✅ Tem message?', 'message' in apiResponse);
      console.log('✅ Message value:', apiResponse?.message);

      // A API retornou sucesso
      if (apiResponse.success && apiResponse.user) {
        console.log('🎉 LOGIN BEM-SUCEDIDO:', apiResponse.message);
        await this.saveUserToStorage(apiResponse.user);
        return apiResponse;
      } 
      // A API retornou uma falha controlada (ex: senha errada)
      else if (apiResponse.error) {
        console.log('❌ LOGIN FALHOU (API):', apiResponse.error);
        throw new Error(apiResponse.error);
      }
      // A API retornou uma resposta inesperada
      else {
        console.log('❌ RESPOSTA INESPERADA - Estrutura completa:', JSON.stringify(apiResponse, null, 2));
        throw new Error('Resposta inesperada do servidor.');
      }

    } catch (error) {
      console.error('💥 ERRO CAPTURADO NA FUNÇÃO DE LOGIN:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // O servidor respondeu com um status de erro (4xx, 5xx)
          console.error('Erro de resposta do servidor:', error.response.status, error.response.data);
          // A linha abaixo tenta pegar a mensagem de erro do JSON, se existir.
          const serverError = error.response.data?.error || `Erro do servidor (${error.response.status})`;
          throw new Error(serverError);
        } else if (error.request) {
          // A requisição foi feita mas não houve resposta (ex: sem internet)
          throw new Error('Não foi possível conectar ao servidor. Verifique sua internet.');
        }
      }
      
      // Lança o erro para a UI poder tratá-lo
      throw error;
    }
  }

  // Verifica se o usuário está logado (se há dados de usuário em memória)
  public isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  // Retorna os dados do usuário atual
  public getCurrentUser(): CloudUser | null {
    return this.currentUser;
  }
}

// Exporta uma instância única do serviço (Singleton)
export const cloudLoginService = new CloudLoginService();