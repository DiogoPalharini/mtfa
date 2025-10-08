import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudLoginService, CloudUser } from '../services/cloudLogin';
import { localAuthService } from '../services/localAuthService';

interface AuthContextValue {
  user: CloudUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sessão salva na inicialização
  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    try {
      setIsLoading(true);
('🔍 Verificando sessão salva...');
      
      // Verificar se há sessão salva
      const hasSession = await cloudLoginService.hasValidSession();
('🔍 Tem sessão salva?', hasSession);
      
      // Verificar se há credenciais locais também
      const hasLocalCredentials = await localAuthService.hasStoredCredentials();
('🔍 Tem credenciais locais?', hasLocalCredentials);
      
      if (hasSession) {
        // Tentar validar a sessão com o servidor
        const isValid = await validateSessionWithServer();
('🔍 Sessão é válida?', isValid);
        
        if (isValid) {
          // Carregar dados do usuário salvos
          const savedUser = await AsyncStorage.getItem('userData');
('🔍 Tem dados de usuário salvos?', !!savedUser);
          
          if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
('✅ Usuário autenticado via sessão válida');
          }
        } else {
          // Sessão inválida, mas manter credenciais locais para login offline
('⚠️ Sessão inválida, mas mantendo credenciais locais');
          // Não limpar dados se há credenciais locais
          if (!hasLocalCredentials) {
            await clearAuthData();
          }
        }
      } else if (hasLocalCredentials) {
        // Não há sessão online, mas há credenciais locais
('🔍 Sem sessão online, mas há credenciais locais disponíveis');
        // Não limpar dados, permitir login offline
      } else {
        // Não há nem sessão nem credenciais locais
('🔍 Sem sessão nem credenciais locais');
        await clearAuthData();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      // Em caso de erro, não limpar dados automaticamente
('⚠️ Erro na verificação, mantendo estado atual');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSessionWithServer = async (): Promise<boolean> => {
    try {
      // Usar o método de validação do serviço
      return await cloudLoginService.validateSession();
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return false;
    }
  };

  const clearAuthData = async () => {
    try {
('🧹 Limpando dados de autenticação...');
      await AsyncStorage.removeItem('userData');
      await cloudLoginService.logout();
      // NÃO limpar credenciais locais aqui - elas devem persistir para login offline
      // await localAuthService.clearCredentials(); // Removido
      setUser(null);
      setIsAuthenticated(false);
('✅ Dados de autenticação limpos (exceto credenciais locais)');
    } catch (error) {
      console.error('❌ Erro ao limpar dados de autenticação:', error);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
('🔐 Iniciando processo de login para:', username);
      
      // Primeiro, tentar login online
      try {
        const onlineResult = await cloudLoginService.loginUser(username, password);
        
('🌐 Resultado do login online:', {
          success: onlineResult.success,
          hasUserData: !!onlineResult.userData,
          hasSessionId: !!onlineResult.sessionId,
          userData: onlineResult.userData,
          sessionId: onlineResult.sessionId
        });
        
        // Verificar se o login online foi bem-sucedido
        if (onlineResult.success && onlineResult.userData && onlineResult.sessionId) {
          // Login online bem-sucedido - salvar credenciais localmente
('✅ Login online bem-sucedido, salvando credenciais...');
          
          const credentialsSaved = await localAuthService.saveCredentials(username, password, onlineResult.sessionId);
('💾 Credenciais salvas:', credentialsSaved);
          
          // Salvar dados do usuário
          await AsyncStorage.setItem('userData', JSON.stringify(onlineResult.userData));
          setUser(onlineResult.userData);
          setIsAuthenticated(true);
          
('🎉 Login online concluído com sucesso!');
          return { success: true, message: 'Login realizado com sucesso!' };
        } else {
('❌ Login online falhou - condições não atendidas:', {
            success: onlineResult.success,
            hasUserData: !!onlineResult.userData,
            hasSessionId: !!onlineResult.sessionId
          });
          // Login online falhou - tentar login offline
          const offlineResult = await localAuthService.validateOfflineLogin(username, password);
          
          if (offlineResult.success && offlineResult.credentials) {
            // Login offline bem-sucedido
            const userData: CloudUser = {
              id: 0, // ID temporário para login offline
              username: offlineResult.credentials.email,
              name: offlineResult.credentials.email,
              email: offlineResult.credentials.email,
              created_at: new Date().toISOString(),
              sessionId: offlineResult.credentials.sessionId
            };
            
            setUser(userData);
            setIsAuthenticated(true);
            
            return { success: true, message: 'Login offline realizado com sucesso!' };
          } else {
            return { success: false, message: offlineResult.message };
          }
        }
      } catch (onlineError) {
('❌ Erro no login online:', onlineError);
        // Login online falhou, tentando offline
        
        // Login online falhou - tentar login offline
        const offlineResult = await localAuthService.validateOfflineLogin(username, password);
        
        if (offlineResult.success && offlineResult.credentials) {
          // Login offline bem-sucedido
          const userData: CloudUser = {
            id: 0, // ID temporário para login offline
            username: offlineResult.credentials.email,
            name: offlineResult.credentials.email,
            email: offlineResult.credentials.email,
            created_at: new Date().toISOString(),
            sessionId: offlineResult.credentials.sessionId
          };
          
          setUser(userData);
          setIsAuthenticated(true);
          
          return { success: true, message: 'Login offline realizado com sucesso!' };
        } else {
          return { success: false, message: offlineResult.message };
        }
      }
    } catch (error) {
      console.error('❌ Erro geral no login:', error);
      return { success: false, message: 'Falha na autenticação. Verifique suas credenciais.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
('🚪 Fazendo logout...');
      await clearAuthData();
      await localAuthService.clearCredentials(); // Limpar credenciais SQLite no logout explícito
      setUser(null);
      setIsAuthenticated(false);
('✅ Logout concluído');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async (): Promise<boolean> => {
    try {
      const isValid = await validateSessionWithServer();
      
      if (!isValid) {
        await clearAuthData();
      }
      
      return isValid;
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      await clearAuthData();
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
