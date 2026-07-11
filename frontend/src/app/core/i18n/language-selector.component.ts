import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { I18nService, SupportedLanguage } from './i18n.service';

@Component({
  selector: 'app-language-selector',
  imports: [NgFor],
  template: `
    <label class="language-select">
      <span>{{ i18n.t('language.label') }}</span>
      <select [value]="i18n.language()" (change)="changeLanguage($event)">
        <option *ngFor="let language of i18n.languages" [value]="language.code">
          {{ language.label }}
        </option>
      </select>
    </label>
  `
})
export class LanguageSelectorComponent {
  readonly i18n = inject(I18nService);

  changeLanguage(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.i18n.setLanguage(target.value as SupportedLanguage);
  }
}
