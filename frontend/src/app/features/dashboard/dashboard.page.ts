import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { DashboardState, FinancialReport, ReportBreakdownItem } from './dashboard.models';

@Component({
  selector: 'app-dashboard-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf],
  template: `
    <main class="dashboard" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Overview</p>
          <h2>Tu centro financiero</h2>
          <p>
            Metricas del mes
            <ng-container *ngIf="state.report">
              · {{ state.report.from | date: 'dd MMM' }} - {{ state.report.to | date: 'dd MMM y' }}
            </ng-container>
          </p>
        </div>
        <button type="button">New transaction</button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <div class="metric-grid">
        <article>
          <span>Income</span>
          <strong>{{ money(state.report?.totalIncome) | currency: 'EUR' : 'symbol' : '1.2-2' }}</strong>
          <small>Posted income this month</small>
        </article>
        <article>
          <span>Expenses</span>
          <strong>{{ money(state.report?.totalExpenses) | currency: 'EUR' : 'symbol' : '1.2-2' }}</strong>
          <small>Posted expenses this month</small>
        </article>
        <article>
          <span>Net cash flow</span>
          <strong [class.negative]="money(state.report?.netCashFlow) < 0">
            {{ money(state.report?.netCashFlow) | currency: 'EUR' : 'symbol' : '1.2-2' }}
          </strong>
          <small>Income minus expenses</small>
        </article>
        <article>
          <span>Report lines</span>
          <strong>{{ state.report?.breakdown?.length ?? 0 | number }}</strong>
          <small>Grouped by period</small>
        </article>
      </div>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-title">
            <h3>Monthly movement</h3>
            <span *ngIf="state.loading">Loading</span>
            <span *ngIf="!state.loading">EUR · COP · USD</span>
          </div>
          <div class="empty-state" *ngIf="isEmpty(state.report)">
            <strong>No posted transactions yet</strong>
            <p>Cuando registres y publiques movimientos, las metricas se actualizaran desde el backend.</p>
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
            <h3>Financial health</h3>
            <span>{{ healthLabel(state.report) }}</span>
          </div>
          <ul class="status-list compact">
            <li><span>Savings capacity</span><strong>{{ savingsRate(state.report) | number: '1.0-0' }}%</strong></li>
            <li><span>Expense pressure</span><strong>{{ expensePressure(state.report) | number: '1.0-0' }}%</strong></li>
            <li><span>Net position</span><strong>{{ netPosition(state.report) }}</strong></li>
            <li><span>Data source</span><strong>API</strong></li>
          </ul>
        </article>
      </section>
    </main>
  `
})
export class DashboardPage {
  private readonly dashboard = inject(DashboardService);
  private readonly range = this.currentMonthRange();

  readonly state$: Observable<DashboardState> = this.dashboard.monthlySummary(this.range.from, this.range.to).pipe(
    map((report) => ({ loading: false, report, error: null })),
    startWith({ loading: true, report: null, error: null }),
    catchError(() =>
      of({
        loading: false,
        report: null,
        error: 'No se pudieron cargar las metricas. Verifica que el backend este corriendo.'
      })
    )
  );

  money(value: number | null | undefined): number {
    return Number(value ?? 0);
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
      return 'No data';
    }
    return netCashFlow >= 0 ? 'Stable' : 'Attention';
  }

  netPosition(report: FinancialReport | null): string {
    const netCashFlow = this.money(report?.netCashFlow);
    if (!report || report.breakdown.length === 0) {
      return 'Pending';
    }
    return netCashFlow >= 0 ? 'Positive' : 'Negative';
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
