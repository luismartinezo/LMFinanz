import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { DashboardService } from './dashboard.service';
import {
  DashboardAccount,
  DashboardAsset,
  DashboardBudgetSummary,
  DashboardDebt,
  DashboardSavingsGoal,
  DashboardState,
  DashboardTransaction,
  FinancialReport,
  ReportBreakdownItem
} from './dashboard.models';

@Component({
  selector: 'app-dashboard-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf, ReactiveFormsModule],
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
          <span>{{ i18n.t('dashboard.availableNow') }}</span>
          <div class="hero-balance-grid">
            <strong [class.negative]="accountBalanceByCountryCurrency(state.accounts, 'DE', 'EUR') < 0">
              {{ accountBalanceByCountryCurrency(state.accounts, 'DE', 'EUR') | currency: 'EUR' : 'symbol' : '1.2-2' }}
              <small>{{ i18n.t('accounts.countryGermany') }}</small>
            </strong>
            <strong [class.negative]="accountBalanceByCountryCurrency(state.accounts, 'CO', 'COP') < 0">
              {{ accountBalanceByCountryCurrency(state.accounts, 'CO', 'COP') | currency: 'COP' : 'symbol' : '1.2-2' }}
              <small>{{ i18n.t('accounts.countryColombia') }}</small>
            </strong>
          </div>
          <button type="button">{{ i18n.t('dashboard.newTransaction') }}</button>
        </div>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="panel dashboard-income-editor">
        <div>
          <p class="eyebrow">{{ i18n.t('dashboard.plannedIncomeEyebrow') }}</p>
          <h3>{{ i18n.t('dashboard.plannedIncomeTitle') }}</h3>
          <p>{{ i18n.t('dashboard.plannedIncomeHint') }}</p>
        </div>
        <form [formGroup]="incomeForm" (ngSubmit)="saveIncome()" class="dashboard-income-form">
          <label>
            {{ i18n.t('accounts.countryGermany') }} · EUR
            <input type="number" min="0" step="0.01" formControlName="deIncome" />
          </label>
          <label>
            {{ i18n.t('accounts.countryColombia') }} · COP
            <input type="number" min="0" step="0.01" formControlName="coIncome" />
          </label>
          <button type="submit" [disabled]="incomeForm.invalid || savingIncome">
            {{ savingIncome ? i18n.t('common.saving') : i18n.t('dashboard.saveIncome') }}
          </button>
        </form>
      </section>

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
        <article class="metric-card cash">
          <div class="metric-topline">
            <span>{{ i18n.t('dashboard.availableNow') }}</span>
            <b>AV</b>
          </div>
          <strong [class.negative]="accountBalance(state.accounts, primaryCurrency(state)) < 0">
            {{ accountBalance(state.accounts, primaryCurrency(state)) | currency: primaryCurrency(state) : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('dashboard.availableHint') }}</small>
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

        <article class="panel liquidity-panel">
          <div class="panel-title">
            <h3>{{ i18n.t('dashboard.availableByCountry') }}</h3>
            <span>{{ i18n.t('dashboard.availableNow') }}</span>
          </div>
          <ul class="status-list liquidity-list">
            <li>
              <span>{{ i18n.t('accounts.countryGermany') }} · EUR</span>
              <strong [class.negative]="accountBalanceByCountryCurrency(state.accounts, 'DE', 'EUR') < 0">
                {{ accountBalanceByCountryCurrency(state.accounts, 'DE', 'EUR') | currency: 'EUR' : 'symbol' : '1.2-2' }}
              </strong>
            </li>
            <li>
              <span>{{ i18n.t('accounts.countryColombia') }} · COP</span>
              <strong [class.negative]="accountBalanceByCountryCurrency(state.accounts, 'CO', 'COP') < 0">
                {{ accountBalanceByCountryCurrency(state.accounts, 'CO', 'COP') | currency: 'COP' : 'symbol' : '1.2-2' }}
              </strong>
            </li>
            <li>
              <span>USD</span>
              <strong [class.negative]="accountBalance(state.accounts, 'USD') < 0">
                {{ accountBalance(state.accounts, 'USD') | currency: 'USD' : 'symbol' : '1.2-2' }}
              </strong>
            </li>
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

      </section>
    </main>
  `
})
export class DashboardPage {
  private readonly dashboard = inject(DashboardService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly range = this.currentMonthRange();
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);
  savingIncome = false;

  readonly incomeForm = this.formBuilder.nonNullable.group({
    deIncome: [0, [Validators.required, Validators.min(0)]],
    coIncome: [0, [Validators.required, Validators.min(0)]]
  });

  readonly state$: Observable<DashboardState> = this.reload$.pipe(
    switchMap(() =>
      this.dashboard.overview(this.range.from, this.range.to).pipe(
        tap((overview) => this.patchIncomeForm(overview.incomeSummaries)),
        map((overview) => ({ loading: false, ...overview, error: null })),
        startWith({
          loading: true,
          report: null,
          incomeSummaries: [],
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
            incomeSummaries: [],
            accounts: [],
            debts: [],
            savingsGoals: [],
            assets: [],
            transactions: [],
            error: this.i18n.t('dashboard.loadError')
          })
        )
      )
    )
  );

  saveIncome(): void {
    if (this.incomeForm.invalid || this.savingIncome) {
      return;
    }
    const value = this.incomeForm.getRawValue();
    const period = this.dashboardPeriod();
    this.savingIncome = true;
    this.dashboard
      .saveBudgetSummary({
        ...period,
        countryCode: 'DE',
        currencyCode: 'EUR',
        incomeAmount: value.deIncome,
        notes: null
      })
      .pipe(
        switchMap(() =>
          this.dashboard.saveBudgetSummary({
            ...period,
            countryCode: 'CO',
            currencyCode: 'COP',
            incomeAmount: value.coIncome,
            notes: null
          })
        ),
        finalize(() => {
          this.savingIncome = false;
        })
      )
      .subscribe(() => this.reload$.next());
  }

  private patchIncomeForm(summaries: DashboardBudgetSummary[]): void {
    this.incomeForm.patchValue(
      {
        deIncome: this.incomeFor(summaries, 'DE', 'EUR'),
        coIncome: this.incomeFor(summaries, 'CO', 'COP')
      },
      { emitEvent: false }
    );
  }

  private incomeFor(summaries: DashboardBudgetSummary[], countryCode: string, currencyCode: string): number {
    return summaries.find((summary) => summary.countryCode === countryCode && summary.currencyCode === currencyCode)?.incomeAmount ?? 0;
  }

  private dashboardPeriod(): { budgetYear: number; budgetMonth: number } {
    const date = new Date(`${this.range.from}T00:00:00`);
    return {
      budgetYear: date.getFullYear(),
      budgetMonth: date.getMonth() + 1
    };
  }

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

  accountBalanceByCountryCurrency(accounts: DashboardAccount[], countryCode: string, currencyCode: string): number {
    return accounts
      .filter((account) => account.active && account.countryCode === countryCode && account.currencyCode === currencyCode)
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
