import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Asset, AssetRequest, AssetType } from './assets.models';
import { AssetsService } from './assets.service';

@Component({
  selector: 'app-assets-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('assets.eyebrow') }}</p>
          <h2>{{ i18n.t('assets.title') }}</h2>
          <p>{{ i18n.t('assets.subtitle') }}</p>
        </div>
        <button type="button" (click)="toggleForm()">
          {{ showForm ? i18n.t('accounts.closeForm') : i18n.t('assets.newAsset') }}
        </button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('assets.house') }}</span>
          <strong>{{ countByType(state.assets, 'HOUSE') }}</strong>
          <p>{{ i18n.t('assets.houseHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('assets.vehicle') }}</span>
          <strong>{{ countByType(state.assets, 'VEHICLE') }}</strong>
          <p>{{ i18n.t('assets.vehicleHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('assets.totalValue') }}</span>
          <strong>{{ totalValue(state.assets, primaryCurrency(state.assets)) | currency: primaryCurrency(state.assets) : 'symbol' : '1.2-2' }}</strong>
          <p>{{ i18n.t('assets.totalValueHint') }}</p>
        </article>
      </section>

      <section class="content-grid accounts-layout">
        <article class="panel" *ngIf="showForm">
          <div class="panel-title">
            <h3>{{ i18n.t('assets.newAsset') }}</h3>
            <span>{{ i18n.t('common.requiredFields') }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createAsset()">
            <label>
              {{ i18n.t('assets.name') }}
              <input formControlName="name" />
            </label>

            <div class="form-row">
              <label>
                {{ i18n.t('assets.type') }}
                <select formControlName="type">
                  <option value="HOUSE">{{ i18n.t('assets.typeHouse') }}</option>
                  <option value="VEHICLE">{{ i18n.t('assets.typeVehicle') }}</option>
                  <option value="ELECTRONICS">{{ i18n.t('assets.typeElectronics') }}</option>
                  <option value="FURNITURE">{{ i18n.t('assets.typeFurniture') }}</option>
                  <option value="OTHER">{{ i18n.t('assets.typeOther') }}</option>
                </select>
              </label>

              <label>
                {{ i18n.t('assets.estimatedValue') }}
                <input type="number" min="0" step="0.01" formControlName="estimatedValue" />
              </label>
            </div>

            <div class="form-row">
              <label>
                {{ i18n.t('accounts.currency') }}
                <select formControlName="currencyCode">
                  <option value="EUR">EUR</option>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                </select>
              </label>

              <label>
                {{ i18n.t('assets.country') }}
                <select formControlName="countryCode">
                  <option value="DE">{{ i18n.t('accounts.countryGermany') }}</option>
                  <option value="CO">{{ i18n.t('accounts.countryColombia') }}</option>
                </select>
              </label>
            </div>

            <label>
              {{ i18n.t('assets.acquisitionDate') }}
              <input type="date" formControlName="acquisitionDate" />
            </label>

            <label>
              {{ i18n.t('assets.description') }}
              <textarea rows="3" formControlName="description"></textarea>
            </label>

            <button type="submit" [disabled]="form.invalid || saving">
              {{ saving ? i18n.t('common.saving') : i18n.t('assets.create') }}
            </button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('assets.listTitle') }}</h3>
            <span>{{ state.loading ? i18n.t('common.loading') : state.assets.length + ' ' + i18n.t('common.total') }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && state.assets.length === 0">
            <strong>{{ i18n.t('assets.emptyTitle') }}</strong>
            <p>{{ i18n.t('assets.emptyHint') }}</p>
          </div>

          <div class="data-table" *ngIf="state.assets.length > 0">
            <div class="data-row asset-row heading">
              <span>{{ i18n.t('assets.name') }}</span>
              <span>{{ i18n.t('assets.type') }}</span>
              <span>{{ i18n.t('assets.country') }}</span>
              <span>{{ i18n.t('assets.estimatedValue') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>

            <div class="data-row asset-row" *ngFor="let asset of state.assets">
              <span>
                <strong>{{ asset.name }}</strong>
                <small>{{ asset.active ? i18n.t('common.active') : i18n.t('assets.retired') }}</small>
              </span>
              <span>{{ labelForType(asset.type) }}</span>
              <span>{{ asset.countryCode }}</span>
              <span>
                <strong>{{ asset.estimatedValue | currency: asset.currencyCode : 'symbol' : '1.2-2' }}</strong>
                <small *ngIf="asset.acquisitionDate">{{ asset.acquisitionDate | date: 'dd MMM y' }}</small>
              </span>
              <span class="table-actions">
                <button class="table-action" type="button" *ngIf="asset.active" (click)="retireAsset(asset.id)">
                  {{ i18n.t('assets.retire') }}
                </button>
                <button class="table-action" type="button" *ngIf="!asset.active" (click)="activateAsset(asset.id)">
                  {{ i18n.t('assets.activate') }}
                </button>
              </span>
            </div>
          </div>
        </article>
      </section>
    </main>
  `
})
export class AssetsPage {
  private readonly assets = inject(AssetsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);

  showForm = false;
  saving = false;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    type: ['HOUSE' as AssetType, Validators.required],
    currencyCode: ['EUR', Validators.required],
    countryCode: ['DE', Validators.required],
    estimatedValue: [0, [Validators.required, Validators.min(0)]],
    acquisitionDate: [''],
    description: ['', Validators.maxLength(500)]
  });

  readonly state$: Observable<{ loading: boolean; assets: Asset[]; error: string | null }> = this.reload$.pipe(
    switchMap(() =>
      this.assets.list().pipe(
        map((assets) => ({ loading: false, assets, error: null })),
        startWith({ loading: true, assets: [], error: null }),
        catchError(() =>
          of({
            loading: false,
            assets: [],
            error: this.i18n.t('assets.loadError')
          })
        )
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  createAsset(): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    const raw = this.form.getRawValue();
    const request: AssetRequest = {
      ...raw,
      acquisitionDate: raw.acquisitionDate || null,
      description: raw.description || null
    };

    this.saving = true;
    this.assets
      .create(request)
      .pipe(
        tap(() => {
          this.form.reset({
            name: '',
            type: 'HOUSE',
            currencyCode: 'EUR',
            countryCode: 'DE',
            estimatedValue: 0,
            acquisitionDate: '',
            description: ''
          });
          this.showForm = false;
          this.reload$.next();
        }),
        catchError(() => of(null)),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe();
  }

  countByType(assets: Asset[], type: AssetType): number {
    return assets.filter((asset) => asset.active && asset.type === type).length;
  }

  primaryCurrency(assets: Asset[]): string {
    return assets.find((asset) => asset.active)?.currencyCode ?? assets[0]?.currencyCode ?? 'EUR';
  }

  totalValue(assets: Asset[], currencyCode: string): number {
    return assets
      .filter((asset) => asset.active && asset.currencyCode === currencyCode)
      .reduce((total, asset) => total + Number(asset.estimatedValue || 0), 0);
  }

  retireAsset(assetId: string): void {
    this.assets.retire(assetId).subscribe(() => this.reload$.next());
  }

  activateAsset(assetId: string): void {
    this.assets.activate(assetId).subscribe(() => this.reload$.next());
  }

  labelForType(type: AssetType): string {
    const labels: Record<AssetType, string> = {
      HOUSE: this.i18n.t('assets.typeHouse'),
      VEHICLE: this.i18n.t('assets.typeVehicle'),
      ELECTRONICS: this.i18n.t('assets.typeElectronics'),
      FURNITURE: this.i18n.t('assets.typeFurniture'),
      OTHER: this.i18n.t('assets.typeOther')
    };
    return labels[type];
  }
}
