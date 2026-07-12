import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { DashboardService } from './dashboard.service';
import {
  DashboardAccount,
  DashboardAsset,
  DashboardDebt,
  DashboardSavingsGoal,
  DashboardState,
  FinancialReport,
  ReportBreakdownItem
} from './dashboard.models';

@Component({
  selector: 'app-dashboard-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf],
  template: `
    <main class="dashboard" *ngIf="state$ | async as state">
      <section class="page-heading dashboard-hero">
        <div>
          <p class="eyebrow">{{ i18n.t('dashboard.eyebrow') }}</p>
          <h2>{{ i18n.t('dashboard.title') }}</h2>
          <p>
            {{ i18n.t('dashboard.subtitle') }}
            <ng-container *ngIf="state.report">
              · {{ state.report.from | date: 'dd MMM' }} - {{ state.report.to | date: 'dd MMM y' }}
            </ng-container>
          </p>
        </div>
        <button type="button">{{ i18n.t('dashboard.newTransaction') }}</button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <div class="metric-grid">
        <article class="metric-card income">
          <div class="metric-topline">
            <span>{{ i18n.t('dashboard.income') }}</span>
            <b>IN</b>
          </div>
          <strong>{{ money(state.report?.totalIncome) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
          <small>{{ i18n.t('dashboard.incomeHint') }}</small>
        </article>
        <article class="metric-card expense">
          <div class="metric-topline">
            <span>{{ i18n.t('dashboard.expenses') }}</span>
            <b>EX</b>
          </div>
          <strong>{{ money(state.report?.totalExpenses) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
          <small>{{ i18n.t('dashboard.expensesHint') }}</small>
        </article>
        <article class="metric-card cashflow">
          <div class="metric-topline">
            <span>{{ i18n.t('dashboard.netCashFlow') }}</span>
            <b>CF</b>
          </div>
          <strong [class.negative]="money(state.report?.netCashFlow) < 0">
            {{ money(state.report?.netCashFlow) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('dashboard.netCashFlowHint') }}</small>
        </article>
        <article class="metric-card reports">
          <div class="metric-topline">
            <span>{{ i18n.t('dashboard.netWorth') }}</span>
            <b>NW</b>
          </div>
          <strong [class.negative]="netWorth(state, primaryCurrency(state)) < 0">
            {{ netWorth(state, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('dashboard.netWorthHint') }}</small>
        </article>
      </div>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.balanceByCurrency') }}</h3>
            <span>{{ state.accounts.length }} {{ i18n.t('app.accounts') }}</span>
          </div>
          <ul class="status-list compact">
            <li *ngFor="let currency of currencies(state)">
              <span>{{ currency }}</span>
              <strong>{{ accountBalance(state.accounts, currency) | currency: currency : 'symbol' : '1.2-2' }}</strong>
            </li>
          </ul>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.portfolioSnapshot') }}</h3>
            <span>{{ primaryCurrency(state) }}</span>
          </div>
          <ul class="status-list compact">
            <li>
              <span>{{ i18n.t('app.assets') }}</span>
              <strong>{{ assetValue(state.assets, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
            </li>
            <li>
              <span>{{ i18n.t('app.debts') }}</span>
              <strong>{{ debtBalance(state.debts, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
            </li>
            <li>
              <span>{{ i18n.t('app.savings') }}</span>
              <strong>{{ savingsBalance(state.savingsGoals, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
            </li>
            <li>
              <span>{{ i18n.t('dashboard.activeCountries') }}</span>
              <strong>{{ countries(state.accounts).join(' · ') || '-' }}</strong>
            </li>
          </ul>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.monthlyMovement') }}</h3>
            <span *ngIf="state.loading">{{ i18n.t('common.loading') }}</span>
            <span *ngIf="!state.loading">EUR · COP · USD</span>
          </div>
          <div class="empty-state" *ngIf="isEmpty(state.report)">
            <strong>{{ i18n.t('dashboard.noTransactions') }}</strong>
            <p>{{ i18n.t('dashboard.noTransactionsHint') }}</p>
          </div>
          <ul class="breakdown-list" *ngIf="!isEmpty(state.report)">
            <li *ngFor="let item of topBreakdown(state.report)">
              <div>
                <strong>{{ item.label }}</strong>
                <span>{{ item.currencyCode }} · {{ item.countryCode }}</span>
              </div>
              <span>{{ item.amount | currency: item.currencyCode : 'symbol' : '1.2-2' }}</span>
            </li>
          </ul>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.financialHealth') }}</h3>
            <span>{{ healthLabel(state.report) }}</span>
          </div>
          <ul class="status-list compact">
            <li><span>{{ i18n.t('dashboard.savingsCapacity') }}</span><strong>{{ savingsRate(state.report) | number: '1.0-0' }}%</strong></li>
            <li><span>{{ i18n.t('dashboard.expensePressure') }}</span><strong>{{ expensePressure(state.report) | number: '1.0-0' }}%</strong></li>
            <li><span>{{ i18n.t('dashboard.netPosition') }}</span><strong>{{ netPosition(state.report) }}</strong></li>
            <li><span>{{ i18n.t('dashboard.dataSource') }}</span><strong>API</strong></li>
          </ul>
        </article>
      </section>
    </main>
  `
})
export class DashboardPage {
  private readonly dashboard = inject(DashboardService);
  private readonly range = this.currentMonthRange();
  readonly i18n = inject(I18nService);

  readonly state$: Observable<DashboardState> = this.dashboard.overview(this.range.from, this.range.to).pipe(
    map((overview) => ({ loading: false, ...overview, error: null })),
    startWith({
      loading: true,
      report: null,
      accounts: [],
      debts: [],
      savingsGoals: [],
      assets: [],
      error: null
    }),
    catchError(() =>
      of({
        loading: false,
        report: null,
        accounts: [],
        debts: [],
        savingsGoals: [],
        assets: [],
        error: this.i18n.t('dashboard.loadError')
      })
    )
  );

  money(value: number | null | undefined): number {
    return Number(value ?? 0);
  }

  primaryCurrency(state: DashboardState): string {
    return (
      state.accounts.find((account) => account.active)?.currencyCode ??
      state.report?.breakdown.find((item) => item.currencyCode)?.currencyCode ??
      'EUR'
    );
  }

  currencies(state: DashboardState): string[] {
    const values = state.accounts.filter((account) => account.active).map((account) => account.currencyCode);
    return [...new Set(values.length > 0 ? values : ['EUR', 'COP', 'USD'])];
  }

  countries(accounts: DashboardAccount[]): string[] {
    return [...new Set(accounts.filter((account) => account.active).map((account) => account.countryCode))];
  }

  accountBalance(accounts: DashboardAccount[], currencyCode: string): number {
    return accounts
      .filter((account) => account.active && account.currencyCode === currencyCode)
      .reduce((total, account) => total + this.money(account.currentBalance), 0);
  }

  debtBalance(debts: DashboardDebt[], currencyCode: string): number {
    return debts
      .filter((debt) => debt.status === 'ACTIVE' && debt.currencyCode === currencyCode)
      .reduce((total, debt) => total + this.money(debt.remainingBalance), 0);
  }

  savingsBalance(goals: DashboardSavingsGoal[], currencyCode: string): number {
    return goals
      .filter((goal) => goal.status === 'ACTIVE' && goal.currencyCode === currencyCode)
      .reduce((total, goal) => total + this.money(goal.currentAmount), 0);
  }

  assetValue(assets: DashboardAsset[], currencyCode: string): number {
    return assets
      .filter((asset) => asset.active && asset.currencyCode === currencyCode)
      .reduce((total, asset) => total + this.money(asset.estimatedValue), 0);
  }

  netWorth(state: DashboardState, currencyCode: string): number {
    return (
      this.accountBalance(state.accounts, currencyCode) +
      this.assetValue(state.assets, currencyCode) +
      this.savingsBalance(state.savingsGoals, currencyCode) -
      this.debtBalance(state.debts, currencyCode)
    );
  }

  isEmpty(report: FinancialReport | null): boolean {
    return !report || report.breakdown.length === 0;
  }

  topBreakdown(report: FinancialReport | null): ReportBreakdownItem[] {
    return [...(report?.breakdown ?? [])].sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount)).slice(0, 6);
  }

  savingsRate(report: FinancialReport | null): number {
    const income = this.money(report?.totalIncome);
    if (income <= 0) {
      return 0;
    }
    return Math.max((this.money(report?.netCashFlow) / income) * 100, 0);
  }

  expensePressure(report: FinancialReport | null): number {
    const income = this.money(report?.totalIncome);
    if (income <= 0) {
      return 0;
    }
    return (this.money(report?.totalExpenses) / income) * 100;
  }

  healthLabel(report: FinancialReport | null): string {
    const netCashFlow = this.money(report?.netCashFlow);
    if (!report || report.breakdown.length === 0) {
      return this.i18n.t('dashboard.healthNoData');
    }
    return netCashFlow >= 0 ? this.i18n.t('dashboard.healthStable') : this.i18n.t('dashboard.healthAttention');
  }

  netPosition(report: FinancialReport | null): string {
    const netCashFlow = this.money(report?.netCashFlow);
    if (!report || report.breakdown.length === 0) {
      return this.i18n.t('dashboard.positionPending');
    }
    return netCashFlow >= 0 ? this.i18n.t('dashboard.positionPositive') : this.i18n.t('dashboard.positionNegative');
  }

  private currentMonthRange(): { from: string; to: string } {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      from: this.toDateInput(firstDay),
      to: this.toDateInput(today)
    };
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
