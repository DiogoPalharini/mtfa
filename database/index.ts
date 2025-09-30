import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'mtfa_database.db';

export interface User {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export interface Trip {
  id: number;
  date: string;
  time: string;
  company: string;
  field: string;
  variety: string;
  truck: string;
  driver: string;
  deliveryLocation: string;
  pesoEstimado: string;
  precoFrete: string;
  anotacoes: string;
  created_at: string;
}

export interface DropdownItem {
  id: number;
  category: string;
  name: string;
  created_at: string;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.createTables();
      await this.insertInitialData();
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Tabela de usuários
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de viagens
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        company TEXT NOT NULL,
        field TEXT NOT NULL,
        variety TEXT NOT NULL,
        truck TEXT NOT NULL,
        driver TEXT NOT NULL,
        deliveryLocation TEXT NOT NULL,
        pesoEstimado TEXT,
        precoFrete TEXT,
        anotacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de itens dos dropdowns
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS dropdown_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, name)
      );
    `);
  }

  private async insertInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Inserir usuário padrão
    try {
      await this.db.runAsync(`
        INSERT OR IGNORE INTO users (username, password) 
        VALUES ('admin', '123456')
      `);
    } catch (error) {
      console.log('Usuário admin já existe');
    }

    // Inserir dados iniciais dos dropdowns
    const initialDropdownData = [
      // Caminhões
      { category: 'trucks', name: 'Caminhão 001' },
      { category: 'trucks', name: 'Caminhão 002' },
      { category: 'trucks', name: 'Caminhão 003' },
      { category: 'trucks', name: 'Caminhão 004' },
      { category: 'trucks', name: 'Caminhão 005' },
      { category: 'trucks', name: 'Caminhão 006' },
      
      // Empresas
      { category: 'companies', name: 'Empresa A' },
      { category: 'companies', name: 'Empresa B' },
      { category: 'companies', name: 'Empresa C' },
      { category: 'companies', name: 'Empresa D' },
      { category: 'companies', name: 'Empresa E' },
      
      // Campos
      { category: 'fields', name: 'Campo Norte' },
      { category: 'fields', name: 'Campo Sul' },
      { category: 'fields', name: 'Campo Leste' },
      { category: 'fields', name: 'Campo Oeste' },
      { category: 'fields', name: 'Campo Central' },
      
      // Variedades
      { category: 'varieties', name: 'Soja' },
      { category: 'varieties', name: 'Milho' },
      { category: 'varieties', name: 'Trigo' },
      { category: 'varieties', name: 'Arroz' },
      { category: 'varieties', name: 'Algodão' },
      
      // Motoristas
      { category: 'drivers', name: 'João Silva' },
      { category: 'drivers', name: 'Maria Santos' },
      { category: 'drivers', name: 'Pedro Costa' },
      { category: 'drivers', name: 'Ana Souza' },
      { category: 'drivers', name: 'Carlos Lima' },
      
      // Locais de entrega
      { category: 'deliveryLocations', name: 'Porto Santos' },
      { category: 'deliveryLocations', name: 'Silo Central' },
      { category: 'deliveryLocations', name: 'Fábrica ABC' },
      { category: 'deliveryLocations', name: 'Terminal XYZ' },
      { category: 'deliveryLocations', name: 'Armazém 12' },
    ];

    for (const item of initialDropdownData) {
      try {
        await this.db.runAsync(`
          INSERT OR IGNORE INTO dropdown_items (category, name) 
          VALUES (?, ?)
        `, [item.category, item.name]);
      } catch (error) {
        console.log(`Item ${item.name} já existe na categoria ${item.category}`);
      }
    }
  }

  // Métodos para usuários
  async authenticateUser(username: string, password: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    return result || null;
  }

  async createUser(username: string, password: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    const user = await this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE id = ?',
      [result.lastInsertRowId]
    );

    if (!user) throw new Error('Failed to create user');
    return user;
  }

  // Métodos para viagens
  async createTrip(tripData: Omit<Trip, 'id' | 'created_at'>): Promise<Trip> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(`
      INSERT INTO trips (
        date, time, company, field, variety, truck, driver, 
        deliveryLocation, pesoEstimado, precoFrete, anotacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tripData.date, tripData.time, tripData.company, tripData.field,
      tripData.variety, tripData.truck, tripData.driver, tripData.deliveryLocation,
      tripData.pesoEstimado, tripData.precoFrete, tripData.anotacoes
    ]);

    const trip = await this.db.getFirstAsync<Trip>(
      'SELECT * FROM trips WHERE id = ?',
      [result.lastInsertRowId]
    );

    if (!trip) throw new Error('Failed to create trip');
    return trip;
  }

  async getAllTrips(): Promise<Trip[]> {
    if (!this.db) throw new Error('Database not initialized');

    const trips = await this.db.getAllAsync<Trip>(
      'SELECT * FROM trips ORDER BY created_at DESC'
    );

    return trips;
  }

  async getTripById(id: number): Promise<Trip | null> {
    if (!this.db) throw new Error('Database not initialized');

    const trip = await this.db.getFirstAsync<Trip>(
      'SELECT * FROM trips WHERE id = ?',
      [id]
    );

    return trip || null;
  }

  // Métodos para dropdown items
  async getDropdownItems(category: string): Promise<DropdownItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const items = await this.db.getAllAsync<DropdownItem>(
      'SELECT * FROM dropdown_items WHERE category = ? ORDER BY name',
      [category]
    );

    return items;
  }

  async addDropdownItem(category: string, name: string): Promise<DropdownItem> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'INSERT INTO dropdown_items (category, name) VALUES (?, ?)',
      [category, name]
    );

    const item = await this.db.getFirstAsync<DropdownItem>(
      'SELECT * FROM dropdown_items WHERE id = ?',
      [result.lastInsertRowId]
    );

    if (!item) throw new Error('Failed to create dropdown item');
    return item;
  }

  async deleteDropdownItem(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM dropdown_items WHERE id = ?', [id]);
  }

  // Método para fechar conexão
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Instância singleton do banco de dados
export const database = new Database();
