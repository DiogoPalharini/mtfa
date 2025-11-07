import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TruckLoadFormData } from './addTruckService';
import { getTranslatedMessage, ErrorMessages } from './translations';
import { LanguageCode } from '../contexts/LanguageContext';

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
  user_email: string | null;
}

// Interface para dados de dropdown salvos localmente
export interface LocalDropdownData {
  id: string;
  type: 'truck' | 'farm' | 'field' | 'variety' | 'driver' | 'destination' | 'agreement';
  value: string;
  created_at: string;
  user_email: string | null;
}

// Interface para credenciais de usuário salvas localmente
export interface LocalUserCredentials {
  id: string;
  email: string;
  name: string; // Nome do usuário
  password_hash: string; // Senha criptografada
  session_id?: string;
  last_login: string;
  is_validated: boolean;
  created_at: string;
}

class LocalDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  // Obter idioma atual do AsyncStorage
  private async getCurrentLanguage(): Promise<LanguageCode> {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage && ['pt', 'en', 'de'].includes(savedLanguage)) {
        return savedLanguage as LanguageCode;
      }
    } catch (error) {
      // Silenciar erro, usar inglês como padrão
    }
    return 'en';
  }

  // Obter mensagem traduzida
  private async getMessage(key: keyof ErrorMessages): Promise<string> {
    const language = await this.getCurrentLanguage();
    return getTranslatedMessage(key, language);
  }

  constructor() {
    // Inicializar de forma assíncrona para evitar problemas no APK
    this.initDatabase().catch(error => {
      console.error('❌ Erro na inicialização do banco:', error);
    });
  }

  // Aguardar inicialização do banco (método público para uso externo)
  public async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    let attempts = 0;
    while (!this.isInitialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!this.isInitialized) {
      throw new Error('Banco de dados não inicializado');
    }
  }

  private async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mtfa_local.db');
      await this.createTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error);
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }

  // Tentar reabrir o banco se algo falhou/fechou
  public async ensureInitialized(): Promise<void> {
    if (this.isInitialized && this.db) return;
    try {
      this.db = await SQLite.openDatabaseAsync('mtfa_local.db');
      await this.createTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Falha ao reabrir o banco:', error);
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }


  private async createTables(): Promise<void> {
    if (!this.db) {
      console.error('❌ Banco de dados não disponível para criar tabelas');
      return;
    }

    try {
      console.log('📋 Criando tabelas do banco de dados...');
      
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
          user_email TEXT,
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
          created_at TEXT NOT NULL,
          user_email TEXT
        );
      `);

      // Tabela de credenciais de usuário
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_credentials (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          session_id TEXT,
          last_login TEXT NOT NULL,
          is_validated INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        );
      `);

      // Migração: adicionar coluna name se não existir (para bancos já existentes)
      try {
        await this.db.execAsync(`
          ALTER TABLE user_credentials ADD COLUMN name TEXT;
        `);
        console.log('✅ Coluna name adicionada à tabela user_credentials');
      } catch (error: any) {
        // Ignorar erro se a coluna já existir
        if (!error?.message?.includes('duplicate column')) {
          console.log('⚠️ Coluna name pode já existir ou erro na migração:', error?.message);
        }
      }

      // Migração: garantir coluna user_email nos bancos existentes
      try {
        await this.db.execAsync(`
          ALTER TABLE truck_loads ADD COLUMN user_email TEXT;
        `);
        console.log('✅ Coluna user_email adicionada à tabela truck_loads');
      } catch (error: any) {
        if (!error?.message?.includes('duplicate column')) {
          console.log('⚠️ Coluna user_email pode já existir em truck_loads ou erro na migração:', error?.message);
        }
      }

      try {
        await this.db.execAsync(`
          ALTER TABLE dropdown_data ADD COLUMN user_email TEXT;
        `);
        console.log('✅ Coluna user_email adicionada à tabela dropdown_data');
      } catch (error: any) {
        if (!error?.message?.includes('duplicate column')) {
          console.log('⚠️ Coluna user_email pode já existir em dropdown_data ou erro na migração:', error?.message);
        }
      }

      // Índices para melhor performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_truck_loads_status ON truck_loads(status);
        CREATE INDEX IF NOT EXISTS idx_truck_loads_created_at ON truck_loads(created_at);
        CREATE INDEX IF NOT EXISTS idx_truck_loads_user_email ON truck_loads(user_email);
        CREATE INDEX IF NOT EXISTS idx_dropdown_data_type ON dropdown_data(type);
        CREATE INDEX IF NOT EXISTS idx_dropdown_data_user_email ON dropdown_data(user_email);
        CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON user_credentials(email);
        CREATE INDEX IF NOT EXISTS idx_user_credentials_last_login ON user_credentials(last_login);
      `);

      console.log('✅ Tabelas do banco de dados criadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error);
      throw error;
    }
  }

  // Gerar ID único para registros
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeEmail(email?: string): string | null {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const normalized = email.toLowerCase().trim();
    return normalized || null;
  }

  // Salvar carregamento localmente
  async saveTruckLoad(formData: TruckLoadFormData, userEmail: string): Promise<{ success: boolean; id: string; message: string }> {
    try {
      await this.waitForInitialization();
      if (!this.db) {
        await this.ensureInitialized();
      }
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado');
        return { success: false, id: '', message: await this.getMessage('databaseNotInitialized') };
      }

      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao salvar carregamento');
        return { success: false, id: '', message: await this.getMessage('saveLoadFailed') };
      }

      const id = this.generateId();
      const now = new Date().toISOString();

      console.log('💾 Salvando carregamento no banco local:', { id, truck: formData.truck, farm: formData.farm, user: normalizedEmail });

      await this.db.withTransactionAsync(async () => {
        await this.db!.runAsync(
        `INSERT INTO truck_loads (
          id, reg_date, reg_time, truck, othertruck, farm, otherfarm, 
          field, otherfield, variety, othervariety, driver, otherdriver,
          destination, otherdestination, dnote, agreement, otheragreement,
          user_email, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          normalizedEmail,
          'pending',
          now
        ]
        );
      });

      console.log('✅ Carregamento salvo localmente com sucesso:', id);
      return {
        success: true,
        id,
        message: await this.getMessage('loadSavedLocally')
      };
    } catch (error) {
      console.error('❌ Erro ao salvar carregamento:', error);
      return {
        success: false,
        id: '',
        message: await this.getMessage('saveLoadFailed')
      };
    }
  }

  // Buscar todos os carregamentos
  async getAllTruckLoads(userEmail: string): Promise<LocalTruckLoad[]> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getAllTruckLoads');
        return [];
      }

      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao buscar carregamentos');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM truck_loads WHERE user_email = ? ORDER BY created_at DESC`,
        [normalizedEmail]
      ) as LocalTruckLoad[];

(`📊 Carregamentos encontrados no banco local: ${result.length}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar carregamentos:', error);
      return [];
    }
  }

  // Buscar carregamentos pendentes de sincronização
  async getPendingTruckLoads(userEmail: string): Promise<LocalTruckLoad[]> {
    if (!this.db) return [];

    try {
      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao buscar pendências');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM truck_loads WHERE status = 'pending' AND user_email = ? ORDER BY created_at ASC`,
        [normalizedEmail]
      ) as LocalTruckLoad[];

      return result;
    } catch (error) {
      console.error('Erro ao buscar carregamentos pendentes:', error);
      return [];
    }
  }

  // Marcar carregamento como sincronizado
  async markAsSynced(id: string, userEmail: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao marcar sincronização');
        return false;
      }

      const now = new Date().toISOString();
      await this.db.runAsync(
        `UPDATE truck_loads SET status = 'synced', synced_at = ? WHERE id = ? AND user_email = ?`,
        [now, id, normalizedEmail]
      );

      return true;
    } catch (error) {
      console.error('Erro ao marcar como sincronizado:', error);
      return false;
    }
  }

  // Salvar dados de dropdown localmente
  async saveDropdownData(type: string, value: string, userEmail: string): Promise<boolean> {
    try {
      await this.waitForInitialization();
      if (!this.db) {
        // Tentar reabrir o banco e seguir
        await this.ensureInitialized();
      }
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para saveDropdownData');
        return false;
      }

      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao salvar dropdown');
        return false;
      }

      const id = this.generateId();
      const now = new Date().toISOString();

      console.log('💾 Salvando item de dropdown:', {
        id,
        type,
        value,
        timestamp: now,
        user: normalizedEmail
      });

      // Verificar se já existe
      const existing = await this.db.getFirstAsync(
        `SELECT id FROM dropdown_data WHERE type = ? AND value = ? AND (user_email = ? OR user_email IS NULL)`,
        [type, value, normalizedEmail]
      );

      if (existing) {
        console.log(`📋 Item de dropdown "${value}" (${type}) já existe`);
        return true; // Já existe
      }

      // Garantir consistência com uma transação
      await this.db.withTransactionAsync(async () => {
        await this.db!.runAsync(
          `INSERT INTO dropdown_data (id, type, value, created_at, user_email) VALUES (?, ?, ?, ?, ?)`,
          [id, type, value, now, normalizedEmail]
        );
      });

      console.log(`✅ Item de dropdown "${value}" (${type}) salvo localmente com ID: ${id}`);
      
      // Verificar se foi salvo corretamente
      const verification = await this.db.getFirstAsync(
        `SELECT * FROM dropdown_data WHERE id = ?`,
        [id]
      );
      
      if (verification) {
        console.log('✅ Verificação de salvamento bem-sucedida:', verification);
      } else {
        console.log('❌ Falha na verificação de salvamento');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar dados de dropdown:', error);
      return false;
    }
  }

  // Buscar dados de dropdown por tipo
  async getDropdownData(type: string, userEmail: string): Promise<string[]> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getDropdownData');
        return [];
      }

      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao buscar dropdown');
        return [];
      }

      
      const result = await this.db.getAllAsync(
        `SELECT value FROM dropdown_data WHERE type = ? AND (user_email = ? OR user_email IS NULL) ORDER BY value ASC`,
        [type, normalizedEmail]
      ) as { value: string }[];

      const values = result.map(row => row.value);
      console.log(`📊 ${type}: ${values.length} itens encontrados`, values);
      
      return values;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de dropdown:', error);
      return [];
    }
  }

  // Buscar todos os dados de dropdown
  async getAllDropdownData(userEmail: string): Promise<Record<string, string[]>> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getAllDropdownData');
        return {};
      }

      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao buscar todos os dropdowns');
        return {};
      }

      console.log('📋 Buscando todos os dados de dropdown...');
      
      // Primeiro, vamos ver todos os dados salvos no banco
      const allData = await this.db.getAllAsync(
        `SELECT type, value FROM dropdown_data WHERE user_email = ? OR user_email IS NULL ORDER BY type, value ASC`,
        [normalizedEmail]
      ) as { type: string; value: string }[];
      
      console.log('📋 Todos os dados encontrados no banco:', allData);
      
      const types = ['truck', 'farm', 'field', 'variety', 'driver', 'destination', 'agreement'];
      const result: Record<string, string[]> = {};

      for (const type of types) {
        
        // Buscar tanto tipo singular quanto plural para compatibilidade
        const singularData = await this.getDropdownData(type, normalizedEmail);
        const pluralData = await this.getDropdownData(type + 's', normalizedEmail);
        
        // Combinar dados singulares e plurais, removendo duplicatas
        const combinedData = [...new Set([...singularData, ...pluralData])];
        
        result[type] = combinedData;
        console.log(`📊 ${type}: ${combinedData.length} itens encontrados`, combinedData);
      }

      const summary = Object.keys(result).map(k => `${k}: ${result[k].length}`).join(', ');
      console.log('📋 Dados de dropdown carregados:', summary);
      console.log('📋 Dados completos:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar todos os dados de dropdown:', error);
      return {};
    }
  }

  // Deletar carregamento
  async deleteTruckLoad(id: string, userEmail: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao deletar carregamento');
        return false;
      }

      await this.db.runAsync(`DELETE FROM truck_loads WHERE id = ? AND user_email = ?`, [id, normalizedEmail]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar carregamento:', error);
      return false;
    }
  }

  // Limpar dados antigos (opcional - para manutenção)
  async cleanupOldData(daysToKeep: number = 30, userEmail?: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const normalizedEmail = userEmail ? this.normalizeEmail(userEmail) : null;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffISO = cutoffDate.toISOString();

      if (normalizedEmail) {
        await this.db.runAsync(
          `DELETE FROM truck_loads WHERE created_at < ? AND status = 'synced' AND user_email = ?`,
          [cutoffISO, normalizedEmail]
        );
      } else {
        await this.db.runAsync(
          `DELETE FROM truck_loads WHERE created_at < ? AND status = 'synced'`,
          [cutoffISO]
        );
      }

      return true;
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      return false;
    }
  }

  // Estatísticas do banco
  async getStats(userEmail: string): Promise<{ total: number; pending: number; synced: number }> {
    if (!this.db) return { total: 0, pending: 0, synced: 0 };

    try {
      const normalizedEmail = this.normalizeEmail(userEmail);
      if (!normalizedEmail) {
        console.error('❌ Email do usuário inválido ao obter estatísticas');
        return { total: 0, pending: 0, synced: 0 };
      }

      const totalResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM truck_loads WHERE user_email = ?`,
        [normalizedEmail]
      ) as { count: number };

      const pendingResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM truck_loads WHERE status = 'pending' AND user_email = ?`,
        [normalizedEmail]
      ) as { count: number };

      const syncedResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM truck_loads WHERE status = 'synced' AND user_email = ?`,
        [normalizedEmail]
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
  async saveUserCredentials(email: string, passwordHash: string, sessionId?: string, name?: string): Promise<boolean> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para saveUserCredentials');
        return false;
      }

      // Normalizar email para lowercase para evitar problemas de case sensitivity
      const normalizedEmail = email.toLowerCase().trim();
      const userName = name || normalizedEmail.split('@')[0] || 'User';

      const id = this.generateId();
      const now = new Date().toISOString();

      console.log('💾 Salvando credenciais de usuário no banco local:', { 
        email: normalizedEmail, 
        name: userName,
        hasSessionId: !!sessionId 
      });

      // Verificar se já existe credencial para este email (case-insensitive)
      const existing = await this.db.getFirstAsync(
        `SELECT id FROM user_credentials WHERE LOWER(email) = ?`,
        [normalizedEmail]
      );

      if (existing) {
        // Atualizar credenciais existentes
        await this.db.runAsync(
          `UPDATE user_credentials SET 
            name = ?,
            password_hash = ?, 
            session_id = ?, 
            last_login = ?, 
            is_validated = 1 
           WHERE LOWER(email) = ?`,
          [userName, passwordHash, sessionId || null, now, normalizedEmail]
        );
        console.log('✅ Credenciais de usuário atualizadas:', normalizedEmail);
      } else {
        // Inserir novas credenciais
        await this.db.runAsync(
          `INSERT INTO user_credentials (id, email, name, password_hash, session_id, last_login, is_validated, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [id, normalizedEmail, userName, passwordHash, sessionId || null, now, now]
        );
        console.log('✅ Credenciais de usuário salvas:', normalizedEmail);
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

      // Normalizar email para lowercase para busca case-insensitive
      const normalizedEmail = email.toLowerCase().trim();

      const result = await this.db.getFirstAsync(
        `SELECT 
          id,
          email,
          COALESCE(name, SUBSTR(email, 1, INSTR(email, '@') - 1), 'User') as name,
          password_hash,
          session_id,
          last_login,
          is_validated,
          created_at
         FROM user_credentials 
         WHERE LOWER(email) = ?`,
        [normalizedEmail]
      ) as LocalUserCredentials | null;

      if (result) {
        console.log('📋 Credenciais encontradas para:', normalizedEmail);
      } else {
        console.log('❌ Nenhuma credencial encontrada para:', normalizedEmail);
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
        `SELECT 
          id,
          email,
          COALESCE(name, SUBSTR(email, 1, INSTR(email, '@') - 1), 'User') as name,
          password_hash,
          session_id,
          last_login,
          is_validated,
          created_at
         FROM user_credentials 
         ORDER BY last_login DESC 
         LIMIT 1`
      ) as LocalUserCredentials | null;

      if (result) {
        console.log('📋 Primeira credencial encontrada para:', result.email);
      } else {
        console.log('❌ Nenhuma credencial encontrada');
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
      console.log('🔍 Tem credenciais salvas?', hasCredentials, '(total:', result.count, ')');
      return hasCredentials;
    } catch (error) {
      console.error('❌ Erro ao verificar credenciais de usuário:', error);
      return false;
    }
  }

  // Buscar todas as credenciais (para debug)
  async getAllUserCredentials(): Promise<LocalUserCredentials[]> {
    try {
      await this.waitForInitialization();
      
      if (!this.db) {
        console.error('❌ Banco de dados não inicializado para getAllUserCredentials');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT 
          id,
          email,
          COALESCE(name, SUBSTR(email, 1, INSTR(email, '@') - 1), 'User') as name,
          password_hash,
          session_id,
          last_login,
          is_validated,
          created_at
         FROM user_credentials 
         ORDER BY last_login DESC`
      ) as LocalUserCredentials[];

      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar todas as credenciais:', error);
      return [];
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

console.log('📅 Dias desde último login:', daysDiff);
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
console.log('✅ Credenciais de usuário removidas');
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
// Instanciar o serviço de forma lazy para evitar problemas no APK
let _localDatabaseService: LocalDatabaseService | null = null;

// Criar um objeto proxy que inicializa o serviço quando necessário
export const localDatabaseService = new Proxy({} as LocalDatabaseService, {
  get(target, prop) {
    if (!_localDatabaseService) {
      _localDatabaseService = new LocalDatabaseService();
    }
    const value = (_localDatabaseService as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_localDatabaseService);
    }
    return value;
  }
});
