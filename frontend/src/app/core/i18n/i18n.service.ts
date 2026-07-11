import { Injectable, signal } from '@angular/core';

export type SupportedLanguage = 'en' | 'es' | 'de';

type TranslationKey =
  | 'app.dashboard'
  | 'app.accounts'
  | 'app.transactions'
  | 'app.debts'
  | 'app.savings'
  | 'app.assets'
  | 'app.reports'
  | 'app.logout'
  | 'auth.signIn'
  | 'auth.register'
  | 'auth.fullName'
  | 'auth.email'
  | 'auth.password'
  | 'auth.signingIn'
  | 'auth.creating'
  | 'auth.loginSubmit'
  | 'auth.registerSubmit'
  | 'auth.noAccount'
  | 'auth.hasAccount'
  | 'auth.createAccount'
  | 'auth.login'
  | 'auth.loginError'
  | 'auth.registerError'
  | 'language.label';

const STORAGE_KEY = 'lmfinanz.language';

const translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en: {
    'app.dashboard': 'Dashboard',
    'app.accounts': 'Accounts',
    'app.transactions': 'Transactions',
    'app.debts': 'Debts',
    'app.savings': 'Savings',
    'app.assets': 'Assets',
    'app.reports': 'Reports',
    'app.logout': 'Logout',
    'auth.signIn': 'Sign in',
    'auth.register': 'Create account',
    'auth.fullName': 'Full name',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signingIn': 'Signing in...',
    'auth.creating': 'Creating...',
    'auth.loginSubmit': 'Sign in',
    'auth.registerSubmit': 'Create account',
    'auth.noAccount': 'Do not have an account?',
    'auth.hasAccount': 'Already have an account?',
    'auth.createAccount': 'Create account',
    'auth.login': 'Sign in',
    'auth.loginError': 'We could not sign you in with those credentials.',
    'auth.registerError': 'We could not create the account.',
    'language.label': 'Language'
  },
  es: {
    'app.dashboard': 'Dashboard',
    'app.accounts': 'Cuentas',
    'app.transactions': 'Movimientos',
    'app.debts': 'Deudas',
    'app.savings': 'Ahorros',
    'app.assets': 'Activos',
    'app.reports': 'Reportes',
    'app.logout': 'Cerrar sesion',
    'auth.signIn': 'Iniciar sesion',
    'auth.register': 'Crear cuenta',
    'auth.fullName': 'Nombre completo',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signingIn': 'Ingresando...',
    'auth.creating': 'Creando...',
    'auth.loginSubmit': 'Ingresar',
    'auth.registerSubmit': 'Crear cuenta',
    'auth.noAccount': 'No tienes cuenta?',
    'auth.hasAccount': 'Ya tienes cuenta?',
    'auth.createAccount': 'Crear cuenta',
    'auth.login': 'Ingresar',
    'auth.loginError': 'No pudimos iniciar sesion con esos datos.',
    'auth.registerError': 'No pudimos crear la cuenta.',
    'language.label': 'Idioma'
  },
  de: {
    'app.dashboard': 'Dashboard',
    'app.accounts': 'Konten',
    'app.transactions': 'Buchungen',
    'app.debts': 'Schulden',
    'app.savings': 'Sparziele',
    'app.assets': 'Vermoegen',
    'app.reports': 'Berichte',
    'app.logout': 'Abmelden',
    'auth.signIn': 'Anmelden',
    'auth.register': 'Konto erstellen',
    'auth.fullName': 'Vollstaendiger Name',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.signingIn': 'Anmeldung...',
    'auth.creating': 'Wird erstellt...',
    'auth.loginSubmit': 'Anmelden',
    'auth.registerSubmit': 'Konto erstellen',
    'auth.noAccount': 'Noch kein Konto?',
    'auth.hasAccount': 'Schon ein Konto?',
    'auth.createAccount': 'Konto erstellen',
    'auth.login': 'Anmelden',
    'auth.loginError': 'Anmeldung mit diesen Daten nicht moeglich.',
    'auth.registerError': 'Das Konto konnte nicht erstellt werden.',
    'language.label': 'Sprache'
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Espanol' },
    { code: 'de', label: 'Deutsch' }
  ];

  private readonly selectedLanguage = signal<SupportedLanguage>(this.initialLanguage());
  readonly language = this.selectedLanguage.asReadonly();

  constructor() {
    this.applyDocumentLanguage(this.selectedLanguage());
  }

  setLanguage(language: SupportedLanguage): void {
    this.selectedLanguage.set(language);
    localStorage.setItem(STORAGE_KEY, language);
    this.applyDocumentLanguage(language);
  }

  t(key: TranslationKey): string {
    return translations[this.selectedLanguage()][key] ?? translations.en[key] ?? key;
  }

  private initialLanguage(): SupportedLanguage {
    const stored = localStorage.getItem(STORAGE_KEY);
    return this.isSupported(stored) ? stored : 'es';
  }

  private isSupported(value: string | null): value is SupportedLanguage {
    return value === 'en' || value === 'es' || value === 'de';
  }

  private applyDocumentLanguage(language: SupportedLanguage): void {
    document.documentElement.lang = language;
  }
}
