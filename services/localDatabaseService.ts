import * as SQLite from 'expo-sqlite';
import { TruckLoadFormData } from './addTruckService';

// Interface para os dados salvos localmente
export interface LocalTruckLoad {
  id: string;
  reg_date: string;
  reg_time: string;
  truck: string;
  othertruck: string;
  farm: string;
  otherfarm: string;
  field: string;
  otherfield: string;
  variety: string;
  othervariety: string;
  driver: string;
  otherdriver: string;
  destination: string;
  otherdestination: string;
  dnote: string;
  agreement: string;
  otheragreement: string;
  status: 'pending' | 'synced';
  created_at: string;
  synced_at?: string;
}

// Interface para dados de dropdown salvos localmente
export interface LocalDropdownData {
  id: string;
  type: 'truck' | 'farm' | 'field' | 'variety' | 'driver' | 'destination' | 'agreement';
  value: string;
  created_at: string;
}

class LocalDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mtfa_local.db');
      await this.createTables();
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    try {
      // Tabela de carregamentos
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS truck_loads (
          id TEXT PRIMARY KEY,
          reg_date TEXT NOT NULL,
          reg_time TEXT NOT NULL,
          truck TEXT NOT NULL,
          othertruck TEXT,
          farm TEXT NOT NULL,
          otherfarm TEXT,
          field TEXT NOT NULL,
          otherfield TEXT,
          variety TEXT NOT NULL,
          othervariety TEXT,
          driver TEXT NOT NULL,
          otherdriver TEXT,
          destination TEXT NOT NULL,
          otherdestination TEXT,
          dnote TEXT,
          agreement TEXT NOT NULL,
          otheragreement TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL,
          synced_at TEXT
        );
      `);

      // Tabela de dados de dropdown
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS dropdown_data (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          value TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);

      // Índices para melhor performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_truck_loads_status ON truck_loads(status);
        CREATE INDEX IF NOT EXISTS idx_truck_loads_created_at ON truck_loads(created_at);
        CREATE INDEX IF NOT EXISTS idx_dropdown_data_type ON dropdown_data(type);
      `);

      // Tabelas do banco de dados criadas com sucesso
    } catch (error) {
      console.error('Erro ao criar tabelas:', error);
    }
  }

  // Gerar ID único para registros
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Salvar carregamento localmente
  async saveTruckLoad(formData: TruckLoadFormData): Promise<{ success: boolean; id: string; message: string }> {
    if (!this.db) {
      return { success: false, id: '', message: 'Banco de dados não inicializado' };
    }

    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      await this.db.runAsync(
        `INSERT INTO truck_loads (
          id, reg_date, reg_time, truck, othertruck, farm, otherfarm, 
          field, otherfield, variety, othervariety, driver, otherdriver,
          destination, otherdestination, dnote, agreement, otheragreement,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          formData.reg_date,
          formData.reg_time,
          formData.truck,
          formData.othertruck,
          formData.farm,
          formData.otherfarm,
          formData.field,
          formData.otherfield,
          formData.variety,
          formData.othervariety,
          formData.driver,
          formData.otherdriver,
          formData.destination,
          formData.otherdestination,
          formData.dnote,
          formData.agreement,
          formData.otheragreement,
          'pending',
          now
        ]
      );

      return {
        success: true,
        id,
        message: 'Carregamento salvo localmente com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao salvar carregamento:', error);
      return {
        success: false,
        id: '',
        message: 'Falha ao salvar carregamento no banco local'
      };
    }
  }

  // Buscar todos os carregamentos
  async getAllTruckLoads(): Promise<LocalTruckLoad[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM truck_loads ORDER BY created_at DESC`
      ) as LocalTruckLoad[];

      return result;
    } catch (error) {
      console.error('Erro ao buscar carregamentos:', error);
      return [];
    }
  }

  // Buscar carregamentos pendentes de sincronização
  async getPendingTruckLoads(): Promise<LocalTruckLoad[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM truck_loads WHERE status = 'pending' ORDER BY created_at ASC`
      ) as LocalTruckLoad[];

      return result;
    } catch (error) {
      console.error('Erro ao buscar carregamentos pendentes:', error);
      return [];
    }
  }

  // Marcar carregamento como sincronizado
  async markAsSynced(id: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();
      await this.db.runAsync(
        `UPDATE truck_loads SET status = 'synced', synced_at = ? WHERE id = ?`,
        [now, id]
      );

      return true;
    } catch (error) {
      console.error('Erro ao marcar como sincronizado:', error);
      return false;
    }
  }

  // Salvar dados de dropdown localmente
  async saveDropdownData(type: string, value: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      // Verificar se já existe
      const existing = await this.db.getFirstAsync(
        `SELECT id FROM dropdown_data WHERE type = ? AND value = ?`,
        [type, value]
      );

      if (existing) {
        return true; // Já existe
      }

      await this.db.runAsync(
        `INSERT INTO dropdown_data (id, type, value, created_at) VALUES (?, ?, ?, ?)`,
        [id, type, value, now]
      );

      return true;
    } catch (error) {
      console.error('Erro ao salvar dados de dropdown:', error);
      return false;
    }
  }

  // Buscar dados de dropdown por tipo
  async getDropdownData(type: string): Promise<string[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync(
        `SELECT value FROM dropdown_data WHERE type = ? ORDER BY value ASC`,
        [type]
      ) as { value: string }[];

      return result.map(row => row.value);
    } catch (error) {
      console.error('Erro ao buscar dados de dropdown:', error);
      return [];
    }
  }

  // Buscar todos os dados de dropdown
  async getAllDropdownData(): Promise<Record<string, string[]>> {
    if (!this.db) return {};

    try {
      const types = ['truck', 'farm', 'field', 'variety', 'driver', 'destination', 'agreement'];
      const result: Record<string, string[]> = {};

      for (const type of types) {
        result[type] = await this.getDropdownData(type);
      }

      return result;
    } catch (error) {
      console.error('Erro ao buscar todos os dados de dropdown:', error);
      return {};
    }
  }

  // Deletar carregamento
  async deleteTruckLoad(id: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.runAsync(`DELETE FROM truck_loads WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar carregamento:', error);
      return false;
    }
  }

  // Limpar dados antigos (opcional - para manutenção)
  async cleanupOldData(daysToKeep: number = 30): Promise<boolean> {
    if (!this.db) return false;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffISO = cutoffDate.toISOString();

      await this.db.runAsync(
        `DELETE FROM truck_loads WHERE created_at < ? AND status = 'synced'`,
        [cutoffISO]
      );

      return true;
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      return false;
    }
  }

  // Estatísticas do banco
  async getStats(): Promise<{ total: number; pending: number; synced: number }> {
    if (!this.db) return { total: 0, pending: 0, synced: 0 };

    try {
      const totalResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM truck_loads`
      ) as { count: number };

      const pendingResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM truck_loads WHERE status = 'pending'`
      ) as { count: number };

      const syncedResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM truck_loads WHERE status = 'synced'`
      ) as { count: number };

      return {
        total: totalResult.count,
        pending: pendingResult.count,
        synced: syncedResult.count
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, pending: 0, synced: 0 };
    }
  }
}

// Instância singleton do serviço
export const localDatabaseService = new LocalDatabaseService();
