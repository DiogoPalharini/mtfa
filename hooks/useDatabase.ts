import { useEffect, useState } from 'react';
import { database, User, Trip, DropdownItem } from '../database';

export interface UseDatabaseReturn {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useDatabase = (): UseDatabaseReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await database.init();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Erro ao inicializar banco de dados:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
  };
};

// Hook para autenticação
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const authenticatedUser = await database.authenticateUser(username, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};

// Hook para viagens
export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      const allTrips = await database.getAllTrips();
      setTrips(allTrips);
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTrip = async (tripData: Omit<Trip, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const newTrip = await database.createTrip(tripData);
      setTrips(prev => [newTrip, ...prev]);
      return true;
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTrips = async () => {
    await loadTrips();
  };

  return {
    trips,
    isLoading,
    loadTrips,
    createTrip,
    refreshTrips,
  };
};

// Hook para dropdown items
export const useDropdownItems = (category: string) => {
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const categoryItems = await database.getDropdownItems(category);
      setItems(categoryItems);
    } catch (error) {
      console.error(`Erro ao carregar itens da categoria ${category}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const newItem = await database.addDropdownItem(category, name);
      setItems(prev => [...prev, newItem]);
      return true;
    } catch (error) {
      console.error(`Erro ao adicionar item na categoria ${category}:`, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      await database.deleteDropdownItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error(`Erro ao deletar item da categoria ${category}:`, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    items,
    isLoading,
    loadItems,
    addItem,
    deleteItem,
  };
};
