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
  DashboardTransaction,
  FinancialReport,
  ReportBreakdownItem
} from './dashboard.models';

@Component({
  selector: 'app-dashboard-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf],
  template: `
    <main class="dashboard dashboard-pro" *ngIf="state$ | async as state">
      <section class="dashboard-hero pro-hero">
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
        <div class="hero-summary">
          <span>{{ i18n.t('dashboard.netWorth') }}</span>
          <strong [class.negative]="netWorth(state, primaryCurrency(state)) < 0">
            {{ netWorth(state, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}
          </strong>
          <button type="button">{{ i18n.t('dashboard.newTransaction') }}</button>
        </div>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <div class="metric-grid pro-metrics">
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
            <span>{{ i18n.t('dashboard.reportLines') }}</span>
            <b>RP</b>
          </div>
          <strong>{{ state.report?.breakdown?.length ?? 0 | number }}</strong>
          <small>{{ i18n.t('dashboard.reportLinesHint') }}</small>
        </article>
      </div>

      <section class="dashboard-pro-grid">
        <article class="panel sales-overview">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.monthlyMovement') }}</h3>
            <span>{{ primaryCurrency(state) }}</span>
          </div>
          <div class="chart-shell" *ngIf="!isEmpty(state.report)">
            <div class="cashflow-bars">
              <div class="cashflow-bar income" [style.--bar-height.%]="reportMetricHeight(state.report, 'income')">
                <span>{{ money(state.report?.totalIncome) | currency: primaryCurrency(state) : 'symbol' : '1.0-0' }}</span>
                <i></i>
                <small>{{ i18n.t('dashboard.income') }}</small>
              </div>
              <div class="cashflow-bar expense" [style.--bar-height.%]="reportMetricHeight(state.report, 'expenses')">
                <span>{{ money(state.report?.totalExpenses) | currency: primaryCurrency(state) : 'symbol' : '1.0-0' }}</span>
                <i></i>
                <small>{{ i18n.t('dashboard.expenses') }}</small>
              </div>
              <div class="cashflow-bar net" [class.negative]="money(state.report?.netCashFlow) < 0" [style.--bar-height.%]="reportMetricHeight(state.report, 'net')">
                <span>{{ money(state.report?.netCashFlow) | currency: primaryCurrency(state) : 'symbol' : '1.0-0' }}</span>
                <i></i>
                <small>{{ i18n.t('dashboard.netCashFlow') }}</small>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="isEmpty(state.report)">
            <strong>{{ i18n.t('dashboard.noTransactions') }}</strong>
            <p>{{ i18n.t('dashboard.noTransactionsHint') }}</p>
          </div>
        </article>

        <article class="panel health-panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.financialHealth') }}</h3>
            <span>{{ healthLabel(state.report) }}</span>
          </div>
          <div class="gauge" [style.--value.%]="healthScore(state.report)">
            <strong>{{ healthScore(state.report) | number: '1.0-0' }}%</strong>
            <span>{{ i18n.t('dashboard.savingsCapacity') }}</span>
          </div>
          <ul class="legend-list">
            <li><i class="legend-income"></i>{{ i18n.t('dashboard.savingsCapacity') }}</li>
            <li><i class="legend-expense"></i>{{ i18n.t('dashboard.expensePressure') }}</li>
            <li><i class="legend-cash"></i>{{ i18n.t('dashboard.netPosition') }}</li>
          </ul>
        </article>

        <article class="panel category-panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.topCategories') }}</h3>
            <span>{{ state.report?.breakdown?.length ?? 0 }}</span>
          </div>
          <div class="stacked-strip" *ngIf="topBreakdown(state.report).length > 0">
            <span *ngFor="let item of topBreakdown(state.report)" [style.flex]="stripWeight(item)"></span>
          </div>
          <ul class="category-list">
            <li *ngFor="let item of topBreakdown(state.report)">
              <span><i></i>{{ item.label }}</span>
              <strong>{{ item.amount | currency: item.currencyCode : 'symbol' : '1.2-2' }}</strong>
            </li>
          </ul>
        </article>

        <article class="panel recent-transactions">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.latestTransactions') }}</h3>
            <span>{{ state.transactions.length }}</span>
          </div>
          <ul class="transaction-list">
            <li *ngFor="let transaction of recentTransactions(state.transactions)">
              <span class="transaction-icon" [class.expense]="transaction.type === 'EXPENSE'" [class.transfer]="transaction.type === 'TRANSFER'">
                {{ transaction.type.charAt(0) }}
              </span>
              <div>
                <strong>{{ transaction.description || transaction.type }}</strong>
                <small>{{ transaction.transactionDate | date: 'dd MMM y' }} · {{ transaction.countryCode }}</small>
              </div>
              <b [class.negative]="transaction.type === 'EXPENSE'">
                {{ signedTransactionAmount(transaction) | currency: transaction.currencyCode : 'symbol' : '1.2-2' }}
              </b>
            </li>
          </ul>
        </article>

        <article class="panel portfolio-panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.portfolioSnapshot') }}</h3>
            <span>{{ primaryCurrency(state) }}</span>
          </div>
          <div class="mini-stat-grid">
            <div>
              <span>{{ i18n.t('app.assets') }}</span>
              <strong>{{ assetValue(state.assets, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
            </div>
            <div>
              <span>{{ i18n.t('app.debts') }}</span>
              <strong>{{ debtBalance(state.debts, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
            </div>
            <div>
              <span>{{ i18n.t('app.savings') }}</span>
              <strong>{{ savingsBalance(state.savingsGoals, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}</strong>
            </div>
          </div>
          <ul class="status-list compact">
            <li *ngFor="let currency of currencies(state)">
              <span>{{ currency }}</span>
              <strong>{{ accountBalance(state.accounts, currency) | currency: currency : 'symbol' : '1.2-2' }}</strong>
            </li>
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
      transactions: [],
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
        transactions: [],
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

  reportMetricHeight(report: FinancialReport | null, metric: 'income' | 'expenses' | 'net'): number {
    const income = this.money(report?.totalIncome);
    const expenses = this.money(report?.totalExpenses);
    const netCashFlow = this.money(report?.netCashFlow);
    const max = Math.max(Math.abs(income), Math.abs(expenses), Math.abs(netCashFlow), 1);
    const values = {
      income,
      expenses,
      net: netCashFlow
    };

    return Math.max(16, (Math.abs(values[metric]) / max) * 100);
  }

  stripWeight(item: ReportBreakdownItem): number {
    return Math.max(1, Math.abs(item.amount));
  }

  recentTransactions(transactions: DashboardTransaction[]): DashboardTransaction[] {
    return [...transactions].sort((left, right) => right.transactionDate.localeCompare(left.transactionDate)).slice(0, 6);
  }

  signedTransactionAmount(transaction: DashboardTransaction): number {
    if (transaction.type === 'EXPENSE') {
      return -Math.abs(transaction.amount);
    }
    return transaction.amount;
  }

  savingsRate(report: FinancialReport | null): number {
    const income = this.money(report?.totalIncome);
    if (income <= 0) {
      return 0;
    }
    return Math.max((this.money(report?.netCashFlow) / income) * 100, 0);
  }

  healthScore(report: FinancialReport | null): number {
    return Math.min(100, Math.max(0, this.savingsRate(report)));
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
