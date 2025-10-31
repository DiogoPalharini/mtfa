import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      // Persistir no SQLite
      const success = await localDatabaseService.saveUserCredentials(email, hashedPassword, sessionId);
      // Persistência redundante no AsyncStorage (fallback para APK)
      try {
        await AsyncStorage.setItem(
          'offline_credentials',
          JSON.stringify({ email, password_hash: hashedPassword, session_id: sessionId, last_login: new Date().toISOString(), is_validated: true })
        );
      } catch {}

      if (success) {
        console.log('✅ Credenciais salvas com sucesso para:', email);
      } else {
        console.log('❌ Falha ao salvar credenciais para:', email);
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
      console.log('📋 Obtendo credenciais salvas do SQLite para:', email);
      
      const credentials = await localDatabaseService.getUserCredentials(email);
      
      if (!credentials) {
        console.log('📋 Nenhuma credencial encontrada para:', email);
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

console.log('📋 Credenciais obtidas para:', legacyCredentials.email);
      return legacyCredentials;
    } catch (error) {
      console.error('❌ Erro ao obter credenciais armazenadas:', error);
      return null;
    }
  }

  // Obter credenciais salvas (retorna a primeira credencial encontrada)
  async getStoredCredentials(): Promise<LocalUserCredentialsLegacy | null> {
    try {
console.log('📋 Obtendo credenciais salvas do SQLite...');
      
      // Buscar a primeira credencial disponível
      const credentials = await localDatabaseService.getFirstUserCredentials();
      
      if (!credentials) {
console.log('📋 Nenhuma credencial encontrada');
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

console.log('📋 Credenciais obtidas para:', legacyCredentials.email);
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
      console.log('🔍 Tentando login offline para:', email);
      
      // Verificar se o banco de dados está disponível
      try {
        await localDatabaseService.waitForInitialization();
      } catch (dbError) {
        console.error('❌ Banco de dados não disponível para login offline:', dbError);
        return {
          success: false,
          message: 'Sistema offline temporariamente indisponível. Tente novamente.'
        };
      }
      
      let storedCredentials = await this.getStoredCredentialsByEmail(email);
      
      // Fallback: tentar obter do AsyncStorage se banco falhar/no data
      if (!storedCredentials) {
        try {
          const json = await AsyncStorage.getItem('offline_credentials');
          if (json) {
            const parsed = JSON.parse(json);
            if (parsed?.email === email) {
              storedCredentials = {
                email: parsed.email,
                password: parsed.password_hash,
                lastLogin: parsed.last_login ?? new Date().toISOString(),
                isValidated: parsed.is_validated ?? true,
                sessionId: parsed.session_id,
              };
            }
          }
        } catch {}
      }
      
      if (!storedCredentials) {
console.log('❌ Nenhuma credencial salva encontrada para:', email);
        return {
          success: false,
          message: 'Nenhuma credencial salva encontrada. Faça login online primeiro.'
        };
      }

console.log('📋 Credenciais encontradas para:', storedCredentials.email);

      // Verificar se as credenciais ainda são válidas (último login há menos de 30 dias)
      const lastLogin = new Date(storedCredentials.lastLogin);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

console.log('📅 Dias desde último login:', daysDiff);

      if (daysDiff > 30) {
console.log('❌ Credenciais expiradas');
        return {
          success: false,
          message: 'Credenciais expiradas. Faça login online novamente.'
        };
      }

      // Verificar senha
      const isPasswordValid = await this.verifyPassword(password, storedCredentials.password);
      
      if (!isPasswordValid) {
console.log('❌ Senha incorreta');
        return {
          success: false,
          message: 'Senha incorreta.'
        };
      }

console.log('✅ Login offline bem-sucedido');
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
console.log('🔄 Atualizando senha para:', email);
      const hashedNewPassword = await this.encryptPassword(newPassword);
      
      const success = await localDatabaseService.saveUserCredentials(email, hashedNewPassword, sessionId);
      try {
        await AsyncStorage.setItem(
          'offline_credentials',
          JSON.stringify({ email, password_hash: hashedNewPassword, session_id: sessionId, last_login: new Date().toISOString(), is_validated: true })
        );
      } catch {}
      
      if (success) {
console.log('✅ Senha atualizada para:', email);
      } else {
console.log('❌ Falha ao atualizar senha para:', email);
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
console.log('🧹 Limpando credenciais do SQLite...');
      const success = await localDatabaseService.clearUserCredentials();
      try {
        await AsyncStorage.removeItem('offline_credentials');
      } catch {}
      
      if (success) {
console.log('✅ Credenciais removidas do SQLite');
      } else {
console.log('❌ Falha ao remover credenciais do SQLite');
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
      console.log('🔍 Verificando se pode fazer login offline...');
      
      // Verificar se o banco de dados está disponível
      try {
        await localDatabaseService.waitForInitialization();
      } catch (dbError) {
        console.error('❌ Banco de dados não disponível para verificação offline:', dbError);
        return false;
      }
      
      const hasCredentials = await this.hasStoredCredentials();
      
      if (!hasCredentials) {
        console.log('❌ Não há credenciais salvas para login offline');
        return false;
      }

      // Verificar se há pelo menos uma credencial válida
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        console.log('❌ Não foi possível obter credenciais para verificação');
        return false;
      }

      const lastLogin = new Date(credentials.lastLogin);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

      const canLogin = daysDiff <= 30 && credentials.isValidated;
      console.log('🔍 Pode fazer login offline?', canLogin, '(dias:', daysDiff, ')');
      
      return canLogin;
    } catch (error) {
      console.error('❌ Erro ao verificar login offline:', error);
      return false;
    }
  }
}

export const localAuthService = new LocalAuthService();
