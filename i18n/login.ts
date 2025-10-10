import type { LanguageCode } from '../contexts/LanguageContext';

export const loginI18n: Record<LanguageCode, Record<string, string>> = {
  pt: {
    appTitle: 'MTFA',
    usernamePlaceholder: 'Usuário ou Email',
    passwordPlaceholder: 'Senha',
    loginButton: 'Entrar',
    loggingIn: 'Entrando...',
    usernameRequired: 'Usuário ou email é obrigatório',
    passwordRequired: 'Senha é obrigatória',
    selectLanguage: 'Selecionar Idioma',
  },
  en: {
    appTitle: 'MTFA',
    usernamePlaceholder: 'Username or Email',
    passwordPlaceholder: 'Password',
    loginButton: 'Login',
    loggingIn: 'Logging in...',
    usernameRequired: 'Username or email is required',
    passwordRequired: 'Password is required',
    selectLanguage: 'Select Language',
  },
  de: {
    appTitle: 'MTFA',
    usernamePlaceholder: 'Benutzername oder E-Mail',
    passwordPlaceholder: 'Passwort',
    loginButton: 'Anmelden',
    loggingIn: 'Anmeldung...',
    usernameRequired: 'Benutzername oder E-Mail ist erforderlich',
    passwordRequired: 'Passwort ist erforderlich',
    selectLanguage: 'Sprache auswählen',
  },
};
