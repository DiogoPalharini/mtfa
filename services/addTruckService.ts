// Serviço para adicionar carregamento de caminhão com autenticação híbrida
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { hybridAuthService } from './HybridAuthService';
import { getTranslatedMessage, ErrorMessages } from './translations';
import { LanguageCode } from '../contexts/LanguageContext';

// Interface para os dados do formulário conforme especificação do endpoint
export interface TruckLoadFormData {
  reg_date: string;        // Data de registro
  reg_time: string;        // Hora de registro
  truck: string;           // Caminhão
  othertruck: string;      // Outro caminhão (se aplicável)
  farm: string;           // Fazenda
  otherfarm: string;       // Outra fazenda (se aplicável)
  field: string;          // Campo/Talhão
  otherfield: string;      // Outro campo (se aplicável)
  variety: string;         // Variedade
  othervariety: string;    // Outra variedade (se aplicável)
  driver: string;          // Motorista
  otherdriver: string;     // Outro motorista (se aplicável)
  destination: string;     // Destino
  otherdestination: string; // Outro destino (se aplicável)
  dnote: string;           // Notas
  agreement: string;       // Acordo
  otheragreement: string;  // Outro acordo (se aplicável)
}

// Interface para resposta de sucesso
export interface AddTruckLoadResponse {
  success: boolean;
  message: string;
}

class AddTruckService {
  private apiClient: AxiosInstance;

  constructor() {
    // Criar instância do Axios com interceptor para cookie automático
    this.apiClient = axios.create({
      baseURL: 'https://mtfa.freenetic.ch',
      timeout: 15000, // 15 segundos
      maxRedirects: 0, // Não seguir redirecionamentos para capturar status 302
    });

    // Interceptor para adicionar cookie PHPSESSID automaticamente
    this.apiClient.interceptors.request.use(async (config) => {
      try {
        // Obter cookie do serviço híbrido
        const sessionCookie = hybridAuthService.getSessionCookie();
        
        if (sessionCookie) {
          config.headers.Cookie = sessionCookie;
          console.log('🍪 Cookie híbrido adicionado ao header');
        } else {
          console.error('❌ Nenhum cookie PHPSESSID encontrado no serviço híbrido');
        }
      } catch (error) {
        console.error('Erro ao carregar cookie de sessão:', error);
      }
      return config;
    });

    // Interceptor para tratamento de erros
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            throw new Error('Sessão expirada. Faça login novamente.');
          } else if (error.response?.status && error.response.status >= 500) {
            throw new Error('Erro interno do servidor. Tente novamente.');
          } else if (!error.response) {
            throw new Error('Sem conexão com o servidor. Verifique sua internet.');
          }
        }
        throw error;
      }
    );
  }

  // Obter idioma atual do AsyncStorage
  private async getCurrentLanguage(): Promise<LanguageCode> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
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

  /**
   * Adiciona um novo carregamento de caminhão
   * @param formData - Dados do formulário
   * @returns Promise<AddTruckLoadResponse> - Resposta de sucesso ou erro
   */
  async addTruckLoad(formData: TruckLoadFormData): Promise<AddTruckLoadResponse> {
    try {
      // Criar FormData com todos os campos necessários
      const formDataToSend = new FormData();
      
      // Adicionar todos os campos obrigatórios
      formDataToSend.append('reg_date', formData.reg_date);
      formDataToSend.append('reg_time', formData.reg_time);
      formDataToSend.append('truck', formData.truck);
      formDataToSend.append('othertruck', formData.othertruck);
      formDataToSend.append('farm', formData.farm);
      formDataToSend.append('otherfarm', formData.otherfarm);
      formDataToSend.append('field', formData.field);
      formDataToSend.append('otherfield', formData.otherfield);
      formDataToSend.append('variety', formData.variety);
      formDataToSend.append('othervariety', formData.othervariety);
      formDataToSend.append('driver', formData.driver);
      formDataToSend.append('otherdriver', formData.otherdriver);
      formDataToSend.append('destination', formData.destination);
      formDataToSend.append('otherdestination', formData.otherdestination);
      formDataToSend.append('dnote', formData.dnote);
      formDataToSend.append('agreement', formData.agreement);
      formDataToSend.append('otheragreement', formData.otheragreement);

      // Fazer requisição POST para o endpoint
      const response: AxiosResponse = await this.apiClient.post(
        '/pages/crops/processaddtruck.php',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Debug - Status da resposta
      // Debug - Headers da resposta  
      // Debug - Dados da resposta

      // Verificar se a resposta é de sucesso
      if (response.status === 302) {
        // Status 302 = Redirecionamento após sucesso
        return {
          success: true,
          message: await this.getMessage('credentialsSaved')
        };
      } else if (response.status === 200) {
        // Status 200 - Verificar se contém o formulário (indica que os dados foram processados)
        const responseData = response.data || '';
        const responseText = typeof responseData === 'string' ? responseData : '';
        
        if (responseText.includes('Add truck load') || responseText.includes('form') || responseText.includes('Save')) {
          // Se contém o formulário, significa que os dados foram processados com sucesso
          return {
            success: true,
            message: await this.getMessage('credentialsSaved')
          };
        } else {
          console.error('❌ Status 200 mas conteúdo inesperado');
          throw new Error(await this.getMessage('serverError'));
        }
      } else {
        // Qualquer outro status indica falha
        console.error('❌ Status inesperado:', response.status);
        throw new Error(await this.getMessage('sessionExpired'));
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(await this.getMessage('unknownError'));
      }
    }
  }

  /**
   * Verifica se há uma sessão válida salva
   * @returns Promise<boolean> - true se há sessão válida
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const sessionId = await AsyncStorage.getItem('PHPSESSID');
      return sessionId !== null && sessionId.length > 0;
    } catch (error) {
      return false;
    }
  }
}

// Instância singleton do serviço
export const addTruckService = new AddTruckService();
