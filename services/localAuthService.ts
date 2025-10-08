import * as Crypto from 'expo-crypto';
import { localDatabaseService, LocalUserCredentials } from './localDatabaseService';

export interface LocalUserCredentialsLegacy {
  email: string;
  password: string; // Será criptografada
  lastLogin: string;
  isValidated: boolean;
  sessionId?: string;
}

class LocalAuthService {
  private readonly ENCRYPTION_KEY = 'mtfa_auth_key_2024';

  // Criptografar senha
  private async encryptPassword(password: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password + this.ENCRYPTION_KEY,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      return hash;
    } catch (error) {
      console.error('Erro ao criptografar senha:', error);
      return password; // Fallback sem criptografia
    }
  }

  // Verificar senha comparando com hash
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password + this.ENCRYPTION_KEY,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      return hash === hashedPassword;
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      return false;
    }
  }

  // Salvar credenciais após login online bem-sucedido
  async saveCredentials(email: string, password: string, sessionId?: string): Promise<boolean> {
    try {
      const hashedPassword = await this.encryptPassword(password);
      
      const success = await localDatabaseService.saveUserCredentials(email, hashedPassword, sessionId);
      
      if (success) {
      } else {
      }
      
      return success;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais:', error);
      return false;
    }
  }

  // Verificar se há credenciais salvas
  async hasStoredCredentials(): Promise<boolean> {
    try {
      const hasCredentials = await localDatabaseService.hasUserCredentials();
      return hasCredentials;
    } catch (error) {
      console.error('❌ Erro ao verificar credenciais armazenadas:', error);
      return false;
    }
  }

  // Obter credenciais salvas por email específico
  async getStoredCredentialsByEmail(email: string): Promise<LocalUserCredentialsLegacy | null> {
    try {
('📋 Obtendo credenciais salvas do SQLite para:', email);
      
      const credentials = await localDatabaseService.getUserCredentials(email);
      
      if (!credentials) {
('📋 Nenhuma credencial encontrada para:', email);
        return null;
      }

      // Converter para o formato legado esperado pelo código existente
      const legacyCredentials: LocalUserCredentialsLegacy = {
        email: credentials.email,
        password: credentials.password_hash,
        lastLogin: credentials.last_login,
        isValidated: credentials.is_validated === 1,
        sessionId: credentials.session_id
      };

('📋 Credenciais obtidas para:', legacyCredentials.email);
      return legacyCredentials;
    } catch (error) {
      console.error('❌ Erro ao obter credenciais armazenadas:', error);
      return null;
    }
  }

  // Obter credenciais salvas (retorna a primeira credencial encontrada)
  async getStoredCredentials(): Promise<LocalUserCredentialsLegacy | null> {
    try {
('📋 Obtendo credenciais salvas do SQLite...');
      
      // Buscar a primeira credencial disponível
      const credentials = await localDatabaseService.getFirstUserCredentials();
      
      if (!credentials) {
('📋 Nenhuma credencial encontrada');
        return null;
      }

      // Converter para o formato legado esperado pelo código existente
      const legacyCredentials: LocalUserCredentialsLegacy = {
        email: credentials.email,
        password: credentials.password_hash,
        lastLogin: credentials.last_login,
        isValidated: credentials.is_validated === 1,
        sessionId: credentials.session_id
      };

('📋 Credenciais obtidas para:', legacyCredentials.email);
      return legacyCredentials;
    } catch (error) {
      console.error('❌ Erro ao obter credenciais armazenadas:', error);
      return null;
    }
  }

  // Validar login offline
  async validateOfflineLogin(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    credentials?: LocalUserCredentialsLegacy;
  }> {
    try {
('🔍 Tentando login offline para:', email);
      
      const storedCredentials = await this.getStoredCredentialsByEmail(email);
      
      if (!storedCredentials) {
('❌ Nenhuma credencial salva encontrada para:', email);
        return {
          success: false,
          message: 'Nenhuma credencial salva encontrada. Faça login online primeiro.'
        };
      }

('📋 Credenciais encontradas para:', storedCredentials.email);

      // Verificar se as credenciais ainda são válidas (último login há menos de 30 dias)
      const lastLogin = new Date(storedCredentials.lastLogin);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

('📅 Dias desde último login:', daysDiff);

      if (daysDiff > 30) {
('❌ Credenciais expiradas');
        return {
          success: false,
          message: 'Credenciais expiradas. Faça login online novamente.'
        };
      }

      // Verificar senha
      const isPasswordValid = await this.verifyPassword(password, storedCredentials.password);
      
      if (!isPasswordValid) {
('❌ Senha incorreta');
        return {
          success: false,
          message: 'Senha incorreta.'
        };
      }

('✅ Login offline bem-sucedido');
      return {
        success: true,
        message: 'Login offline realizado com sucesso.',
        credentials: storedCredentials
      };
    } catch (error) {
      console.error('❌ Erro na validação offline:', error);
      return {
        success: false,
        message: 'Falha na validação offline. Tente novamente.'
      };
    }
  }

  // Atualizar senha quando login online detecta mudança
  async updatePassword(email: string, newPassword: string, sessionId?: string): Promise<boolean> {
    try {
('🔄 Atualizando senha para:', email);
      const hashedNewPassword = await this.encryptPassword(newPassword);
      
      const success = await localDatabaseService.saveUserCredentials(email, hashedNewPassword, sessionId);
      
      if (success) {
('✅ Senha atualizada para:', email);
      } else {
('❌ Falha ao atualizar senha para:', email);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      return false;
    }
  }

  // Limpar credenciais (logout)
  async clearCredentials(): Promise<boolean> {
    try {
('🧹 Limpando credenciais do SQLite...');
      const success = await localDatabaseService.clearUserCredentials();
      
      if (success) {
('✅ Credenciais removidas do SQLite');
      } else {
('❌ Falha ao remover credenciais do SQLite');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Erro ao limpar credenciais:', error);
      return false;
    }
  }

  // Verificar se pode fazer login offline
  async canLoginOffline(): Promise<boolean> {
    try {
('🔍 Verificando se pode fazer login offline...');
      const hasCredentials = await this.hasStoredCredentials();
      
      if (!hasCredentials) {
('❌ Não há credenciais salvas para login offline');
        return false;
      }

      // Verificar se há pelo menos uma credencial válida
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
('❌ Não foi possível obter credenciais para verificação');
        return false;
      }

      const lastLogin = new Date(credentials.lastLogin);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

      const canLogin = daysDiff <= 30 && credentials.isValidated;
('🔍 Pode fazer login offline?', canLogin, '(dias:', daysDiff, ')');
      
      return canLogin;
    } catch (error) {
      console.error('❌ Erro ao verificar login offline:', error);
      return false;
    }
  }
}

export const localAuthService = new LocalAuthService();
