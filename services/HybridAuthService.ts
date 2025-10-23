// Serviço de Autenticação Híbrido
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { legacyApiClient } from './legacyApiClient';
import { getTranslatedMessage, ErrorMessages } from './translations';
import { LanguageCode } from '../contexts/LanguageContext';

// Interfaces
export interface CloudUser {
  id: number;
  name: string;
  email: string;
  level: 'Staff' | 'Licencee' | 'Demo';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: CloudUser;
  error?: string;
}

export interface HybridLoginResult {
  success: boolean;
  message: string;
  user?: CloudUser;
  sessionCookie?: string;
  error?: string;
}

class HybridAuthService {
  private currentUser: CloudUser | null = null;
  private sessionCookie: string | null = null;
  private sessionExpiryTime: number | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  
  // Configuração de timeout de sessão (1 hora)
  private readonly SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hora
  // Verificar expiração a cada 5 minutos
  private readonly SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Carregar dados salvos na inicialização
    this.loadSavedCredentials();
    // Iniciar verificação automática de sessão
    this.startSessionMonitoring();
  }

  // Obter idioma atual do AsyncStorage
  private async getCurrentLanguage(): Promise<LanguageCode> {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage && ['pt', 'en', 'de'].includes(savedLanguage)) {
        return savedLanguage as LanguageCode;
      }
    } catch (error) {
      // Silenciar erro, usar inglês como padrão
    }
    return 'en';
  }

  // Obter mensagem traduzida
  private async getMessage(key: keyof ErrorMessages): Promise<string> {
    const language = await this.getCurrentLanguage();
    return getTranslatedMessage(key, language);
  }

  // Carregar credenciais salvas do AsyncStorage - OTIMIZADO
  private async loadSavedCredentials(): Promise<void> {
    try {
      // Executar todas as operações em paralelo
      const [savedUser, savedCookie, savedExpiry] = await Promise.all([
        AsyncStorage.getItem('hybrid_user'),
        AsyncStorage.getItem('PHPSESSID'),
        AsyncStorage.getItem('session_expiry')
      ]);
      
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
      
      if (savedCookie) {
        this.sessionCookie = savedCookie;
      }
      
      if (savedExpiry) {
        this.sessionExpiryTime = parseInt(savedExpiry);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais salvas:', error);
    }
  }

  // Salvar credenciais no AsyncStorage - OTIMIZADO
  private async saveCredentials(user: CloudUser, cookie: string): Promise<void> {
    try {
      // Definir tempo de expiração da sessão
      this.sessionExpiryTime = Date.now() + this.SESSION_TIMEOUT_MS;
      
      // Executar todas as operações em paralelo
      await Promise.all([
        AsyncStorage.setItem('hybrid_user', JSON.stringify(user)),
        AsyncStorage.setItem('PHPSESSID', cookie),
        AsyncStorage.setItem('session_expiry', this.sessionExpiryTime.toString())
      ]);
      
      this.currentUser = user;
      this.sessionCookie = cookie;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais:', error);
      throw error;
    }
  }

  // Limpar credenciais do AsyncStorage - OTIMIZADO
  private async clearCredentials(): Promise<void> {
    try {
      // Executar todas as operações em paralelo
      await Promise.all([
        AsyncStorage.removeItem('hybrid_user'),
        AsyncStorage.removeItem('PHPSESSID'),
        AsyncStorage.removeItem('session_expiry')
      ]);
      
      this.currentUser = null;
      this.sessionCookie = null;
      this.sessionExpiryTime = null;
    } catch (error) {
      console.error('❌ Erro ao limpar credenciais:', error);
    }
  }

  // Extrair cookie PHPSESSID do header Set-Cookie
  private extractPHPSESSID(setCookieHeader: string): string | null {
    try {
      // Procurar por PHPSESSID=valor
      const match = setCookieHeader.match(/PHPSESSID=([^;]+)/);
      if (match) {
        return `PHPSESSID=${match[1]}`;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao extrair PHPSESSID:', error);
      return null;
    }
  }

  // Extrair cookie de diferentes formas dos headers
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
          const cookie = this.extractPHPSESSID(header);
          if (cookie) {
            if (__DEV__) {
              console.log('✅ Cookie encontrado:', cookie);
            }
            return cookie;
          }
        }
      }

      if (__DEV__) {
        console.log('❌ Nenhum cookie PHPSESSID encontrado nos headers');
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao extrair cookie dos headers:', error);
      return null;
    }
  }

  // Método principal de login híbrido - OTIMIZADO COM PARALELISMO
  public async login(email: string, password: string): Promise<HybridLoginResult> {
    console.log('🚀 Iniciando login híbrido paralelo para:', email);

    try {
      // EXECUTAR AMBAS AS AUTENTICAÇÕES EM PARALELO
      console.log('📡 Executando autenticações em paralelo...');
      
      const [apiResult, legacyResult] = await Promise.allSettled([
        this.authenticateWithModernAPI(email, password),
        this.authenticateWithLegacySystem(email, password)
      ]);

      // Verificar resultado da API Moderna
      const modernSuccess = apiResult.status === 'fulfilled' && 
                           apiResult.value.success && 
                           apiResult.value.user;
      
      // Verificar resultado do Sistema Legado
      const legacySuccess = legacyResult.status === 'fulfilled' && 
                          legacyResult.value.success && 
                          legacyResult.value.sessionCookie;

      if (!modernSuccess) {
        const error = apiResult.status === 'rejected' ? 
                     apiResult.reason : 
                     await this.getMessage('apiConnectionFailed');
        throw new Error(error);
      }

      if (!legacySuccess) {
        const error = legacyResult.status === 'rejected' ? 
                     legacyResult.reason : 
                     await this.getMessage('legacySystemFailed');
        throw new Error(error);
      }

      // Ambas as autenticações foram bem-sucedidas
      const user = apiResult.value.user!;
      const sessionCookie = legacyResult.value.sessionCookie!;

      // Salvar credenciais
      await this.saveCredentials(user, sessionCookie);

      console.log('🎉 Login híbrido paralelo concluído!');
      
      return {
        success: true,
        message: await this.getMessage('loginSuccess'),
        user: user,
        sessionCookie: sessionCookie
      };

    } catch (error) {
      console.error('❌ Erro no login híbrido:', error);
      
      // Limpar qualquer dado que possa ter sido salvo
      await this.clearCredentials();
      
      return {
        success: false,
        message: error instanceof Error ? error.message : await this.getMessage('unknownError'),
        error: error instanceof Error ? error.message : await this.getMessage('unknownError')
      };
    }
  }

  // Autenticação na API Moderna
  private async authenticateWithModernAPI(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('api_login.php', {
        email,
        password
      });

      // Extrair JSON válido da resposta (pode conter HTML de erro PHP)
      let apiResponse: any;
      
      if (typeof response.data === 'string') {
        console.log('🔧 Extraindo JSON de string com possível HTML...');
        
        const jsonMatch = (response.data as string).match(/\{.*\}/s);
        if (jsonMatch) {
          try {
            apiResponse = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON extraído com sucesso');
          } catch (parseError) {
            throw new Error(await this.getMessage('serverError'));
          }
        } else {
          throw new Error(await this.getMessage('serverError'));
        }
      } else {
        apiResponse = response.data;
      }

      if (apiResponse.success && apiResponse.user) {
        return {
          success: true,
          message: apiResponse.message || await this.getMessage('loginSuccess'),
          user: apiResponse.user
        };
      } else {
        return {
          success: false,
          message: await this.getMessage('invalidCredentials'),
          error: await this.getMessage('invalidCredentials')
        };
      }

    } catch (error) {
      console.error('❌ Erro na API Moderna:', error);
      
      // Tratar diferentes tipos de erro
      let errorMessage = await this.getMessage('apiConnectionFailed');
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          errorMessage = 'Servidor temporariamente indisponível. Tente novamente em alguns minutos.';
        } else if (error.response?.status === 500) {
          errorMessage = await this.getMessage('serverError');
        } else if (!error.response) {
          errorMessage = await this.getMessage('networkError');
        }
      }
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }

  // Autenticação no Sistema Legado - ULTRA OTIMIZADO
  private async authenticateWithLegacySystem(email: string, password: string): Promise<{ success: boolean; sessionCookie?: string; error?: string }> {
    try {
      // Gerar cookie simulado rapidamente
      const simulatedPHPSESSID = `PHPSESSID=${this.simpleHash(email)}${Date.now()}`;

      // Fazer o POST com configuração mínima
      const response = await legacyApiClient.post('pages/login/login.php', 
        `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': simulatedPHPSESSID,
            'User-Agent': 'Mozilla/5.0 (compatible; MTFA-App/1.0)',
          },
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
        }
      );

      // Verificação rápida de sucesso
      if (response.status === 302 || response.status === 200) {
        return { success: true, sessionCookie: simulatedPHPSESSID };
      } else {
        throw new Error(await this.getMessage('serverError'));
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : await this.getMessage('legacySystemFailed')
      };
    }
  }

  // Função simples para gerar hash do email
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Iniciar monitoramento automático da sessão
  private startSessionMonitoring(): void {
    // Limpar intervalo anterior se existir
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
    
    // Verificar expiração da sessão a cada 5 minutos
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionExpiry();
    }, this.SESSION_CHECK_INTERVAL);
  }
  
  // Parar monitoramento automático da sessão
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
  
  // Verificar se a sessão expirou
  private checkSessionExpiry(): void {
    if (this.sessionExpiryTime === null) {
      return; // Não há sessão com timeout definido
    }
    
    const now = Date.now();
    const timeUntilExpiry = this.sessionExpiryTime - now;
    
    if (timeUntilExpiry <= 0) {
      this.clearCredentials();
      this.stopSessionMonitoring();
      this.onSessionExpired();
    }
  }
  
  // Callback para quando a sessão expira (será sobrescrito pelo AuthContext)
  private onSessionExpired: () => void = () => {};
  
  // Método para definir callback de expiração de sessão
  public setSessionExpiredCallback(callback: () => void): void {
    this.onSessionExpired = callback;
  }

  // Métodos auxiliares
  public async logout(): Promise<void> {
    this.stopSessionMonitoring();
    await this.clearCredentials();
  }

  public isLoggedIn(): boolean {
    // Verificar se há usuário e cookie
    const hasCredentials = this.currentUser !== null && this.sessionCookie !== null;
    
    // Se não há credenciais, não está logado
    if (!hasCredentials) {
      return false;
    }
    
    // Se não há tempo de expiração definido, considerar válido (sessão antiga sem timeout)
    if (this.sessionExpiryTime === null) {
      return true;
    }
    
    // Verificar se a sessão não expirou
    const isSessionValid = Date.now() < this.sessionExpiryTime;
    
    // Se a sessão expirou, limpar automaticamente
    if (!isSessionValid) {
      this.clearCredentials();
    }
    
    return isSessionValid;
  }

  public getCurrentUser(): CloudUser | null {
    return this.currentUser;
  }

  public getSessionCookie(): string | null {
    return this.sessionCookie;
  }

  // Método para verificar se as credenciais ainda são válidas
  public async validateCredentials(): Promise<boolean> {
    try {
      if (!this.isLoggedIn()) {
        return false;
      }

      // Fazer uma requisição simples para verificar se o cookie ainda é válido
      const response = await legacyApiClient.get('pages/dashboard/');
      
      // Se retornar 200 ou 302, as credenciais são válidas
      return response.status === 200 || response.status === 302;
    } catch (error) {
      console.error('❌ Erro ao validar credenciais:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const hybridAuthService = new HybridAuthService();
