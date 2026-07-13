import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { NgFor } from '@angular/common';
import { I18nService, SupportedLanguage } from './i18n.service';

@Component({
  selector: 'app-language-selector',
  imports: [NgFor],
  template: `
    <label class="language-select">
      <span>{{ i18n.t('language.label') }}</span>
      <select #languageSelect autocomplete="off" [value]="i18n.language()" (change)="changeLanguage($event)">
        <option *ngFor="let language of i18n.languages" [value]="language.code">
          {{ language.label }}
        </option>
      </select>
    </label>
  `
})
export class LanguageSelectorComponent {
  readonly i18n = inject(I18nService);
  private readonly select = viewChild<ElementRef<HTMLSelectElement>>('languageSelect');

  constructor() {
    effect(() => {
      const select = this.select()?.nativeElement;
      if (select) {
        select.value = this.i18n.language();
      }
    });
  }

  changeLanguage(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.i18n.setLanguage(target.value as SupportedLanguage);
  }
}
