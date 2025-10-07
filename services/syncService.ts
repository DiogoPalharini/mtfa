import { localDatabaseService, LocalTruckLoad } from './localDatabaseService';
import { addTruckService, TruckLoadFormData } from './addTruckService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  async saveTruckLoad(formData: TruckLoadFormData): Promise<{ success: boolean; message: string; synced: boolean }> {
    try {
      // Sempre salvar localmente primeiro
      const localResult = await localDatabaseService.saveTruckLoad(formData);
      
      if (!localResult.success) {
        return {
          success: false,
          message: localResult.message,
          synced: false
        };
      }

      // Se estiver online, tentar sincronizar imediatamente
      if (this.isOnline) {
        const syncResult = await this.syncSingleLoad(localResult.id);
        
        if (syncResult.success) {
          await localDatabaseService.markAsSynced(localResult.id);
          return {
            success: true,
            message: 'Carregamento salvo e sincronizado com sucesso!',
            synced: true
          };
        } else {
          return {
            success: true,
            message: 'Carregamento salvo localmente. Será sincronizado quando houver conexão.',
            synced: false
          };
        }
      } else {
        return {
          success: true,
          message: 'Carregamento salvo localmente. Será sincronizado quando houver conexão.',
          synced: false
        };
      }
    } catch (error) {
      // Erro ao salvar carregamento
      return {
        success: false,
        message: 'Falha ao salvar carregamento',
        synced: false
      };
    }
  }

  // Sincronizar um carregamento específico
  private async syncSingleLoad(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const loads = await localDatabaseService.getAllTruckLoads();
      const load = loads.find(l => l.id === id);
      
      if (!load) {
        return { success: false, message: 'Carregamento não encontrado' };
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
        return { success: true, message: 'Sincronizado com sucesso' };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      // Erro ao sincronizar carregamento
      return { success: false, message: 'Falha na sincronização com o servidor' };
    }
  }

  // Sincronizar todos os carregamentos pendentes
  async syncAllPendingLoads(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        message: 'Sincronização já em andamento'
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
          message: 'Sem conexão com a internet'
        };
      }

      // Buscar carregamentos pendentes
      const pendingLoads = await localDatabaseService.getPendingTruckLoads();
      
      if (pendingLoads.length === 0) {
        return {
          success: true,
          synced: 0,
          failed: 0,
          message: 'Nenhum carregamento pendente para sincronizar'
        };
      }

      let synced = 0;
      let failed = 0;
      const errors: string[] = [];

      // Sincronizar cada carregamento
      for (const load of pendingLoads) {
        try {
          const result = await this.syncSingleLoad(load.id);
          
          if (result.success) {
            await localDatabaseService.markAsSynced(load.id);
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
        ? `${synced} carregamento(s) sincronizado(s) com sucesso${failed > 0 ? `. ${failed} falharam.` : '.'}`
        : 'Nenhum carregamento foi sincronizado.';

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
        message: 'Falha durante a sincronização'
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Buscar todos os carregamentos (locais)
  async getAllTruckLoads(): Promise<LocalTruckLoad[]> {
    return await localDatabaseService.getAllTruckLoads();
  }

  // Buscar estatísticas
  async getStats(): Promise<{ total: number; pending: number; synced: number }> {
    return await localDatabaseService.getStats();
  }

  // Salvar dados de dropdown localmente
  async saveDropdownData(type: string, value: string): Promise<boolean> {
    return await localDatabaseService.saveDropdownData(type, value);
  }

  // Buscar dados de dropdown
  async getDropdownData(type: string): Promise<string[]> {
    return await localDatabaseService.getDropdownData(type);
  }

  // Buscar todos os dados de dropdown
  async getAllDropdownData(): Promise<Record<string, string[]>> {
    return await localDatabaseService.getAllDropdownData();
  }

  // Deletar carregamento
  async deleteTruckLoad(id: string): Promise<boolean> {
    return await localDatabaseService.deleteTruckLoad(id);
  }

  // Obter timestamp da última sincronização
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
