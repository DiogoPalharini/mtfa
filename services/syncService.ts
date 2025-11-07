import { localDatabaseService, LocalTruckLoad } from './localDatabaseService';
import { addTruckService, TruckLoadFormData } from './addTruckService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTranslatedMessage, ErrorMessages } from './translations';
import { LanguageCode } from '../contexts/LanguageContext';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  message: string;
}

class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;

  constructor() {
    this.checkConnectivity();
  }

  // Método para obter mensagens traduzidas
  private async getMessage(key: keyof ErrorMessages): Promise<string> {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      const language = (savedLanguage && ['pt', 'en', 'de'].includes(savedLanguage)) 
        ? savedLanguage as LanguageCode 
        : 'en';
      
      // Log temporário para debug
      if (key === 'noPendingLoads') {
        console.log(`🔍 DEBUG - Idioma salvo: ${savedLanguage}, Idioma usado: ${language}, Chave: ${key}`);
      }
      
      return getTranslatedMessage(key, language);
    } catch (error) {
      return getTranslatedMessage(key, 'en');
    }
  }

  // Verificar conectividade
  private async checkConnectivity(): Promise<void> {
    try {
      // Tentar fazer uma requisição simples para verificar conectividade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://mtfa.freenetic.ch', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
    }
  }

  // Verificar se está online
  isConnected(): boolean {
    return this.isOnline;
  }

  // Verificar se está sincronizando
  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  // Salvar carregamento (local + tentar sincronizar se online)
  async saveTruckLoad(formData: TruckLoadFormData, userEmail: string): Promise<{ success: boolean; message: string; synced: boolean }> {
    try {
      // Sempre salvar localmente primeiro
      const localResult = await localDatabaseService.saveTruckLoad(formData, userEmail);
      
      if (!localResult.success) {
        return {
          success: false,
          message: localResult.message,
          synced: false
        };
      }

      // Se estiver online, tentar sincronizar imediatamente
      if (this.isOnline) {
        const syncResult = await this.syncSingleLoad(localResult.id, userEmail);
        
        if (syncResult.success) {
          await localDatabaseService.markAsSynced(localResult.id, userEmail);
          return {
            success: true,
            message: await this.getMessage('loadSavedAndSynced'),
            synced: true
          };
        } else {
          return {
            success: true,
            message: await this.getMessage('loadSavedLocally'),
            synced: false
          };
        }
      } else {
        return {
          success: true,
          message: await this.getMessage('loadSavedLocally'),
          synced: false
        };
      }
    } catch (error) {
      // Erro ao salvar carregamento
      return {
        success: false,
        message: await this.getMessage('saveLoadFailed'),
        synced: false
      };
    }
  }

  // Sincronizar um carregamento específico
  private async syncSingleLoad(id: string, userEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const loads = await localDatabaseService.getAllTruckLoads(userEmail);
      const load = loads.find(l => l.id === id);
      
      if (!load) {
        return { success: false, message: await this.getMessage('loadNotFound') };
      }

      // Converter para formato do servidor
      const truckLoadData: TruckLoadFormData = {
        reg_date: load.reg_date,
        reg_time: load.reg_time,
        truck: load.truck,
        othertruck: load.othertruck,
        farm: load.farm,
        otherfarm: load.otherfarm,
        field: load.field,
        otherfield: load.otherfield,
        variety: load.variety,
        othervariety: load.othervariety,
        driver: load.driver,
        otherdriver: load.otherdriver,
        destination: load.destination,
        otherdestination: load.otherdestination,
        dnote: load.dnote,
        agreement: load.agreement,
        otheragreement: load.otheragreement,
      };

      // Tentar enviar para o servidor
      const result = await addTruckService.addTruckLoad(truckLoadData);
      
        if (result.success) {
          return { success: true, message: await this.getMessage('syncedSuccessfully') };
        } else {
          return { success: false, message: result.message };
        }
    } catch (error) {
      // Erro ao sincronizar carregamento
      return { success: false, message: await this.getMessage('serverSyncFailed') };
    }
  }

  // Sincronizar todos os carregamentos pendentes
  async syncAllPendingLoads(userEmail: string): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        message: await this.getMessage('syncInProgress')
      };
    }

    this.isSyncing = true;

    try {
      // Verificar conectividade
      await this.checkConnectivity();
      
      if (!this.isOnline) {
        return {
          success: false,
          synced: 0,
          failed: 0,
          message: await this.getMessage('noInternetConnection')
        };
      }

      // Buscar carregamentos pendentes
      const pendingLoads = await localDatabaseService.getPendingTruckLoads(userEmail);
      
      if (pendingLoads.length === 0) {
        return {
          success: true,
          synced: 0,
          failed: 0,
          message: await this.getMessage('noPendingLoads')
        };
      }

      let synced = 0;
      let failed = 0;
      const errors: string[] = [];

      // Sincronizar cada carregamento
      for (const load of pendingLoads) {
        try {
          const result = await this.syncSingleLoad(load.id, userEmail);
          
          if (result.success) {
            await localDatabaseService.markAsSynced(load.id, userEmail);
            synced++;
          } else {
            failed++;
            errors.push(`${load.id}: ${result.message}`);
          }
        } catch (error) {
          failed++;
          errors.push(`${load.id}: Erro inesperado`);
        }
      }

      // Salvar timestamp da última sincronização
      await AsyncStorage.setItem('lastSyncTimestamp', Date.now().toString());

      const message = synced > 0 
        ? `${synced} ${await this.getMessage('syncSuccessMessage')}${failed > 0 ? `. ${failed} ${await this.getMessage('syncFailedCount')}.` : '.'}`
        : await this.getMessage('syncNoLoadsMessage');

      return {
        success: synced > 0,
        synced,
        failed,
        message
      };

    } catch (error) {
      // Erro na sincronização geral
      return {
        success: false,
        synced: 0,
        failed: 0,
        message: await this.getMessage('syncFailed')
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Buscar todos os carregamentos (locais)
  async getAllTruckLoads(userEmail: string): Promise<LocalTruckLoad[]> {
    return await localDatabaseService.getAllTruckLoads(userEmail);
  }

  // Buscar estatísticas
  async getStats(userEmail: string): Promise<{ total: number; pending: number; synced: number }> {
    return await localDatabaseService.getStats(userEmail);
  }

  // Salvar dados de dropdown localmente
  async saveDropdownData(type: string, value: string, userEmail: string): Promise<boolean> {
    return await localDatabaseService.saveDropdownData(type, value, userEmail);
  }

  // Buscar dados de dropdown
  async getDropdownData(type: string, userEmail: string): Promise<string[]> {
    return await localDatabaseService.getDropdownData(type, userEmail);
  }

  // Buscar todos os dados de dropdown
  async getAllDropdownData(userEmail: string): Promise<Record<string, string[]>> {
    return await localDatabaseService.getAllDropdownData(userEmail);
  }

  // Deletar carregamento
  async deleteTruckLoad(id: string, userEmail: string): Promise<boolean> {
    return await localDatabaseService.deleteTruckLoad(id, userEmail);
  }

  // Limpar dados de exemplo do banco
  async clearExampleData(): Promise<void> {
    return await localDatabaseService.clearExampleData();
  }
  async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem('lastSyncTimestamp');
      return timestamp ? new Date(parseInt(timestamp)) : null;
    } catch (error) {
      return null;
    }
  }

  // Forçar verificação de conectividade
  async forceConnectivityCheck(): Promise<boolean> {
    await this.checkConnectivity();
    return this.isOnline;
  }
}

// Instância singleton do serviço
export const syncService = new SyncService();
