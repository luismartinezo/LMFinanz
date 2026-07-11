import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-reports-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('reports.eyebrow') }}</p>
          <h2>{{ i18n.t('reports.title') }}</h2>
          <p>{{ i18n.t('reports.subtitle') }}</p>
        </div>
        <button type="button">{{ i18n.t('reports.export') }}</button>
      </section>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('reports.daily') }}</span>
          <strong>0</strong>
          <p>{{ i18n.t('reports.dailyHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('reports.monthly') }}</span>
          <strong>0</strong>
          <p>{{ i18n.t('reports.monthlyHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('reports.yearly') }}</span>
          <strong>0</strong>
          <p>{{ i18n.t('reports.yearlyHint') }}</p>
        </article>
      </section>
    </main>
  `
})
export class ReportsPage {
  readonly i18n = inject(I18nService);
}
