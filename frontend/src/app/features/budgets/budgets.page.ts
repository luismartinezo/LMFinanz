import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, map, of, startWith, switchMap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { BudgetItem, BudgetItemRequest, CountryCode, CurrencyCode } from './budgets.models';
import { BudgetsService } from './budgets.service';

@Component({
  selector: 'app-budgets-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page budget-page" *ngIf="state$ | async as state">
      <section class="page-heading budget-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('budget.eyebrow') }}</p>
          <h2>{{ i18n.t('budget.title') }}</h2>
          <p>{{ i18n.t('budget.subtitle') }}</p>
        </div>
        <button type="button" (click)="toggleForm()">
          {{ showForm ? i18n.t('accounts.closeForm') : i18n.t('budget.newItem') }}
        </button>
      </section>

      <section class="panel budget-controls">
        <label>
          {{ i18n.t('budget.year') }}
          <input type="number" min="2000" [value]="budgetYear" (change)="setYear($event)" />
        </label>
        <label>
          {{ i18n.t('budget.month') }}
          <select [value]="budgetMonth" (change)="setMonth($event)">
            <option *ngFor="let month of months" [value]="month.value">{{ month.label }}</option>
          </select>
        </label>
        <label>
          {{ i18n.t('budget.country') }}
          <select [value]="countryCode" (change)="setCountry($event)">
            <option value="DE">{{ i18n.t('accounts.countryGermany') }}</option>
            <option value="CO">{{ i18n.t('accounts.countryColombia') }}</option>
          </select>
        </label>
        <label>
          {{ i18n.t('budget.currency') }}
          <select [value]="currencyCode" (change)="setCurrency($event)">
            <option value="EUR">EUR</option>
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="metric-grid budget-summary">
        <article>
          <span>{{ i18n.t('budget.planned') }}</span>
          <strong>{{ totalPlanned(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}</strong>
          <small>{{ i18n.t('budget.plannedHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.actual') }}</span>
          <strong>{{ totalActual(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}</strong>
          <small>{{ i18n.t('budget.actualHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.remaining') }}</span>
          <strong [class.negative]="totalRemaining(state.items) < 0">
            {{ totalRemaining(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.remainingHint') }}</small>
        </article>
      </section>

      <section class="content-grid budget-layout">
        <article class="panel" *ngIf="showForm">
          <div class="panel-title">
            <h3>{{ i18n.t('budget.newItem') }}</h3>
            <span>{{ i18n.t('common.requiredFields') }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createItem()">
            <label>
              {{ i18n.t('budget.name') }}
              <input formControlName="name" />
            </label>

            <div class="form-row">
              <label>
                {{ i18n.t('budget.planned') }}
                <input type="number" min="0" step="0.01" formControlName="plannedAmount" />
              </label>
              <label>
                {{ i18n.t('budget.dueDay') }}
                <input type="number" min="1" max="31" formControlName="dueDay" />
              </label>
            </div>

            <label>
              {{ i18n.t('budget.notes') }}
              <textarea rows="3" formControlName="notes"></textarea>
            </label>

            <button type="submit" [disabled]="form.invalid || saving">
              {{ saving ? i18n.t('common.saving') : i18n.t('budget.create') }}
            </button>
          </form>
        </article>

        <article class="panel budget-table-panel">
          <div class="panel-title">
            <h3>{{ i18n.t('budget.tableTitle') }}</h3>
            <span>{{ state.loading ? i18n.t('common.loading') : state.items.length + ' ' + i18n.t('common.total') }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && state.items.length === 0">
            <strong>{{ i18n.t('budget.emptyTitle') }}</strong>
            <p>{{ i18n.t('budget.emptyHint') }}</p>
          </div>

          <div class="budget-table" *ngIf="state.items.length > 0">
            <div class="budget-row heading">
              <span>{{ i18n.t('budget.name') }}</span>
              <span>{{ i18n.t('budget.planned') }}</span>
              <span>{{ i18n.t('budget.actual') }}</span>
              <span>{{ i18n.t('budget.remaining') }}</span>
              <span>{{ i18n.t('budget.dueDay') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>
            <div class="budget-row" *ngFor="let item of state.items" [class.paid]="item.paid">
              <span>
                <strong>{{ item.name }}</strong>
                <small *ngIf="item.notes">{{ item.notes }}</small>
              </span>
              <span>{{ item.plannedAmount | currency: item.currencyCode : 'symbol' : '1.2-2' }}</span>
              <span>{{ item.actualAmount | currency: item.currencyCode : 'symbol' : '1.2-2' }}</span>
              <span [class.negative]="item.remainingAmount < 0">{{ item.remainingAmount | currency: item.currencyCode : 'symbol' : '1.2-2' }}</span>
              <span>
                <strong *ngIf="item.dueDay">{{ item.dueDay }}</strong>
                <small *ngIf="item.paidDate">{{ item.paidDate | date: 'dd MMM y' }}</small>
              </span>
              <span class="table-actions">
                <button class="table-action" type="button" *ngIf="!item.paid" (click)="markPaid(item)">
                  {{ i18n.t('budget.markPaid') }}
                </button>
                <button class="table-action" type="button" *ngIf="item.paid" (click)="markUnpaid(item)">
                  {{ i18n.t('budget.markUnpaid') }}
                </button>
              </span>
            </div>
          </div>
        </article>
      </section>
    </main>
  `
})
export class BudgetsPage {
  private readonly budgets = inject(BudgetsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);

  readonly months = [
    { value: 1, label: '01' },
    { value: 2, label: '02' },
    { value: 3, label: '03' },
    { value: 4, label: '04' },
    { value: 5, label: '05' },
    { value: 6, label: '06' },
    { value: 7, label: '07' },
    { value: 8, label: '08' },
    { value: 9, label: '09' },
    { value: 10, label: '10' },
    { value: 11, label: '11' },
    { value: 12, label: '12' }
  ];

  budgetYear = new Date().getFullYear();
  budgetMonth = new Date().getMonth() + 1;
  countryCode: CountryCode = 'DE';
  currencyCode: CurrencyCode = 'EUR';
  showForm = false;
  saving = false;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    plannedAmount: [0, [Validators.required, Validators.min(0)]],
    dueDay: [1, [Validators.min(1), Validators.max(31)]],
    notes: ['', Validators.maxLength(500)]
  });

  readonly state$: Observable<{ loading: boolean; items: BudgetItem[]; error: string | null }> = this.reload$.pipe(
    switchMap(() =>
      this.budgets.list(this.budgetYear, this.budgetMonth, this.countryCode, this.currencyCode).pipe(
        map((items) => ({ loading: false, items, error: null })),
        startWith({ loading: true, items: [], error: null }),
        catchError(() => of({ loading: false, items: [], error: this.i18n.t('budget.loadError') }))
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  setYear(event: Event): void {
    this.budgetYear = Number((event.target as HTMLInputElement).value);
    this.reload$.next();
  }

  setMonth(event: Event): void {
    this.budgetMonth = Number((event.target as HTMLSelectElement).value);
    this.reload$.next();
  }

  setCountry(event: Event): void {
    this.countryCode = (event.target as HTMLSelectElement).value as CountryCode;
    this.currencyCode = this.countryCode === 'CO' ? 'COP' : 'EUR';
    this.reload$.next();
  }

  setCurrency(event: Event): void {
    this.currencyCode = (event.target as HTMLSelectElement).value as CurrencyCode;
    this.reload$.next();
  }

  createItem(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving = true;
    this.budgets
      .create(this.buildRequest())
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.form.reset({ name: '', plannedAmount: 0, dueDay: 1, notes: '' });
          this.reload$.next();
        }
      });
  }

  markPaid(item: BudgetItem): void {
    this.budgets.markPaid(item.id, item.plannedAmount, this.today()).subscribe(() => this.reload$.next());
  }

  markUnpaid(item: BudgetItem): void {
    this.budgets.markUnpaid(item.id).subscribe(() => this.reload$.next());
  }

  totalPlanned(items: BudgetItem[]): number {
    return items.reduce((sum, item) => sum + item.plannedAmount, 0);
  }

  totalActual(items: BudgetItem[]): number {
    return items.reduce((sum, item) => sum + item.actualAmount, 0);
  }

  totalRemaining(items: BudgetItem[]): number {
    return items.reduce((sum, item) => sum + item.remainingAmount, 0);
  }

  private buildRequest(): BudgetItemRequest {
    const value = this.form.getRawValue();
    return {
      budgetYear: this.budgetYear,
      budgetMonth: this.budgetMonth,
      countryCode: this.countryCode,
      currencyCode: this.currencyCode,
      name: value.name,
      plannedAmount: value.plannedAmount,
      actualAmount: 0,
      dueDay: value.dueDay || null,
      paid: false,
      paidDate: null,
      notes: value.notes || null
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
