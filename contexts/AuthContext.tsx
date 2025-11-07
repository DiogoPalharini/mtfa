import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hybridAuthService, CloudUser } from '../services/HybridAuthService';
import { localAuthService } from '../services/localAuthService';
import { syncService } from '../services/syncService';
import { useErrorTranslations } from '../hooks/useErrorTranslations';
import { useLanguage } from './LanguageContext';
import { commonI18n } from '../i18n/common';

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
  const { language } = useLanguage();
  const commonT = commonI18n[language];

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
      
      // Verificar se há credenciais locais também (com tratamento de erro)
      let hasLocalCredentials = false;
      try {
        hasLocalCredentials = await localAuthService.hasStoredCredentials();
        console.log('🔍 Tem credenciais locais?', hasLocalCredentials);
      } catch (localError) {
        console.error('❌ Erro ao verificar credenciais locais:', localError);
        // Continuar sem credenciais locais se houver erro
        hasLocalCredentials = false;
      }
      
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
        
        // Tentar restaurar dados do usuário salvos no AsyncStorage
        try {
          const savedUserData = await AsyncStorage.getItem('userData');
          const savedHybridUser = await AsyncStorage.getItem('hybrid_user');
          const offlineMode = await AsyncStorage.getItem('offline_mode');
          
          if (savedUserData || savedHybridUser) {
            const userData = savedUserData ? JSON.parse(savedUserData) : JSON.parse(savedHybridUser!);
            
            // Verificar se os dados do usuário são válidos
            if (userData && userData.email) {
              console.log('✅ Restaurando dados do usuário salvos para modo offline:', userData.email);
              setUser(userData as CloudUser);
              setIsAuthenticated(true);
              console.log('✅ Usuário autenticado via dados salvos offline');
            }
          } else if (offlineMode === 'true') {
            const activeOfflineEmail = await AsyncStorage.getItem('offline_active_email');
            if (activeOfflineEmail) {
              const credentials = await localAuthService.getStoredCredentialsByEmail(activeOfflineEmail);
              if (credentials) {
                const userData: CloudUser = {
                  id: 0,
                  name: credentials.name || credentials.email.split('@')[0] || credentials.email,
                  email: credentials.email,
                  level: 'Licencee'
                };

                await Promise.all([
                  AsyncStorage.setItem('userData', JSON.stringify(userData)),
                  AsyncStorage.setItem('hybrid_user', JSON.stringify(userData))
                ]);

                setUser(userData);
                setIsAuthenticated(true);
                console.log('✅ Usuário restaurado via email ativo para modo offline');
              }
            }
          }
        } catch (restoreError) {
          console.error('❌ Erro ao restaurar dados do usuário:', restoreError);
          // Continuar sem restaurar, permitir login offline manual
        }
        
        // Não limpar dados, permitir login offline
      } else {
        // Não há nem usuário logado nem credenciais locais
        console.log('🔍 Sem usuário logado nem credenciais locais');
        await clearAuthData();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      // Em caso de erro, não limpar dados automaticamente
console.log('⚠️ Erro na verificação, mantendo estado atual');
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
      // Limpar dados de autenticação, mas manter credenciais locais para login offline
      await Promise.all([
        AsyncStorage.removeItem('userData'),
        AsyncStorage.removeItem('hybrid_user'),
        AsyncStorage.removeItem('offline_active_email'),
        hybridAuthService.logout()
      ]);
      
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
      if (!user?.email) {
        console.warn('⚠️ Não há email do usuário disponível para sincronização automática');
        return;
      }

      const stats = await syncService.getStats(user.email);
      console.log('📊 Estatísticas de sincronização:', stats);
      
      if (stats.pending > 0) {
        console.log(`🔄 Encontrados ${stats.pending} itens pendentes, iniciando sincronização...`);
        
        // Executar sincronização em background (não bloquear a UI)
        setTimeout(async () => {
          try {
            const syncResult = await syncService.syncAllPendingLoads(user.email);
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

  // Função auxiliar para verificar conectividade rapidamente
  const checkInternetConnection = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout rápido de 2 segundos
      
      const response = await fetch('https://mtfa.freenetic.ch', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
console.log('🔐 Iniciando processo de login para:', username);

      const normalizedUsername = username.toLowerCase().trim();
      
      // Verificar conectividade antes de tentar login online
      const hasInternet = await checkInternetConnection();
      console.log('🌐 Tem internet?', hasInternet);
      
      // Se não tem internet, ir direto para login offline
      if (!hasInternet) {
        console.log('📡 Sem internet, tentando login offline diretamente...');
        const offlineResult = await localAuthService.validateOfflineLogin(username, password);
        
        if (offlineResult.success && offlineResult.credentials) {
          // Login offline bem-sucedido
          console.log('✅ Login offline bem-sucedido (sem internet), configurando dados do usuário...');
          const userData: CloudUser = {
            id: 0,
            name: offlineResult.credentials.name || offlineResult.credentials.email.split('@')[0] || offlineResult.credentials.email,
            email: offlineResult.credentials.email,
            level: 'Licencee'
          };
          
          try {
          await Promise.all([
            AsyncStorage.setItem('userData', JSON.stringify(userData)),
            AsyncStorage.setItem('hybrid_user', JSON.stringify(userData)),
            AsyncStorage.setItem('offline_mode', 'true'),
            AsyncStorage.setItem('offline_active_email', userData.email.toLowerCase().trim())
          ]);
            console.log('💾 Dados do usuário salvos no AsyncStorage para login offline');
          } catch (storageError) {
            console.error('❌ Erro ao salvar dados do usuário:', storageError);
          }
          
          setUser(userData);
          setIsAuthenticated(true);
          
          console.log('🎉 Login offline concluído com sucesso (sem internet)!');
          return { success: true, message: t('loginSuccess') };
        } else {
          return { success: false, message: offlineResult.message || t('loginFailed') };
        }
      }
      
      // Se tem internet, tentar login online primeiro
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
          
          // Salvar credenciais com email, senha, sessionId e nome do usuário
          const credentialsSaved = await localAuthService.saveCredentials(
            username, 
            password, 
            hybridResult.sessionCookie,
            hybridResult.user.name
          );
          console.log('💾 Credenciais salvas:', credentialsSaved);
          
          if (!credentialsSaved) {
            console.error('⚠️ AVISO: Falha ao salvar credenciais para login offline!');
          }
          
          // Salvar dados do usuário e limpar flag de modo offline
          await Promise.all([
            AsyncStorage.setItem('userData', JSON.stringify(hybridResult.user)),
            AsyncStorage.removeItem('offline_mode'),
            AsyncStorage.setItem('offline_active_email', hybridResult.user.email.toLowerCase().trim())
          ]);
          
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
          console.log('🔄 Tentando login offline após falha do login híbrido...');
          const offlineResult = await localAuthService.validateOfflineLogin(username, password);
          
          if (offlineResult.success && offlineResult.credentials) {
            // Login offline bem-sucedido
            console.log('✅ Login offline bem-sucedido, configurando dados do usuário...');
            const userData: CloudUser = {
              id: 0, // ID temporário para login offline
              name: offlineResult.credentials.name || offlineResult.credentials.email.split('@')[0] || offlineResult.credentials.email,
              email: offlineResult.credentials.email,
              level: 'Licencee' // Padrão para login offline
            };
            
            // Salvar dados do usuário no AsyncStorage para persistência
            // Salvar tanto em userData quanto nos campos do HybridAuthService para compatibilidade
            try {
              await Promise.all([
                AsyncStorage.setItem('userData', JSON.stringify(userData)),
                AsyncStorage.setItem('hybrid_user', JSON.stringify(userData)),
                AsyncStorage.setItem('offline_mode', 'true'),
                AsyncStorage.setItem('offline_active_email', userData.email.toLowerCase().trim())
              ]);
              console.log('💾 Dados do usuário salvos no AsyncStorage para login offline');
            } catch (storageError) {
              console.error('❌ Erro ao salvar dados do usuário:', storageError);
              // Continuar mesmo com erro de storage
            }
            
            setUser(userData);
            setIsAuthenticated(true);
            
            console.log('🎉 Login offline concluído com sucesso!');
            return { success: true, message: t('loginSuccess') };
          } else {
            return { success: false, message: t('loginFailed') };
          }
        }
      } catch (hybridError) {
        console.log('❌ Erro no login híbrido:', hybridError);
        // Login híbrido falhou, tentando offline
        
        console.log('🔄 Tentando login offline após erro no login híbrido...');
        // Login online falhou - tentar login offline
        const offlineResult = await localAuthService.validateOfflineLogin(username, password);
        
        if (offlineResult.success && offlineResult.credentials) {
          // Login offline bem-sucedido
          console.log('✅ Login offline bem-sucedido (segundo caso), configurando dados do usuário...');
          const userData: CloudUser = {
            id: 0, // ID temporário para login offline
            name: offlineResult.credentials.name || offlineResult.credentials.email.split('@')[0] || offlineResult.credentials.email,
            email: offlineResult.credentials.email,
            level: 'Licencee' // Padrão para login offline
          };
          
          // Salvar dados do usuário no AsyncStorage para persistência
          // Salvar tanto em userData quanto nos campos do HybridAuthService para compatibilidade
          try {
            await Promise.all([
              AsyncStorage.setItem('userData', JSON.stringify(userData)),
              AsyncStorage.setItem('hybrid_user', JSON.stringify(userData)),
              AsyncStorage.setItem('offline_mode', 'true'),
              AsyncStorage.setItem('offline_active_email', userData.email.toLowerCase().trim())
            ]);
            console.log('💾 Dados do usuário salvos no AsyncStorage para login offline (segundo caso)');
          } catch (storageError) {
            console.error('❌ Erro ao salvar dados do usuário:', storageError);
            // Continuar mesmo com erro de storage
          }
          
          setUser(userData);
          setIsAuthenticated(true);
          
          console.log('🎉 Login offline concluído com sucesso (segundo caso)!');
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
      console.log('🚪 Fazendo logout...');
      
      // Limpar dados de sessão, mas MANTER credenciais salvas para login offline
      await clearAuthData();
      
      // NÃO limpar credenciais do SQLite - elas devem permanecer para login offline
      // await localAuthService.clearCredentials(); // REMOVIDO - credenciais devem permanecer
      
      // Limpar também a flag de modo offline
      try {
        await AsyncStorage.removeItem('offline_mode');
      } catch (error) {
        // Ignorar erro se não existir
      }
      
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Logout concluído (credenciais mantidas para login offline)');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async (): Promise<boolean> => {
    try {
      // Se estiver em modo offline, considerar sessão válida
      try {
        const offlineMode = await AsyncStorage.getItem('offline_mode');
        if (offlineMode === 'true') {
          return true;
        }
      } catch {}

      // Usar o sistema híbrido para verificar se o usuário está logado
      const isLoggedIn = hybridAuthService.isLoggedIn();
      
      if (!isLoggedIn) {
        await clearAuthData();
      }
      
      return isLoggedIn;
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      // Em erro de verificação, se modo offline estiver ativo, permitir
      try {
        const offlineMode = await AsyncStorage.getItem('offline_mode');
        if (offlineMode === 'true') {
          return true;
        }
      } catch {}
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
