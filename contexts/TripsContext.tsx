import React, { createContext, useContext, ReactNode } from 'react';
import { useTrips } from '../hooks/useDatabase';

interface TripsContextType {
  trips: any[];
  isLoading: boolean;
  loadTrips: () => Promise<void>;
  createTrip: (tripData: any) => Promise<boolean>;
  refreshTrips: () => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

interface TripsProviderProps {
  children: ReactNode;
}

export const TripsProvider: React.FC<TripsProviderProps> = ({ children }) => {
  const tripsHook = useTrips();

  return (
    <TripsContext.Provider value={tripsHook}>
      {children}
    </TripsContext.Provider>
  );
};

export const useTripsContext = (): TripsContextType => {
  const context = useContext(TripsContext);
  if (!context) {
    throw new Error('useTripsContext must be used within a TripsProvider');
  }
  return context;
};
