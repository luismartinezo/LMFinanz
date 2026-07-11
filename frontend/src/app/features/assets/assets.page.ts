import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-assets-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('assets.eyebrow') }}</p>
          <h2>{{ i18n.t('assets.title') }}</h2>
          <p>{{ i18n.t('assets.subtitle') }}</p>
        </div>
        <button type="button">{{ i18n.t('assets.newAsset') }}</button>
      </section>

      <section class="module-grid">
        <article class="module-card"><span>{{ i18n.t('assets.house') }}</span><strong>0</strong><p>{{ i18n.t('assets.houseHint') }}</p></article>
        <article class="module-card"><span>{{ i18n.t('assets.vehicle') }}</span><strong>0</strong><p>{{ i18n.t('assets.vehicleHint') }}</p></article>
        <article class="module-card"><span>{{ i18n.t('assets.other') }}</span><strong>0</strong><p>{{ i18n.t('assets.otherHint') }}</p></article>
      </section>
    </main>
  `
})
export class AssetsPage {
  readonly i18n = inject(I18nService);
}
