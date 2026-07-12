import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts in Spanish when no language is stored', () => {
    const service = TestBed.inject(I18nService);

    expect(service.language()).toBe('es');
    expect(service.t('dashboard.title')).toBe('Tu centro financiero');
    expect(document.documentElement.lang).toBe('es');
  });

  it('changes language and persists the selection', () => {
    const service = TestBed.inject(I18nService);

    service.setLanguage('de');

    expect(service.language()).toBe('de');
    expect(service.t('dashboard.title')).toBe('Dein Finanzzentrum');
    expect(localStorage.getItem('lmfinanz.language')).toBe('de');
    expect(document.documentElement.lang).toBe('de');
  });
});
