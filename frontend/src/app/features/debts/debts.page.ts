import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-debts-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('debts.eyebrow') }}</p>
          <h2>{{ i18n.t('debts.title') }}</h2>
          <p>{{ i18n.t('debts.subtitle') }}</p>
        </div>
        <button type="button">{{ i18n.t('debts.newDebt') }}</button>
      </section>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('debts.totalDebt') }}</span>
          <strong>EUR 0.00</strong>
          <p>{{ i18n.t('debts.totalDebtHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('debts.nextDueDate') }}</span>
          <strong>-</strong>
          <p>{{ i18n.t('debts.nextDueDateHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('debts.installments') }}</span>
          <strong>0</strong>
          <p>{{ i18n.t('debts.installmentsHint') }}</p>
        </article>
      </section>
    </main>
  `
})
export class DebtsPage {
  readonly i18n = inject(I18nService);
}
