import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hybridAuthService, CloudUser } from '../services/HybridAuthService';
import { localAuthService } from '../services/localAuthService';
import { syncService } from '../services/syncService';
import { useErrorTranslations } from '../hooks/useErrorTranslations';

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
  const { t } = useErrorTranslations();

  // Verificar sessão salva na inicialização
  useEffect(() => {
    checkSavedSession();
    
    // Configurar callback para quando a sessão expirar automaticamente
    hybridAuthService.setSessionExpiredCallback(() => {
      handleSessionExpired();
    });
    
    // Cleanup: remover callback quando o componente for desmontado
    return () => {
      hybridAuthService.setSessionExpiredCallback(() => {});
    };
  }, []);

  const checkSavedSession = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Verificando sessão salva...');
      
      // Verificar se há usuário logado usando o sistema híbrido
      const isLoggedIn = hybridAuthService.isLoggedIn();
      console.log('🔍 Usuário está logado (híbrido)?', isLoggedIn);
      
      // Verificar se há credenciais locais também
      const hasLocalCredentials = await localAuthService.hasStoredCredentials();
      console.log('🔍 Tem credenciais locais?', hasLocalCredentials);
      
      if (isLoggedIn) {
        // Usuário está logado, obter dados do usuário
        const currentUser = hybridAuthService.getCurrentUser();
        console.log('🔍 Dados do usuário atual (híbrido):', currentUser);
        
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('✅ Usuário autenticado via dados salvos');
        }
      } else if (hasLocalCredentials) {
        // Não há usuário logado, mas há credenciais locais
        console.log('🔍 Sem usuário logado, mas há credenciais locais disponíveis');
        // Não limpar dados, permitir login offline
      } else {
        // Não há nem usuário logado nem credenciais locais
        console.log('🔍 Sem usuário logado nem credenciais locais');
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

  // Função para lidar com expiração automática da sessão
  const handleSessionExpired = async () => {
    await clearAuthData();
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await hybridAuthService.logout();
      // NÃO limpar credenciais locais aqui - elas devem persistir para login offline
      // await localAuthService.clearCredentials(); // Removido
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ Erro ao limpar dados de autenticação:', error);
    }
  };

  // Função para sincronização automática após login online
  const performAutoSync = async (): Promise<void> => {
    try {
      console.log('🔄 Iniciando sincronização automática após login online...');
      
      // Verificar se há itens pendentes para sincronizar
      const stats = await syncService.getStats();
      console.log('📊 Estatísticas de sincronização:', stats);
      
      if (stats.pending > 0) {
        console.log(`🔄 Encontrados ${stats.pending} itens pendentes, iniciando sincronização...`);
        
        // Executar sincronização em background (não bloquear a UI)
        setTimeout(async () => {
          try {
            const syncResult = await syncService.syncAllPendingLoads();
            console.log('✅ Sincronização automática concluída:', syncResult);
          } catch (error) {
            console.error('❌ Erro na sincronização automática:', error);
          }
        }, 1000); // Aguardar 1 segundo para não interferir no login
      } else {
        console.log('✅ Nenhum item pendente para sincronizar');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar itens pendentes:', error);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
('🔐 Iniciando processo de login para:', username);
      
      // Usar sistema híbrido para login
      try {
        const hybridResult = await hybridAuthService.login(username, password);
        
        console.log('🌐 Resultado do login híbrido:', {
          success: hybridResult.success,
          hasUser: !!hybridResult.user,
          hasCookie: !!hybridResult.sessionCookie,
          user: hybridResult.user
        });
        
        // Verificar se o login híbrido foi bem-sucedido
        if (hybridResult.success && hybridResult.user && hybridResult.sessionCookie) {
          // Login híbrido bem-sucedido - salvar credenciais localmente
          console.log('✅ Login híbrido bem-sucedido, salvando credenciais...');
          
          const credentialsSaved = await localAuthService.saveCredentials(username, password, 'session_id');
          console.log('💾 Credenciais salvas:', credentialsSaved);
          
          // Salvar dados do usuário
          await AsyncStorage.setItem('userData', JSON.stringify(hybridResult.user));
          setUser(hybridResult.user);
          setIsAuthenticated(true);
          
          // Executar sincronização automática após login online bem-sucedido
          await performAutoSync();
          
          console.log('🎉 Login híbrido concluído com sucesso!');
          return { success: true, message: t('loginSuccess') };
        } else {
          console.log('❌ Login híbrido falhou - condições não atendidas:', {
            success: hybridResult.success,
            hasUser: !!hybridResult.user,
            hasCookie: !!hybridResult.sessionCookie
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
            
            return { success: true, message: t('loginSuccess') };
          } else {
            return { success: false, message: t('loginFailed') };
          }
        }
      } catch (hybridError) {
        console.log('❌ Erro no login híbrido:', hybridError);
        // Login híbrido falhou, tentando offline
        
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
          
          return { success: true, message: t('loginSuccess') };
        } else {
          return { success: false, message: hybridError instanceof Error ? hybridError.message : t('loginFailed') };
        }
      }
    } catch (error) {
      console.error('❌ Erro geral no login:', error);
      return { success: false, message: t('loginFailed') };
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
      // Usar o sistema híbrido para verificar se o usuário está logado
      const isLoggedIn = hybridAuthService.isLoggedIn();
      
      if (!isLoggedIn) {
        await clearAuthData();
      }
      
      return isLoggedIn;
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
