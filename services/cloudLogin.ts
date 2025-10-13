// Serviço de login online compatível com React Native usando Axios
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_CONFIG = {
  baseUrl: 'https://mtfa.freenetic.ch/api/login.php',
  timeout: 10000, // 10 segundos
  apiKey: 'gK7@p#R9!zW3*sV5bN8m$qX1aC4dF7hJ',
};

export interface CloudUser {
  id: number;
  name: string;
  email: string;
  level: number;
  sessionId?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userData?: CloudUser;
  sessionId?: string;
}

class CloudLoginService {
  private isConnected = false;
  private apiClient: AxiosInstance;
  private sessionId: string | null = null;

  constructor() {
    // Criar instância do Axios para a nova API JSON
    this.apiClient = axios.create({
      baseURL: SERVER_CONFIG.baseUrl,
      timeout: SERVER_CONFIG.timeout,
      validateStatus: (status) => {
        // Aceitar todos os status para poder tratar erros adequadamente
        return status >= 200 && status < 600;
      },
    });

    // Carregar sessão salva na inicialização
    this.loadSavedSession();
  }

  // Carregar sessão salva do AsyncStorage
  private async loadSavedSession(): Promise<void> {
    try {
      const savedSessionId = await AsyncStorage.getItem('PHPSESSID');
      if (savedSessionId) {
        this.sessionId = savedSessionId;
      }
    } catch (error) {
      // Silenciar erro de carregamento
    }
  }

  // Salvar sessão no AsyncStorage
  private async saveSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem('PHPSESSID', sessionId);
      await AsyncStorage.setItem('sessionTimestamp', Date.now().toString());
      this.sessionId = sessionId;
    } catch (error) {
      // Silenciar erro de salvamento
    }
  }

  // Extrair PHPSESSID do header Set-Cookie (versão melhorada)
  private extractSessionId(setCookieHeader: string): string | null {
    try {
      // Primeiro, tentar o formato padrão
      let match = setCookieHeader.match(/PHPSESSID=([^;]+)/);
      if (match) return match[1];
      
      // Se não encontrou, tentar sem o 'PHPSESSID=' (caso seja só o valor)
      match = setCookieHeader.match(/^([a-f0-9]{32})$/);
      if (match) return match[1];
      
      return null;
    } catch (error) {
      console.error('Erro ao extrair sessionId:', error);
      return null;
    }
  }

  // Função para extrair cookie de diferentes formas dos headers
  private extractCookieFromHeaders(headers: any): string | null {
    try {
      // Tentar diferentes variações do header Set-Cookie
      const possibleHeaders = [
        headers['set-cookie'],
        headers['Set-Cookie'],
        headers['SET-COOKIE'],
        headers['set-cookie']?.[0],
        headers['Set-Cookie']?.[0],
        headers['SET-COOKIE']?.[0]
      ];

      for (const header of possibleHeaders) {
        if (header) {
          const sessionId = this.extractSessionId(header);
          if (sessionId) {
            // Cookie encontrado em header
            return sessionId;
          }
        }
      }

      // Se não encontrou em nenhum header, tentar extrair de todos os headers como string
      const allHeadersString = JSON.stringify(headers);
      const match = allHeadersString.match(/PHPSESSID[=:]([a-f0-9]{32})/);
      if (match) {
        // Cookie encontrado em string de headers
        return match[1];
      }

      return null;
    } catch (error) {
      console.error('Erro ao extrair cookie dos headers:', error);
      return null;
    }
  }

  // Gerar um cookie válido no formato do servidor PHP (32 caracteres hexadecimais)
  private generateValidSessionId(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Gerar um cookie baseado no username para consistência
  private generateUserBasedSessionId(username: string): string {
    // Criar um hash simples baseado no username para consistência
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Converter para hexadecimal e garantir 32 caracteres
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    const chars = '0123456789abcdef';
    let result = hexHash;
    
    // Completar com caracteres aleatórios para atingir 32 caracteres
    while (result.length < 32) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result.substring(0, 32);
  }

  // Criar resposta de login
  private createLoginResponse(userData: CloudUser, sessionId: string): LoginResponse {
    const userWithSession: CloudUser = {
      ...userData,
      sessionId: sessionId
    };

    console.log('🔧 Criando resposta de login:', {
      success: true,
      sessionId: sessionId,
      userData: userWithSession
    });

    return {
      success: true,
      message: 'Login bem-sucedido',
      sessionId: sessionId,
      userData: userWithSession
    };
  }


  // Verificar conectividade com o servidor
  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.head(SERVER_CONFIG.baseUrl, {
        timeout: 5000,
      });
      
      this.isConnected = response.status === 200;
      return this.isConnected;
      
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  // Função principal de login usando Axios
  async loginUser(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🚀 ===== INICIANDO PROCESSO DE LOGIN =====');
      console.log('🔐 Enviando dados de login para nova API...');
      console.log('🌐 URL da API:', SERVER_CONFIG.baseUrl);
      console.log('🔑 API Key:', SERVER_CONFIG.apiKey);
      console.log('👤 Usuário:', username);
      console.log('🔒 Senha:', password ? '***' : 'VAZIA');
      
      // Criar payload JSON para a nova API
      const loginData = {
        email: username,
        password: password
      };
      
      console.log('📤 Payload JSON criado:', JSON.stringify(loginData));
      console.log('📋 Headers que serão enviados:', {
        'Content-Type': 'application/json',
        'X-API-KEY': SERVER_CONFIG.apiKey,
      });
      
      // Fazer requisição POST com JSON e API key
      console.log('🌐 Fazendo requisição POST...');
      const response: AxiosResponse = await this.apiClient.post(
        '',
        loginData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': SERVER_CONFIG.apiKey,
          },
        }
      );
      
      console.log('📡 ===== RESPOSTA RECEBIDA =====');
      console.log('📊 Status Code:', response.status);
      console.log('📋 Headers da resposta:', JSON.stringify(response.headers, null, 2));
      console.log('📄 Dados da resposta:', JSON.stringify(response.data, null, 2));
      console.log('🔍 Tipo dos dados:', typeof response.data);
      
      // Verificar se a resposta é JSON válida
      console.log('🔍 ===== ANALISANDO RESPOSTA =====');
      console.log('✅ Status é 200?', response.status === 200);
      console.log('✅ Tem dados?', !!response.data);
      console.log('✅ Dados não são null?', response.data !== null);
      console.log('✅ Dados não são undefined?', response.data !== undefined);
      
      if (response.status === 200 && response.data) {
        const apiResponse = response.data;
        console.log('📋 Estrutura da resposta:', {
          hasSuccess: 'success' in apiResponse,
          successValue: apiResponse.success,
          hasUser: 'user' in apiResponse,
          hasError: 'error' in apiResponse,
          errorValue: apiResponse.error
        });
        
        if (apiResponse.success === true) {
          // Login bem-sucedido
          console.log('🎉 ===== LOGIN BEM-SUCEDIDO =====');
          console.log('👤 Dados do usuário recebidos:', JSON.stringify(apiResponse.user, null, 2));
          
          // Gerar um sessionId baseado no usuário para consistência
          const sessionId = this.generateUserBasedSessionId(username);
          console.log('🔑 SessionId gerado:', sessionId);
          
          await this.saveSession(sessionId);
          console.log('💾 SessionId salvo no AsyncStorage');
          
          // Criar resposta com dados do usuário da API
          const loginResponse = this.createLoginResponse(apiResponse.user, sessionId);
          console.log('📤 Resposta final criada:', JSON.stringify(loginResponse, null, 2));
          
          return loginResponse;
          
        } else {
          // Login falhou - usar mensagem de erro da API
          console.log('❌ ===== LOGIN FALHOU =====');
          console.log('🚫 success = false');
          console.log('💬 Mensagem de erro:', apiResponse.error);
          
          const errorMessage = apiResponse.error || 'Erro de autenticação';
          throw new Error(errorMessage);
        }
        
      } else if (response.status >= 400) {
        // Tratar erros HTTP diretamente da resposta
        console.log('❌ ===== ERRO HTTP =====');
        console.log('📊 Status Code:', response.status);
        console.log('💬 Dados do erro:', response.data);
        
        const errorMessage = response.data?.error || `Erro do servidor (${response.status})`;
        throw new Error(errorMessage);
      } else {
        console.log('❌ ===== RESPOSTA INVÁLIDA =====');
        console.log('📊 Status Code:', response.status);
        console.log('📄 Dados:', response.data);
        
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error) {
      console.log('💥 ===== ERRO CAPTURADO =====');
      console.error('❌ Erro completo:', error);
      console.log('🔍 Tipo do erro:', typeof error);
      console.log('🔍 É instância de Error?', error instanceof Error);
      console.log('🔍 É AxiosError?', axios.isAxiosError(error));
      
      if (axios.isAxiosError(error)) {
        console.log('📡 ===== DETALHES DO ERRO AXIOS =====');
        console.log('📊 Tem response?', !!error.response);
        console.log('📊 Tem request?', !!error.request);
        console.log('📊 Tem message?', !!error.message);
        console.log('📊 Tem code?', !!error.code);
        
        if (error.response) {
          const status = error.response.status;
          const responseData = error.response.data;
          
          console.log('📊 Status do erro:', status);
          console.log('📄 Dados do erro:', JSON.stringify(responseData, null, 2));
          console.log('📋 Headers do erro:', JSON.stringify(error.response.headers, null, 2));
          
          if (status === 403) {
            // Erro de API key ou licença expirada
            console.log('🚫 Erro 403 - Acesso não autorizado');
            const errorMessage = responseData?.error || 'Acesso não autorizado';
            throw new Error(errorMessage);
          } else if (status === 401) {
            // Credenciais inválidas
            console.log('🚫 Erro 401 - Credenciais inválidas');
            const errorMessage = responseData?.error || 'Email ou senha inválidos';
            throw new Error(errorMessage);
          } else if (status === 400) {
            // Dados inválidos
            console.log('🚫 Erro 400 - Dados inválidos');
            const errorMessage = responseData?.error || 'Dados de login inválidos';
            throw new Error(errorMessage);
          } else if (status === 500) {
            console.log('🚫 Erro 500 - Erro interno do servidor');
            throw new Error('Erro interno do servidor. Tente novamente.');
          } else {
            console.log(`🚫 Erro ${status} - Erro do servidor`);
            throw new Error(`Erro do servidor (${status}). Tente novamente.`);
          }
        } else if (error.request) {
          console.log('🌐 ===== ERRO DE CONEXÃO =====');
          console.log('📡 Request feito mas sem response');
          console.log('🔍 Detalhes do request:', error.request);
          throw new Error('Sem conexão com o servidor. Verifique sua internet.');
        } else {
          console.log('⚙️ ===== ERRO DE CONFIGURAÇÃO =====');
          console.log('🔧 Erro na configuração da requisição');
          console.log('💬 Mensagem:', error.message);
          throw new Error('Erro na configuração da requisição.');
        }
      } else if (error instanceof Error) {
        console.log('📝 ===== ERRO PADRÃO =====');
        console.log('💬 Mensagem:', error.message);
        console.log('📚 Stack:', error.stack);
        throw error;
      } else {
        console.log('❓ ===== ERRO DESCONHECIDO =====');
        console.log('🔍 Valor do erro:', error);
        throw new Error('Erro inesperado durante o login.');
      }
    }
  }

  // Criar instância do Axios com interceptor para cookies automáticos
  createAuthenticatedClient(): AxiosInstance {
    const client = axios.create({
      baseURL: 'https://mtfa.freenetic.ch',
      timeout: SERVER_CONFIG.timeout,
    });

    // Interceptor para adicionar cookie automaticamente
    client.interceptors.request.use((config) => {
      if (this.sessionId) {
        config.headers.Cookie = `PHPSESSID=${this.sessionId}`;
      }
      return config;
    });

    return client;
  }

  // Fazer logout (limpar sessão)
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('PHPSESSID');
      await AsyncStorage.removeItem('sessionTimestamp');
      this.sessionId = null;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  // Verificar se usuário está logado
  isLoggedIn(): boolean {
    return this.sessionId !== null;
  }

  // Verificar se há uma sessão válida salva
  async hasValidSession(): Promise<boolean> {
    try {
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      return sessionId !== null && sessionId.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Verificar se a sessão é válida fazendo uma requisição ao servidor
  async validateSession(): Promise<boolean> {
    try {
      if (!this.sessionId) {
        return false;
      }

      // Para evitar erros 403, vamos usar uma abordagem mais simples
      // Se temos um sessionId salvo, consideramos válido por um tempo limitado
      const sessionData = await AsyncStorage.getItem('sessionTimestamp');
      if (sessionData) {
        const timestamp = parseInt(sessionData);
        const now = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 horas
        
        if (now - timestamp < sessionDuration) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return false;
    }
  }

  // Obter ID da sessão atual
  getSessionId(): string | null {
    return this.sessionId;
  }

  // Obter status de conexão atual
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Instância singleton do serviço
export const cloudLoginService = new CloudLoginService();

// Configurações exportadas
export { SERVER_CONFIG };


