import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-savings-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('savings.eyebrow') }}</p>
          <h2>{{ i18n.t('savings.title') }}</h2>
          <p>{{ i18n.t('savings.subtitle') }}</p>
        </div>
        <button type="button">{{ i18n.t('savings.newGoal') }}</button>
      </section>

      <section class="panel">
        <div class="panel-title">
          <h3>{{ i18n.t('savings.progress') }}</h3>
          <span>{{ i18n.t('savings.activeGoals') }}</span>
        </div>
        <div class="empty-state">
          <strong>{{ i18n.t('savings.emptyTitle') }}</strong>
          <p>{{ i18n.t('savings.emptyHint') }}</p>
        </div>
      </section>
    </main>
  `
})
export class SavingsPage {
  readonly i18n = inject(I18nService);
}
