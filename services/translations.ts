// Sistema de Tradução para Mensagens de Erro
import { LanguageCode } from '../contexts/LanguageContext';

// Interface para as mensagens de erro
interface ErrorMessages {
  // Login errors
  loginFailed: string;
  invalidCredentials: string;
  networkError: string;
  serverError: string;
  timeoutError: string;
  unknownError: string;
  
  // API errors
  apiKeyInvalid: string;
  apiTimeout: string;
  apiConnectionFailed: string;
  
  // Legacy system errors
  legacySystemFailed: string;
  cookieNotFound: string;
  sessionExpired: string;
  
  // Storage errors
  storageError: string;
  credentialsNotSaved: string;
  databaseNotInitialized: string;
  
  // Offline login errors
  offlineSystemUnavailable: string;
  noSavedCredentials: string;
  credentialsExpired: string;
  incorrectPassword: string;
  offlineValidationFailed: string;
  offlineLoginSuccess: string;
  
  // Success messages
  loginSuccess: string;
  logoutSuccess: string;
  credentialsSaved: string;
  loadSavedAndSynced: string;
  loadSavedLocally: string;
  saveLoadFailed: string;
  loadNotFound: string;
  syncedSuccessfully: string;
  serverSyncFailed: string;
  syncInProgress: string;
  noInternetConnection: string;
  noPendingLoads: string;
  syncFailed: string;
  syncSuccessMessage: string;
  syncNoLoadsMessage: string;
  syncFailedCount: string;
}

// Traduções para cada idioma
const translations: Record<LanguageCode, ErrorMessages> = {
  pt: {
    // Login errors
    loginFailed: 'Falha no login',
    invalidCredentials: 'Credenciais inválidas',
    networkError: 'Erro de rede. Verifique sua conexão.',
    serverError: 'Erro interno do servidor. Tente novamente.',
    timeoutError: 'Tempo limite excedido. Tente novamente.',
    unknownError: 'Erro desconhecido',
    
    // API errors
    apiKeyInvalid: 'Chave de API inválida',
    apiTimeout: 'Timeout da API',
    apiConnectionFailed: 'Falha na conexão com a API',
    
    // Legacy system errors
    legacySystemFailed: 'Falha no sistema legado',
    cookieNotFound: 'Cookie de sessão não encontrado',
    sessionExpired: 'Sessão expirada. Faça login novamente.',
    
    // Storage errors
    storageError: 'Erro ao salvar dados',
    credentialsNotSaved: 'Credenciais não foram salvas',
    databaseNotInitialized: 'Banco de dados não inicializado',
    
    // Offline login errors
    offlineSystemUnavailable: 'Sistema offline temporariamente indisponível. Tente novamente.',
    noSavedCredentials: 'Nenhuma credencial salva encontrada. Faça login online primeiro.',
    credentialsExpired: 'Credenciais expiradas. Faça login online novamente.',
    incorrectPassword: 'Senha incorreta.',
    offlineValidationFailed: 'Falha na validação offline. Tente novamente.',
    
    // Success messages
    loginSuccess: 'Login realizado com sucesso!',
    logoutSuccess: 'Logout realizado com sucesso',
    credentialsSaved: 'Credenciais salvas com sucesso',
    loadSavedAndSynced: 'Carregamento salvo e sincronizado com sucesso!',
    loadSavedLocally: 'Carregamento salvo localmente. Será sincronizado quando houver conexão.',
    saveLoadFailed: 'Falha ao salvar carregamento',
    loadNotFound: 'Carregamento não encontrado',
    syncedSuccessfully: 'Sincronizado com sucesso',
    serverSyncFailed: 'Falha na sincronização do servidor',
    syncInProgress: 'Sincronização já em andamento',
    noInternetConnection: 'Sem conexão com a internet',
    noPendingLoads: 'Nenhum carregamento pendente para sincronizar',
    syncFailed: 'Falha durante a sincronização',
    syncSuccessMessage: 'carregamento(s) sincronizado(s) com sucesso',
    syncNoLoadsMessage: 'Nenhum carregamento foi sincronizado.',
    syncFailedCount: 'falharam',
    
    // Offline login success
    offlineLoginSuccess: 'Login offline realizado com sucesso.',
  },
  
  en: {
    // Login errors
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid credentials',
    networkError: 'Network error. Check your connection.',
    serverError: 'Internal server error. Please try again.',
    timeoutError: 'Request timeout. Please try again.',
    unknownError: 'Unknown error',
    
    // API errors
    apiKeyInvalid: 'Invalid API key',
    apiTimeout: 'API timeout',
    apiConnectionFailed: 'API connection failed',
    
    // Legacy system errors
    legacySystemFailed: 'Legacy system failed',
    cookieNotFound: 'Session cookie not found',
    sessionExpired: 'Session expired. Please login again.',
    
    // Storage errors
    storageError: 'Error saving data',
    credentialsNotSaved: 'Credentials not saved',
    databaseNotInitialized: 'Database not initialized',
    
    // Offline login errors
    offlineSystemUnavailable: 'Offline system temporarily unavailable. Please try again.',
    noSavedCredentials: 'No saved credentials found. Please login online first.',
    credentialsExpired: 'Credentials expired. Please login online again.',
    incorrectPassword: 'Incorrect password.',
    offlineValidationFailed: 'Offline validation failed. Please try again.',
    
    // Success messages
    loginSuccess: 'Login successful!',
    logoutSuccess: 'Logout successful',
    credentialsSaved: 'Credentials saved successfully',
    loadSavedAndSynced: 'Load saved and synced successfully!',
    loadSavedLocally: 'Load saved locally. Will be synced when connection is available.',
    saveLoadFailed: 'Failed to save load',
    loadNotFound: 'Load not found',
    syncedSuccessfully: 'Synced successfully',
    serverSyncFailed: 'Server sync failed',
    syncInProgress: 'Sync already in progress',
    noInternetConnection: 'No internet connection',
    noPendingLoads: 'No pending loads to sync',
    syncFailed: 'Sync failed',
    syncSuccessMessage: 'load(s) synced successfully',
    syncNoLoadsMessage: 'No loads were synced.',
    syncFailedCount: 'failed',
    
    // Offline login success
    offlineLoginSuccess: 'Offline login successful.',
  },
  
  de: {
    // Login errors
    loginFailed: 'Anmeldung fehlgeschlagen',
    invalidCredentials: 'Ungültige Anmeldedaten',
    networkError: 'Netzwerkfehler. Überprüfen Sie Ihre Verbindung.',
    serverError: 'Interner Serverfehler. Bitte versuchen Sie es erneut.',
    timeoutError: 'Zeitüberschreitung. Bitte versuchen Sie es erneut.',
    unknownError: 'Unbekannter Fehler',
    
    // API errors
    apiKeyInvalid: 'Ungültiger API-Schlüssel',
    apiTimeout: 'API-Zeitüberschreitung',
    apiConnectionFailed: 'API-Verbindung fehlgeschlagen',
    
    // Legacy system errors
    legacySystemFailed: 'Legacy-System fehlgeschlagen',
    cookieNotFound: 'Sitzungs-Cookie nicht gefunden',
    sessionExpired: 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.',
    
    // Storage errors
    storageError: 'Fehler beim Speichern der Daten',
    credentialsNotSaved: 'Anmeldedaten nicht gespeichert',
    databaseNotInitialized: 'Datenbank nicht initialisiert',
    
    // Offline login errors
    offlineSystemUnavailable: 'Offline-System vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut.',
    noSavedCredentials: 'Keine gespeicherten Anmeldedaten gefunden. Bitte melden Sie sich zuerst online an.',
    credentialsExpired: 'Anmeldedaten abgelaufen. Bitte melden Sie sich erneut online an.',
    incorrectPassword: 'Falsches Passwort.',
    offlineValidationFailed: 'Offline-Validierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    
    // Success messages
    loginSuccess: 'Anmeldung erfolgreich!',
    logoutSuccess: 'Abmeldung erfolgreich',
    credentialsSaved: 'Anmeldedaten erfolgreich gespeichert',
    loadSavedAndSynced: 'Ladung erfolgreich gespeichert und synchronisiert!',
    loadSavedLocally: 'Ladung lokal gespeichert. Wird synchronisiert, wenn eine Verbindung verfügbar ist.',
    saveLoadFailed: 'Fehler beim Speichern der Ladung',
    loadNotFound: 'Ladung nicht gefunden',
    syncedSuccessfully: 'Erfolgreich synchronisiert',
    serverSyncFailed: 'Server-Synchronisation fehlgeschlagen',
    syncInProgress: 'Synchronisation bereits im Gange',
    noInternetConnection: 'Keine Internetverbindung',
    noPendingLoads: 'Keine ausstehenden Ladungen zum Synchronisieren',
    syncFailed: 'Synchronisation fehlgeschlagen',
    syncSuccessMessage: 'Ladung(en) erfolgreich synchronisiert',
    syncNoLoadsMessage: 'Keine Ladungen wurden synchronisiert.',
    syncFailedCount: 'fehlgeschlagen',
    
    // Offline login success
    offlineLoginSuccess: 'Offline-Anmeldung erfolgreich.',
  },
};

// Função para obter mensagem traduzida
export function getTranslatedMessage(key: keyof ErrorMessages, language: LanguageCode): string {
  // Log temporário para debug
  if (key === 'noPendingLoads') {
    console.log(`🔍 DEBUG - getTranslatedMessage: chave=${key}, idioma=${language}`);
    console.log(`🔍 DEBUG - Tradução encontrada: ${translations[language]?.[key]}`);
  }
  
  return translations[language]?.[key] || translations.en[key] || key;
}

// Função para obter todas as mensagens de um idioma
export function getTranslatedMessages(language: LanguageCode): ErrorMessages {
  return translations[language] || translations.en;
}

// Exportar tipos para uso em outros arquivos
export type { ErrorMessages };
export { translations };

