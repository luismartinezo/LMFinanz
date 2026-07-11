import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-transactions-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('transactions.eyebrow') }}</p>
          <h2>{{ i18n.t('transactions.title') }}</h2>
          <p>{{ i18n.t('transactions.subtitle') }}</p>
        </div>
        <button type="button">{{ i18n.t('transactions.newMovement') }}</button>
      </section>

      <section class="panel">
        <div class="panel-title">
          <h3>{{ i18n.t('transactions.ledger') }}</h3>
          <span>{{ i18n.t('transactions.dailyControl') }}</span>
        </div>
        <div class="table-empty">
          <span>{{ i18n.t('transactions.date') }}</span>
          <span>{{ i18n.t('transactions.category') }}</span>
          <span>{{ i18n.t('transactions.account') }}</span>
          <span>{{ i18n.t('transactions.amount') }}</span>
        </div>
      </section>
    </main>
  `
})
export class TransactionsPage {
  readonly i18n = inject(I18nService);
}
