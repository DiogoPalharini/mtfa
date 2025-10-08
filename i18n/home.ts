import type { LanguageCode } from '../contexts/LanguageContext';

export const homeI18n: Record<LanguageCode, Record<string, string>> = {
  pt: {
    welcome: 'Olá, {user}!',
    syncStatusTitle: 'Status da Sincronização',
    syncing: 'Sincronizando...',
    syncNow: 'Sincronizar Agora',
    allSynced: 'Todos sincronizados',
    pending: 'pendentes',
    createEntry: 'Cadastrar Nova Entrada',
    recentLoads: 'Carregamentos Recentes',
    syncTooltip: 'Sincronizar dados',
  },
  en: {
    welcome: 'Hello, {user}!',
    syncStatusTitle: 'Sync Status',
    syncing: 'Syncing...',
    syncNow: 'Sync Now',
    allSynced: 'All synced',
    pending: 'pending',
    createEntry: 'Create New Entry',
    recentLoads: 'Recent Loads',
    syncTooltip: 'Sync data',
  },
  de: {
    welcome: 'Hallo, {user}!',
    syncStatusTitle: 'Synchronisierungsstatus',
    syncing: 'Synchronisieren...',
    syncNow: 'Jetzt synchronisieren',
    allSynced: 'Alle synchronisiert',
    pending: 'ausstehend',
    createEntry: 'Neuen Eintrag erstellen',
    recentLoads: 'Letzte Ladungen',
    syncTooltip: 'Daten synchronisieren',
  },
};
