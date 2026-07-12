import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { FinancialReport, ReportBreakdownItem, ReportFilters, ReportMode, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';

@Component({
  selector: 'app-reports-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('reports.eyebrow') }}</p>
          <h2>{{ i18n.t('reports.title') }}</h2>
          <p>{{ i18n.t('reports.subtitle') }}</p>
        </div>
        <button type="button" (click)="refresh()">{{ i18n.t('reports.refresh') }}</button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="panel report-filters">
        <form [formGroup]="form" (ngSubmit)="refresh()">
          <label>
            {{ i18n.t('reports.mode') }}
            <select formControlName="mode">
              <option value="SUMMARY">{{ i18n.t('reports.modeSummary') }}</option>
              <option value="CURRENCY">{{ i18n.t('reports.modeCurrency') }}</option>
              <option value="COUNTRY">{{ i18n.t('reports.modeCountry') }}</option>
            </select>
          </label>

          <label>
            {{ i18n.t('reports.period') }}
            <select formControlName="period">
              <option value="DAILY">{{ i18n.t('reports.daily') }}</option>
              <option value="MONTHLY">{{ i18n.t('reports.monthly') }}</option>
              <option value="YEARLY">{{ i18n.t('reports.yearly') }}</option>
              <option value="CUSTOM">{{ i18n.t('reports.custom') }}</option>
            </select>
          </label>

          <label>
            {{ i18n.t('reports.from') }}
            <input type="date" formControlName="from" />
          </label>

          <label>
            {{ i18n.t('reports.to') }}
            <input type="date" formControlName="to" />
          </label>

          <label *ngIf="form.controls.mode.value === 'CURRENCY'">
            {{ i18n.t('accounts.currency') }}
            <select formControlName="currencyCode">
              <option value="EUR">EUR</option>
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label *ngIf="form.controls.mode.value === 'COUNTRY'">
            {{ i18n.t('accounts.country') }}
            <select formControlName="countryCode">
              <option value="DE">{{ i18n.t('accounts.countryGermany') }}</option>
              <option value="CO">{{ i18n.t('accounts.countryColombia') }}</option>
            </select>
          </label>

          <button type="submit" [disabled]="form.invalid || state.loading">{{ i18n.t('reports.apply') }}</button>
        </form>
      </section>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('reports.totalIncome') }}</span>
          <strong>{{ state.report?.totalIncome || 0 | currency: primaryCurrency(state.report) : 'symbol' : '1.2-2' }}</strong>
          <p>{{ i18n.t('reports.totalIncomeHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('reports.totalExpenses') }}</span>
          <strong>{{ state.report?.totalExpenses || 0 | currency: primaryCurrency(state.report) : 'symbol' : '1.2-2' }}</strong>
          <p>{{ i18n.t('reports.totalExpensesHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('reports.netCashFlow') }}</span>
          <strong>{{ state.report?.netCashFlow || 0 | currency: primaryCurrency(state.report) : 'symbol' : '1.2-2' }}</strong>
          <p>{{ i18n.t('reports.netCashFlowHint') }}</p>
        </article>
      </section>

      <section class="panel">
        <div class="panel-title">
          <h3>{{ i18n.t('reports.breakdown') }}</h3>
          <span *ngIf="state.report">{{ state.report.from | date: 'dd MMM y' }} - {{ state.report.to | date: 'dd MMM y' }}</span>
        </div>

        <div class="empty-state" *ngIf="!state.loading && (!state.report || state.report.breakdown.length === 0)">
          <strong>{{ i18n.t('reports.emptyTitle') }}</strong>
          <p>{{ i18n.t('reports.emptyHint') }}</p>
        </div>

        <div class="data-table" *ngIf="state.report && state.report.breakdown.length > 0">
          <div class="data-row report-row heading">
            <span>{{ i18n.t('reports.label') }}</span>
            <span>{{ i18n.t('accounts.currency') }}</span>
            <span>{{ i18n.t('accounts.country') }}</span>
            <span>{{ i18n.t('transactions.amount') }}</span>
          </div>

          <div class="data-row report-row" *ngFor="let item of state.report.breakdown">
            <span><strong>{{ item.label }}</strong></span>
            <span>{{ item.currencyCode }}</span>
            <span>{{ item.countryCode || '-' }}</span>
            <span>{{ item.amount | currency: item.currencyCode : 'symbol' : '1.2-2' }}</span>
          </div>
        </div>
      </section>
    </main>
  `
})
export class ReportsPage {
  private readonly reports = inject(ReportsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);

  readonly form = this.formBuilder.nonNullable.group({
    mode: ['SUMMARY' as ReportMode, Validators.required],
    period: ['MONTHLY' as ReportPeriod, Validators.required],
    from: [this.firstDayOfMonth(), Validators.required],
    to: [this.today(), Validators.required],
    currencyCode: ['EUR', Validators.required],
    countryCode: ['DE', Validators.required]
  });

  readonly state$: Observable<{ loading: boolean; report: FinancialReport | null; error: string | null }> = this.reload$.pipe(
    switchMap(() =>
      this.reports.load(this.form.getRawValue() as ReportFilters).pipe(
        map((report) => ({ loading: false, report, error: null })),
        startWith({ loading: true, report: null, error: null }),
        catchError(() =>
          of({
            loading: false,
            report: null,
            error: this.i18n.t('reports.loadError')
          })
        )
      )
    )
  );

  refresh(): void {
    if (this.form.invalid) {
      return;
    }
    this.reload$.next();
  }

  primaryCurrency(report: FinancialReport | null): string {
    return report?.breakdown.find((item: ReportBreakdownItem) => item.currencyCode)?.currencyCode ?? this.form.controls.currencyCode.value ?? 'EUR';
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private firstDayOfMonth(): string {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  }
}
