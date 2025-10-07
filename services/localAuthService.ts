import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface LocalUserCredentials {
  email: string;
  password: string; // Será criptografada
  lastLogin: string;
  isValidated: boolean;
  sessionId?: string;
}

class LocalAuthService {
  private readonly CREDENTIALS_KEY = 'local_user_credentials';
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

  // Descriptografar senha (não é possível, mas podemos verificar hash)
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
      const credentials: LocalUserCredentials = {
        email,
        password: hashedPassword,
        lastLogin: new Date().toISOString(),
        isValidated: true,
        sessionId
      };

      await AsyncStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais:', error);
      return false;
    }
  }

  // Verificar se há credenciais salvas
  async hasStoredCredentials(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      return stored !== null;
    } catch (error) {
      console.error('Erro ao verificar credenciais armazenadas:', error);
      return false;
    }
  }

  // Obter credenciais salvas
  async getStoredCredentials(): Promise<LocalUserCredentials | null> {
    try {
      const stored = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      if (!stored) return null;

      const credentials: LocalUserCredentials = JSON.parse(stored);
      return credentials;
    } catch (error) {
      console.error('Erro ao obter credenciais armazenadas:', error);
      return null;
    }
  }

  // Validar login offline
  async validateOfflineLogin(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    credentials?: LocalUserCredentials;
  }> {
    try {
      const storedCredentials = await this.getStoredCredentials();
      
      if (!storedCredentials) {
        return {
          success: false,
          message: 'Nenhuma credencial salva encontrada. Faça login online primeiro.'
        };
      }

      // Verificar se o email corresponde
      if (storedCredentials.email.toLowerCase() !== email.toLowerCase()) {
        return {
          success: false,
          message: 'Email não corresponde às credenciais salvas.'
        };
      }

      // Verificar se as credenciais ainda são válidas (último login há menos de 30 dias)
      const lastLogin = new Date(storedCredentials.lastLogin);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        return {
          success: false,
          message: 'Credenciais expiradas. Faça login online novamente.'
        };
      }

      // Verificar senha
      const isPasswordValid = await this.verifyPassword(password, storedCredentials.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Senha incorreta.'
        };
      }

      return {
        success: true,
        message: 'Login offline realizado com sucesso.',
        credentials: storedCredentials
      };
    } catch (error) {
      console.error('Erro na validação offline:', error);
      return {
        success: false,
        message: 'Falha na validação offline. Tente novamente.'
      };
    }
  }

  // Atualizar senha quando login online detecta mudança
  async updatePassword(email: string, newPassword: string, sessionId?: string): Promise<boolean> {
    try {
      const storedCredentials = await this.getStoredCredentials();
      
      if (!storedCredentials) {
        // Se não há credenciais salvas, criar novas
        return await this.saveCredentials(email, newPassword, sessionId);
      }

      // Verificar se o email corresponde
      if (storedCredentials.email.toLowerCase() !== email.toLowerCase()) {
        // Email diferente detectado, atualizando credenciais
        return await this.saveCredentials(email, newPassword, sessionId);
      }

      // Verificar se a senha mudou
      const isSamePassword = await this.verifyPassword(newPassword, storedCredentials.password);
      
      if (!isSamePassword) {
        // Senha diferente detectada, atualizando credenciais
        const hashedNewPassword = await this.encryptPassword(newPassword);
        
        const updatedCredentials: LocalUserCredentials = {
          ...storedCredentials,
          password: hashedNewPassword,
          lastLogin: new Date().toISOString(),
          isValidated: true,
          sessionId
        };

        await AsyncStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
        // Senha atualizada localmente
        return true;
      }

      // Senha é a mesma, apenas atualizar timestamp e sessionId
      const updatedCredentials: LocalUserCredentials = {
        ...storedCredentials,
        lastLogin: new Date().toISOString(),
        sessionId
      };

      await AsyncStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
        // Credenciais atualizadas (mesma senha)
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      return false;
    }
  }

  // Limpar credenciais (logout)
  async clearCredentials(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.CREDENTIALS_KEY);
      // Credenciais locais removidas
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar credenciais:', error);
      return false;
    }
  }

  // Verificar se pode fazer login offline
  async canLoginOffline(): Promise<boolean> {
    try {
      const credentials = await this.getStoredCredentials();
      if (!credentials) return false;

      const lastLogin = new Date(credentials.lastLogin);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

      return daysDiff <= 30 && credentials.isValidated;
    } catch (error) {
      console.error('Erro ao verificar login offline:', error);
      return false;
    }
  }
}

export const localAuthService = new LocalAuthService();
