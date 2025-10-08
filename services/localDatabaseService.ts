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

// Interface para credenciais de usuário salvas localmente
export interface LocalUserCredentials {
  id: string;
  email: string;
  password_hash: string; // Senha criptografada
  session_id?: string;
  last_login: string;
  is_validated: boolean;
  created_at: string;
}

class LocalDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initDatabase();
  }

  // Aguardar inicialização do banco
  private async waitForInitialization(): Promise<void> {
    let attempts = 0;
    while (!this.isInitialized && attempts < 100) { // Aumentei para 100 tentativas (10 segundos)
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.isInitialized) {
      console.error('❌ Timeout na inicialização do banco de dados após 10 segundos');
      throw new Error('Timeout na inicialização do banco de dados');
    }
    
  }

  private async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mtfa_local.db');
      
('📋 Criando tabelas...');
      await this.createTables();
      
      this.isInitialized = true;
('🎉 Banco de dados SQLite inicializado completamente!');
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      console.error('❌ Banco de dados não disponível para criar tabelas');
      return;
    }

    try {
('📋 Criando tabelas do banco de dados...');
      
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

      // Tabela de credenciais de usuário
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_credentials (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          session_id TEXT,
          last_login TEXT NOT NULL,
          is_validated INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        );
      `);

      // Índices para melhor performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_truck_loads_status ON truck_loads(status);
        CREATE INDEX IF NOT EXISTS idx_truck_loads_created_at ON truck_loads(created_at);
        CREATE INDEX IF NOT EXISTS idx_dropdown_data_type ON dropdown_data(type);
        CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON user_credentials(email);
        CREATE INDEX IF NOT EXISTS idx_user_credentials_last_login ON user_credentials(last_login);
      `);

('✅ Tabelas do banco de dados criadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error);
      throw error;
    }
  }

  // Gerar ID único para registros
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Salvar carregamento localmente
  async saveTruckLoad(formData: TruckLoadFormData): Promise<{ success: boolean; id: string; message: string }> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado');
        return { success: false, id: '', message: 'Banco de dados não inicializado' };
      }

      const id = this.generateId();
      const now = new Date().toISOString();

('💾 Salvando carregamento no banco local:', { id, truck: formData.truck, farm: formData.farm });

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

('✅ Carregamento salvo localmente com sucesso:', id);
      return {
        success: true,
        id,
        message: 'Carregamento salvo localmente com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao salvar carregamento:', error);
      return {
        success: false,
        id: '',
        message: 'Falha ao salvar carregamento no banco local'
      };
    }
  }

  // Buscar todos os carregamentos
  async getAllTruckLoads(): Promise<LocalTruckLoad[]> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getAllTruckLoads');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM truck_loads ORDER BY created_at DESC`
      ) as LocalTruckLoad[];

(`📊 Carregamentos encontrados no banco local: ${result.length}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar carregamentos:', error);
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
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para saveDropdownData');
        return false;
      }

      const id = this.generateId();
      const now = new Date().toISOString();

('💾 Salvando item de dropdown:', {
        id,
        type,
        value,
        timestamp: now
      });

      // Verificar se já existe
      const existing = await this.db.getFirstAsync(
        `SELECT id FROM dropdown_data WHERE type = ? AND value = ?`,
        [type, value]
      );

      if (existing) {
(`📋 Item de dropdown "${value}" (${type}) já existe`);
        return true; // Já existe
      }

      await this.db.runAsync(
        `INSERT INTO dropdown_data (id, type, value, created_at) VALUES (?, ?, ?, ?)`,
        [id, type, value, now]
      );

(`✅ Item de dropdown "${value}" (${type}) salvo localmente com ID: ${id}`);
      
      // Verificar se foi salvo corretamente
      const verification = await this.db.getFirstAsync(
        `SELECT * FROM dropdown_data WHERE id = ?`,
        [id]
      );
      
      if (verification) {
('✅ Verificação de salvamento bem-sucedida:', verification);
      } else {
('❌ Falha na verificação de salvamento');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar dados de dropdown:', error);
      return false;
    }
  }

  // Buscar dados de dropdown por tipo
  async getDropdownData(type: string): Promise<string[]> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getDropdownData');
        return [];
      }

      
      const result = await this.db.getAllAsync(
        `SELECT value FROM dropdown_data WHERE type = ? ORDER BY value ASC`,
        [type]
      ) as { value: string }[];

      const values = result.map(row => row.value);
(`📊 ${type}: ${values.length} itens encontrados`, values);
      
      return values;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de dropdown:', error);
      return [];
    }
  }

  // Buscar todos os dados de dropdown
  async getAllDropdownData(): Promise<Record<string, string[]>> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getAllDropdownData');
        return {};
      }

('📋 Buscando todos os dados de dropdown...');
      
      // Primeiro, vamos ver todos os dados salvos no banco
      const allData = await this.db.getAllAsync(
        `SELECT type, value FROM dropdown_data ORDER BY type, value ASC`
      ) as { type: string; value: string }[];
      
('📋 Todos os dados encontrados no banco:', allData);
      
      const types = ['truck', 'farm', 'field', 'variety', 'driver', 'destination', 'agreement'];
      const result: Record<string, string[]> = {};

      for (const type of types) {
        
        // Buscar tanto tipo singular quanto plural para compatibilidade
        const singularData = await this.getDropdownData(type);
        const pluralData = await this.getDropdownData(type + 's');
        
        // Combinar dados singulares e plurais, removendo duplicatas
        const combinedData = [...new Set([...singularData, ...pluralData])];
        
        result[type] = combinedData;
(`📊 ${type}: ${combinedData.length} itens encontrados`, combinedData);
      }

      const summary = Object.keys(result).map(k => `${k}: ${result[k].length}`).join(', ');
('📋 Dados de dropdown carregados:', summary);
('📋 Dados completos:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar todos os dados de dropdown:', error);
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

  // ===== MÉTODOS PARA CREDENCIAIS DE USUÁRIO =====

  // Salvar credenciais de usuário
  async saveUserCredentials(email: string, passwordHash: string, sessionId?: string): Promise<boolean> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para saveUserCredentials');
        return false;
      }

      const id = this.generateId();
      const now = new Date().toISOString();

('💾 Salvando credenciais de usuário no banco local:', { email, hasSessionId: !!sessionId });

      // Verificar se já existe credencial para este email
      const existing = await this.db.getFirstAsync(
        `SELECT id FROM user_credentials WHERE email = ?`,
        [email]
      );

      if (existing) {
        // Atualizar credenciais existentes
        await this.db.runAsync(
          `UPDATE user_credentials SET 
            password_hash = ?, 
            session_id = ?, 
            last_login = ?, 
            is_validated = 1 
           WHERE email = ?`,
          [passwordHash, sessionId, now, email]
        );
('✅ Credenciais de usuário atualizadas:', email);
      } else {
        // Inserir novas credenciais
        await this.db.runAsync(
          `INSERT INTO user_credentials (id, email, password_hash, session_id, last_login, is_validated, created_at) 
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [id, email, passwordHash, sessionId, now, now]
        );
('✅ Credenciais de usuário salvas:', email);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais de usuário:', error);
      return false;
    }
  }

  // Buscar credenciais de usuário por email
  async getUserCredentials(email: string): Promise<LocalUserCredentials | null> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getUserCredentials');
        return null;
      }

      const result = await this.db.getFirstAsync(
        `SELECT * FROM user_credentials WHERE email = ?`,
        [email]
      ) as LocalUserCredentials | null;

      if (result) {
('📋 Credenciais encontradas para:', email);
      } else {
('❌ Nenhuma credencial encontrada para:', email);
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar credenciais de usuário:', error);
      return null;
    }
  }

  // Buscar a primeira credencial disponível (para compatibilidade)
  async getFirstUserCredentials(): Promise<LocalUserCredentials | null> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getFirstUserCredentials');
        return null;
      }

      const result = await this.db.getFirstAsync(
        `SELECT * FROM user_credentials ORDER BY last_login DESC LIMIT 1`
      ) as LocalUserCredentials | null;

      if (result) {
('📋 Primeira credencial encontrada para:', result.email);
      } else {
('❌ Nenhuma credencial encontrada');
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar primeira credencial:', error);
      return null;
    }
  }

  // Verificar se há credenciais salvas
  async hasUserCredentials(): Promise<boolean> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para hasUserCredentials');
        return false;
      }

      const result = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM user_credentials`
      ) as { count: number };

      const hasCredentials = result.count > 0;
('🔍 Tem credenciais salvas?', hasCredentials);
      return hasCredentials;
    } catch (error) {
      console.error('❌ Erro ao verificar credenciais de usuário:', error);
      return false;
    }
  }

  // Verificar se credenciais são válidas (último login há menos de 30 dias)
  async areCredentialsValid(email: string): Promise<boolean> {
    try {
      const credentials = await this.getUserCredentials(email);
      if (!credentials) return false;

      const lastLogin = new Date(credentials.last_login);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

('📅 Dias desde último login:', daysDiff);
      return daysDiff <= 30 && credentials.is_validated;
    } catch (error) {
      console.error('❌ Erro ao verificar validade das credenciais:', error);
      return false;
    }
  }

  // Limpar credenciais de usuário
  async clearUserCredentials(): Promise<boolean> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para clearUserCredentials');
        return false;
      }

      await this.db.runAsync(`DELETE FROM user_credentials`);
('✅ Credenciais de usuário removidas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar credenciais de usuário:', error);
      return false;
    }
  }

  // Atualizar session ID das credenciais
  async updateSessionId(email: string, sessionId: string): Promise<boolean> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para updateSessionId');
        return false;
      }

      await this.db.runAsync(
        `UPDATE user_credentials SET session_id = ?, last_login = ? WHERE email = ?`,
        [sessionId, new Date().toISOString(), email]
      );

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar session ID:', error);
      return false;
    }
  }

  // Limpar dados de exemplo do banco
  async clearExampleData(): Promise<void> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        throw new Error('Banco de dados não inicializado');
      }

      // Lista de dados de exemplo para remover
      const exampleData = [
        // Caminhões de exemplo
        'Caminhão 1', 'Caminhão 2', 'Caminhão 001', 'Caminhão 002', 'Caminhão 003', 'Caminhão 004', 'Caminhão 005', 'Caminhão 006',
        // Fazendas de exemplo
        'Fazenda Central', 'Fazenda Leste', 'Fazenda Norte', 'Fazenda Oeste', 'Fazenda Sul',
        // Campos de exemplo
        'Campo Central', 'Campo Leste', 'Campo Norte', 'Campo Oeste', 'Campo Sul',
        // Motoristas de exemplo
        'Ana Souza', 'Carlos Lima', 'João Silva', 'Maria Santos', 'Pedro Costa',
        // Destinos de exemplo
        'Armazém 12', 'Fábrica ABC', 'Porto Santos', 'Silo Central', 'Terminal XYZ',
        // Acordos de exemplo
        'Acordo Especial', 'Acordo Padrão', 'Contrato Anual', 'Contrato Mensal'
      ];

      // Remover dados de exemplo
      for (const value of exampleData) {
        await this.db.runAsync(
          `DELETE FROM dropdown_data WHERE value = ?`,
          [value]
        );
      }

    } catch (error) {
      console.error('❌ Erro ao limpar dados de exemplo:', error);
    }
  }
}

// Instância singleton do serviço
export const localDatabaseService = new LocalDatabaseService();
