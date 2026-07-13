import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, forkJoin, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { BudgetItem, BudgetItemRequest, BudgetSummary, CountryCode, CurrencyCode } from './budgets.models';
import { BudgetsService } from './budgets.service';

interface BudgetState {
  loading: boolean;
  items: BudgetItem[];
  summary: BudgetSummary;
  error: string | null;
}

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
          <span>{{ i18n.t('budget.income') }}</span>
          <strong>{{ state.summary.incomeAmount | currency: currencyCode : 'symbol' : '1.2-2' }}</strong>
          <small>{{ i18n.t('budget.incomeHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.planned') }}</span>
          <strong>{{ totalPlanned(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}</strong>
          <small>{{ i18n.t('budget.plannedHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.paidAmount') }}</span>
          <strong>{{ totalActual(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}</strong>
          <small>{{ i18n.t('budget.paidAmountHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.available') }}</span>
          <strong [class.negative]="availableAfterPaid(state) < 0">
            {{ availableAfterPaid(state) | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.availableHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.projected') }}</span>
          <strong [class.negative]="projectedAfterPlanned(state) < 0">
            {{ projectedAfterPlanned(state) | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.projectedHint') }}</small>
        </article>
      </section>

      <section class="panel budget-income-panel">
        <div>
          <h3>{{ i18n.t('budget.globalIncome') }}</h3>
          <p>{{ i18n.t('budget.globalIncomeHint') }}</p>
        </div>
        <form [formGroup]="incomeForm" (ngSubmit)="saveIncome()" class="budget-income-form">
          <label>
            {{ i18n.t('budget.income') }}
            <input type="number" min="0" step="0.01" formControlName="incomeAmount" />
          </label>
          <button type="submit" [disabled]="incomeForm.invalid || savingIncome">
            {{ savingIncome ? i18n.t('common.saving') : i18n.t('budget.saveIncome') }}
          </button>
        </form>
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
                {{ i18n.t('budget.dueDate') }}
                <input type="date" formControlName="dueDate" />
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
              <span>{{ i18n.t('budget.paidAmount') }}</span>
              <span>{{ i18n.t('budget.remaining') }}</span>
              <span>{{ i18n.t('budget.dueDay') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>
            <div
              class="budget-row"
              *ngFor="let item of state.items"
              [class.paid]="item.paid"
              [class.due-safe]="dueStatus(item) === 'safe'"
              [class.due-warning]="dueStatus(item) === 'warning'"
              [class.due-danger]="dueStatus(item) === 'danger'"
              [formGroup]="editForm"
            >
              <span>
                <strong *ngIf="editingItemId !== item.id">{{ item.name }}</strong>
                <input *ngIf="editingItemId === item.id" formControlName="name" />
                <small *ngIf="item.notes">{{ item.notes }}</small>
              </span>
              <span>
                <ng-container *ngIf="editingItemId !== item.id; else plannedEdit">
                  {{ item.plannedAmount | currency: item.currencyCode : 'symbol' : '1.2-2' }}
                </ng-container>
                <ng-template #plannedEdit>
                  <input type="number" min="0" step="0.01" formControlName="plannedAmount" />
                </ng-template>
              </span>
              <span>
                <ng-container *ngIf="editingItemId !== item.id; else actualEdit">
                  {{ item.actualAmount | currency: item.currencyCode : 'symbol' : '1.2-2' }}
                </ng-container>
                <ng-template #actualEdit>
                  <input type="number" min="0" step="0.01" formControlName="actualAmount" />
                </ng-template>
              </span>
              <span [class.negative]="item.remainingAmount < 0">{{ item.remainingAmount | currency: item.currencyCode : 'symbol' : '1.2-2' }}</span>
              <span>
                <ng-container *ngIf="editingItemId !== item.id; else dateEdit">
                  <strong>{{ dueLabel(item) }}</strong>
                  <small *ngIf="item.paidDate">{{ item.paidDate | date: 'dd MMM y' }}</small>
                </ng-container>
                <ng-template #dateEdit>
                  <input type="date" formControlName="dueDate" />
                  <input type="date" formControlName="paidDate" />
                </ng-template>
              </span>
              <span class="table-actions">
                <button class="table-action" type="button" *ngIf="editingItemId !== item.id" (click)="startEdit(item)">
                  {{ i18n.t('budget.edit') }}
                </button>
                <button class="table-action" type="button" *ngIf="editingItemId === item.id" (click)="saveEdit(item)">
                  {{ i18n.t('budget.save') }}
                </button>
                <button class="table-action muted" type="button" *ngIf="editingItemId === item.id" (click)="cancelEdit()">
                  {{ i18n.t('budget.cancel') }}
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
  savingIncome = false;
  savingEdit = false;
  editingItemId: string | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    plannedAmount: [0, [Validators.required, Validators.min(0)]],
    dueDate: [this.defaultDueDate(), Validators.required],
    notes: ['', Validators.maxLength(500)]
  });

  readonly incomeForm = this.formBuilder.nonNullable.group({
    incomeAmount: [0, [Validators.required, Validators.min(0)]]
  });

  readonly editForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    plannedAmount: [0, [Validators.required, Validators.min(0)]],
    actualAmount: [0, [Validators.required, Validators.min(0)]],
    dueDate: ['', Validators.required],
    paidDate: [''],
    notes: ['', Validators.maxLength(500)]
  });

  readonly state$: Observable<BudgetState> = this.reload$.pipe(
    switchMap(() =>
      forkJoin({
        items: this.budgets.list(this.budgetYear, this.budgetMonth, this.countryCode, this.currencyCode),
        summary: this.budgets.getSummary(this.budgetYear, this.budgetMonth, this.countryCode, this.currencyCode)
      }).pipe(
        tap(({ summary }) => this.incomeForm.patchValue({ incomeAmount: summary.incomeAmount }, { emitEvent: false })),
        map(({ items, summary }) => ({ loading: false, items, summary, error: null })),
        startWith({ loading: true, items: [], summary: this.emptySummary(), error: null }),
        catchError(() => of({ loading: false, items: [], summary: this.emptySummary(), error: this.i18n.t('budget.loadError') }))
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  setYear(event: Event): void {
    this.budgetYear = Number((event.target as HTMLInputElement).value);
    this.form.patchValue({ dueDate: this.defaultDueDate() });
    this.reload$.next();
  }

  setMonth(event: Event): void {
    this.budgetMonth = Number((event.target as HTMLSelectElement).value);
    this.form.patchValue({ dueDate: this.defaultDueDate() });
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
          this.form.reset({ name: '', plannedAmount: 0, dueDate: this.defaultDueDate(), notes: '' });
          this.reload$.next();
        }
      });
  }

  saveIncome(): void {
    if (this.incomeForm.invalid) {
      return;
    }
    this.savingIncome = true;
    this.budgets
      .saveSummary({
        budgetYear: this.budgetYear,
        budgetMonth: this.budgetMonth,
        countryCode: this.countryCode,
        currencyCode: this.currencyCode,
        incomeAmount: this.incomeForm.getRawValue().incomeAmount,
        notes: null
      })
      .pipe(finalize(() => (this.savingIncome = false)))
      .subscribe(() => this.reload$.next());
  }

  startEdit(item: BudgetItem): void {
    this.editingItemId = item.id;
    this.editForm.reset({
      name: item.name,
      plannedAmount: item.plannedAmount,
      actualAmount: item.actualAmount,
      dueDate: item.dueDay ? this.dateFromDay(item.dueDay) : this.defaultDueDate(),
      paidDate: item.paidDate || '',
      notes: item.notes || ''
    });
  }

  saveEdit(item: BudgetItem): void {
    if (this.editForm.invalid || this.savingEdit) {
      return;
    }
    this.savingEdit = true;
    this.budgets
      .update(item.id, this.buildEditRequest())
      .pipe(finalize(() => (this.savingEdit = false)))
      .subscribe(() => {
        this.cancelEdit();
        this.reload$.next();
      });
  }

  cancelEdit(): void {
    this.editingItemId = null;
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

  availableAfterPaid(state: BudgetState): number {
    return state.summary.incomeAmount - this.totalActual(state.items);
  }

  projectedAfterPlanned(state: BudgetState): number {
    return state.summary.incomeAmount - this.totalPlanned(state.items);
  }

  dueLabel(item: BudgetItem): string {
    if (item.remainingAmount <= 0) {
      return this.i18n.t('budget.paid');
    }
    const days = this.daysUntilDue(item);
    if (days === null) {
      return '-';
    }
    if (days === 0) {
      return this.i18n.t('budget.dueToday');
    }
    if (days > 0) {
      return this.i18n.t('budget.daysLeft').replace('{days}', String(days));
    }
    return this.i18n.t('budget.daysOverdue').replace('{days}', String(Math.abs(days)));
  }

  dueStatus(item: BudgetItem): 'safe' | 'warning' | 'danger' | 'paid' | 'none' {
    if (item.remainingAmount <= 0) {
      return 'paid';
    }
    const days = this.daysUntilDue(item);
    if (days === null) {
      return 'none';
    }
    if (days > 10) {
      return 'safe';
    }
    if (days >= 5) {
      return 'warning';
    }
    return 'danger';
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
      dueDay: this.dayFromDate(value.dueDate),
      paid: false,
      paidDate: null,
      notes: value.notes || null
    };
  }

  private buildEditRequest(): BudgetItemRequest {
    const value = this.editForm.getRawValue();
    return {
      budgetYear: this.budgetYear,
      budgetMonth: this.budgetMonth,
      countryCode: this.countryCode,
      currencyCode: this.currencyCode,
      name: value.name,
      plannedAmount: value.plannedAmount,
      actualAmount: value.actualAmount,
      dueDay: this.dayFromDate(value.dueDate),
      paid: value.actualAmount >= value.plannedAmount,
      paidDate: value.actualAmount > 0 ? value.paidDate || this.today() : null,
      notes: value.notes || null
    };
  }

  private daysUntilDue(item: BudgetItem): number | null {
    if (!item.dueDay) {
      return null;
    }
    const dueDate = new Date(this.budgetYear, this.budgetMonth - 1, item.dueDay);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  }

  private dayFromDate(value: string): number | null {
    if (!value) {
      return null;
    }
    return Number(value.slice(8, 10));
  }

  private dateFromDay(day: number): string {
    return `${this.budgetYear}-${String(this.budgetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private defaultDueDate(): string {
    return this.dateFromDay(1);
  }

  private emptySummary(): BudgetSummary {
    return {
      id: null,
      budgetYear: this.budgetYear,
      budgetMonth: this.budgetMonth,
      countryCode: this.countryCode,
      currencyCode: this.currencyCode,
      incomeAmount: 0,
      notes: null
    };
  }

  private today(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
}
