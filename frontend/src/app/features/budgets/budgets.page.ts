import { AsyncPipe, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, forkJoin, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Account } from '../accounts/accounts.models';
import { AccountsService } from '../accounts/accounts.service';
import { Category } from '../categories/categories.models';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BudgetItem, BudgetItemRequest, BudgetItemType, BudgetSummary, CountryCode, CurrencyCode } from './budgets.models';
import { BudgetsService } from './budgets.service';

interface BudgetState {
  loading: boolean;
  items: BudgetItem[];
  summary: BudgetSummary;
  projection: BudgetProjectionMonth[];
  accounts: Account[];
  categories: Category[];
  error: string | null;
}

interface BudgetProjectionMonth {
  year: number;
  month: number;
  label: string;
  items: BudgetItem[];
  summary: BudgetSummary;
}

interface BudgetProjectionRow {
  key: string;
  name: string;
  itemType: BudgetItemType;
  months: BudgetProjectionCell[];
  totalPlanned: number;
  totalActual: number;
  totalRemaining: number;
}

interface BudgetProjectionCell {
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
}

@Component({
  selector: 'app-budgets-page',
  imports: [AsyncPipe, CurrencyPipe, NgFor, NgIf, ReactiveFormsModule],
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
          <strong [class.positive]="state.summary.incomeAmount > 0" [class.negative]="state.summary.incomeAmount < 0">
            {{ state.summary.incomeAmount | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.incomeHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.planned') }}</span>
          <strong [class.warning]="totalPlanned(state.items) > 0">
            {{ totalPlanned(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.plannedHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.paidAmount') }}</span>
          <strong [class.warning]="totalActual(state.items) > 0">
            {{ totalActual(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.paidAmountHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.pendingAmount') }}</span>
          <strong
            [class.warning]="totalRemaining(state.items) > 0"
            [class.positive]="totalRemaining(state.items) === 0 && totalPlanned(state.items) > 0"
            [class.negative]="totalRemaining(state.items) < 0"
          >
            {{ totalRemaining(state.items) | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.pendingAmountHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.available') }}</span>
          <strong [class.positive]="availableAfterPaid(state) >= 0" [class.negative]="availableAfterPaid(state) < 0">
            {{ availableAfterPaid(state) | currency: currencyCode : 'symbol' : '1.2-2' }}
          </strong>
          <small>{{ i18n.t('budget.availableHint') }}</small>
        </article>
        <article>
          <span>{{ i18n.t('budget.projected') }}</span>
          <strong [class.positive]="projectedAfterPlanned(state) >= 0" [class.negative]="projectedAfterPlanned(state) < 0">
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
          <label>
            {{ i18n.t('budget.income') }}
            <input type="number" min="0" step="0.01" formControlName="incomeAmount" />
          </label>
          <button type="submit" [disabled]="incomeForm.invalid || savingIncome">
            {{ savingIncome ? i18n.t('common.saving') : i18n.t('budget.saveIncome') }}
          </button>
        </form>
      </section>

      <section class="panel budget-projection-panel">
        <div class="panel-title">
          <div>
            <h3>{{ i18n.t('budget.projectionTitle') }}</h3>
            <span>{{ i18n.t('budget.projectionHint') }}</span>
          </div>
          <label class="projection-range">
            {{ i18n.t('budget.projectionRange') }}
            <select [value]="projectionMonths" (change)="setProjectionMonths($event)">
              <option *ngFor="let option of projectionOptions" [value]="option">{{ option }}</option>
            </select>
          </label>
        </div>

        <div class="projection-empty" *ngIf="!state.loading && projectionRows(state.projection).length === 0">
          <strong>{{ i18n.t('budget.projectionEmptyTitle') }}</strong>
          <p>{{ i18n.t('budget.projectionEmptyHint') }}</p>
        </div>

        <div class="projection-table-wrap" *ngIf="projectionRows(state.projection).length > 0">
          <table class="projection-table">
            <thead>
              <tr>
                <th>{{ i18n.t('budget.name') }}</th>
                <th *ngFor="let month of state.projection">{{ month.label }}</th>
                <th>{{ i18n.t('budget.projectionTotal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of projectionRows(state.projection)">
                <th>
                  <strong>{{ row.name }}</strong>
                  <small>{{ labelForItemType(row.itemType) }}</small>
                </th>
                <td *ngFor="let month of row.months">
                  <span>{{ month.plannedAmount | currency: currencyCode : 'symbol' : '1.2-2' }}</span>
                  <small>{{ i18n.t('budget.paidAmount') }}: {{ month.actualAmount | currency: currencyCode : 'symbol' : '1.2-2' }}</small>
                  <small [class.positive]="month.remainingAmount <= 0" [class.negative]="month.remainingAmount > 0">
                    {{ i18n.t('budget.remaining') }}: {{ month.remainingAmount | currency: currencyCode : 'symbol' : '1.2-2' }}
                  </small>
                </td>
                <td>
                  <span>{{ row.totalPlanned | currency: currencyCode : 'symbol' : '1.2-2' }}</span>
                  <small>{{ i18n.t('budget.paidAmount') }}: {{ row.totalActual | currency: currencyCode : 'symbol' : '1.2-2' }}</small>
                  <small [class.positive]="row.totalRemaining <= 0" [class.negative]="row.totalRemaining > 0">
                    {{ i18n.t('budget.remaining') }}: {{ row.totalRemaining | currency: currencyCode : 'symbol' : '1.2-2' }}
                  </small>
                </td>
              </tr>
              <tr class="projection-summary-row">
                <th>{{ i18n.t('budget.income') }}</th>
                <td *ngFor="let month of state.projection" [class.positive]="month.summary.incomeAmount > 0">
                  {{ month.summary.incomeAmount | currency: currencyCode : 'symbol' : '1.2-2' }}
                </td>
                <td [class.positive]="projectionIncomeTotal(state.projection) > 0">
                  {{ projectionIncomeTotal(state.projection) | currency: currencyCode : 'symbol' : '1.2-2' }}
                </td>
              </tr>
              <tr class="projection-summary-row">
                <th>{{ i18n.t('budget.planned') }}</th>
                <td *ngFor="let month of state.projection">
                  {{ totalPlanned(month.items) | currency: currencyCode : 'symbol' : '1.2-2' }}
                </td>
                <td>{{ projectionPlannedTotal(state.projection) | currency: currencyCode : 'symbol' : '1.2-2' }}</td>
              </tr>
              <tr class="projection-summary-row strong">
                <th>{{ i18n.t('budget.projected') }}</th>
                <td
                  *ngFor="let month of state.projection"
                  [class.positive]="projectionMonthFinal(month) >= 0"
                  [class.negative]="projectionMonthFinal(month) < 0"
                >
                  {{ projectionMonthFinal(month) | currency: currencyCode : 'symbol' : '1.2-2' }}
                </td>
                <td [class.positive]="projectionFinalTotal(state.projection) >= 0" [class.negative]="projectionFinalTotal(state.projection) < 0">
                  {{ projectionFinalTotal(state.projection) | currency: currencyCode : 'symbol' : '1.2-2' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

            <label>
              {{ i18n.t('budget.itemType') }}
              <select formControlName="itemType">
                <option value="EXPENSE">{{ i18n.t('budget.typeExpense') }}</option>
                <option value="DEBT_PAYMENT">{{ i18n.t('budget.typeDebtPayment') }}</option>
                <option value="SAVINGS">{{ i18n.t('budget.typeSavings') }}</option>
                <option value="TRANSFER">{{ i18n.t('budget.typeTransfer') }}</option>
              </select>
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
            <span>{{ state.loading ? i18n.t('common.loading') : sortedItems(state.items).length + ' ' + i18n.t('common.total') }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && sortedItems(state.items).length === 0">
            <strong>{{ i18n.t('budget.emptyTitle') }}</strong>
            <p>{{ i18n.t('budget.emptyHint') }}</p>
          </div>

          <div class="budget-table" *ngIf="sortedItems(state.items).length > 0">
            <div class="budget-row heading">
              <span>{{ i18n.t('budget.name') }}</span>
              <span>{{ i18n.t('budget.itemType') }}</span>
              <span>{{ i18n.t('budget.planned') }}</span>
              <span>{{ i18n.t('budget.paidAmount') }}</span>
              <span>{{ i18n.t('budget.remaining') }}</span>
              <span>{{ i18n.t('budget.dueDay') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>
            <div
              class="budget-row"
              *ngFor="let item of sortedItems(state.items)"
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
                <ng-container *ngIf="editingItemId !== item.id; else typeEdit">
                  {{ labelForItemType(item.itemType) }}
                </ng-container>
                <ng-template #typeEdit>
                  <select formControlName="itemType">
                    <option value="EXPENSE">{{ i18n.t('budget.typeExpense') }}</option>
                    <option value="DEBT_PAYMENT">{{ i18n.t('budget.typeDebtPayment') }}</option>
                    <option value="SAVINGS">{{ i18n.t('budget.typeSavings') }}</option>
                    <option value="TRANSFER">{{ i18n.t('budget.typeTransfer') }}</option>
                  </select>
                </ng-template>
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
                </ng-container>
                <ng-template #dateEdit>
                  <label class="budget-date-field">
                    <small>{{ i18n.t('budget.dueDate') }}</small>
                    <input type="date" formControlName="dueDate" />
                  </label>
                </ng-template>
              </span>
              <span class="table-actions">
                <button class="table-action" type="button" *ngIf="editingItemId !== item.id" (click)="startEdit(item)">
                  {{ i18n.t('budget.edit') }}
                </button>
                <button
                  class="table-action"
                  type="button"
                  *ngIf="editingItemId !== item.id && item.remainingAmount > 0"
                  (click)="startPayment(item, state.accounts, state.categories)"
                >
                  {{ i18n.t('budget.registerPayment') }}
                </button>
                <button class="table-action" type="button" *ngIf="editingItemId === item.id" (click)="saveEdit(item)">
                  {{ i18n.t('budget.save') }}
                </button>
                <button class="table-action muted" type="button" *ngIf="editingItemId === item.id" (click)="cancelEdit()">
                  {{ i18n.t('budget.cancel') }}
                </button>
                <button class="table-action danger" type="button" *ngIf="editingItemId !== item.id" (click)="deleteItem(item.id)">
                  {{ i18n.t('budget.delete') }}
                </button>
              </span>
              <span class="budget-notes-cell" *ngIf="editingItemId === item.id">
                <label>
                  {{ i18n.t('budget.notes') }}
                  <textarea rows="2" formControlName="notes"></textarea>
                </label>
              </span>
              <span class="budget-payment-cell" *ngIf="payingItemId === item.id" [formGroup]="paymentForm">
                <label>
                  {{ i18n.t('budget.paymentAccount') }}
                  <select formControlName="sourceAccountId">
                    <option value="">{{ i18n.t('transactions.selectAccount') }}</option>
                    <option *ngFor="let account of paymentAccounts(state.accounts)" [value]="account.id">
                      {{ account.name }} · {{ account.currencyCode }} · {{ account.currentBalance | currency: account.currencyCode : 'symbol' : '1.2-2' }}
                    </option>
                  </select>
                </label>
                <label>
                  {{ i18n.t('budget.paymentCategory') }}
                  <select formControlName="categoryId">
                    <option value="">{{ i18n.t('transactions.selectCategory') }}</option>
                    <option *ngFor="let category of paymentCategories(state.categories)" [value]="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                </label>
                <label>
                  {{ i18n.t('budget.paymentAmount') }}
                  <input type="number" min="0.01" step="0.01" formControlName="paidAmount" />
                </label>
                <label>
                  {{ i18n.t('budget.paidDate') }}
                  <input type="date" formControlName="paidDate" />
                </label>
                <div class="table-actions">
                  <button class="table-action" type="button" (click)="registerPayment(item)" [disabled]="paymentForm.invalid || registeringPayment">
                    {{ registeringPayment ? i18n.t('common.saving') : i18n.t('budget.savePayment') }}
                  </button>
                  <button class="table-action muted" type="button" (click)="cancelPayment()">
                    {{ i18n.t('budget.cancel') }}
                  </button>
                </div>
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
  private readonly accounts = inject(AccountsService);
  private readonly categories = inject(CategoriesService);
  private readonly transactions = inject(TransactionsService);
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
  readonly projectionOptions = [3, 4, 5, 6, 8, 12];

  budgetYear = new Date().getFullYear();
  budgetMonth = new Date().getMonth() + 1;
  countryCode: CountryCode = 'DE';
  currencyCode: CurrencyCode = 'EUR';
  projectionMonths = 6;
  showForm = false;
  saving = false;
  savingIncome = false;
  savingEdit = false;
  registeringPayment = false;
  editingItemId: string | null = null;
  payingItemId: string | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    itemType: ['EXPENSE' as BudgetItemType, Validators.required],
    plannedAmount: [0, [Validators.required, Validators.min(0)]],
    dueDate: [this.defaultDueDate(), Validators.required],
    notes: ['', Validators.maxLength(500)]
  });

  readonly incomeForm = this.formBuilder.nonNullable.group({
    incomeAmount: [0, [Validators.required, Validators.min(0)]]
  });

  readonly editForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    itemType: ['EXPENSE' as BudgetItemType, Validators.required],
    plannedAmount: [0, [Validators.required, Validators.min(0)]],
    actualAmount: [0, [Validators.required, Validators.min(0)]],
    dueDate: ['', Validators.required],
    notes: ['', Validators.maxLength(500)]
  });

  readonly paymentForm = this.formBuilder.nonNullable.group({
    sourceAccountId: ['', Validators.required],
    categoryId: ['', Validators.required],
    paidAmount: [0, [Validators.required, Validators.min(0.01)]],
    paidDate: [this.today(), Validators.required]
  });

  readonly state$: Observable<BudgetState> = this.reload$.pipe(
    switchMap(() =>
      forkJoin({
        items: this.budgets.list(this.budgetYear, this.budgetMonth, this.countryCode, this.currencyCode),
        summary: this.budgets.getSummary(this.budgetYear, this.budgetMonth, this.countryCode, this.currencyCode),
        projection: this.loadProjection(),
        accounts: this.accounts.list(),
        categories: this.categories.list()
      }).pipe(
        tap(({ summary }) => this.incomeForm.patchValue({ incomeAmount: summary.incomeAmount }, { emitEvent: false })),
        map(({ items, summary, projection, accounts, categories }) => ({
          loading: false,
          items,
          summary,
          projection,
          accounts: accounts.filter((account) => account.active),
          categories: categories.filter((category) => category.active),
          error: null
        })),
        startWith({ loading: true, items: [], summary: this.emptySummary(), projection: [], accounts: [], categories: [], error: null }),
        catchError(() =>
          of({
            loading: false,
            items: [],
            summary: this.emptySummary(),
            projection: [],
            accounts: [],
            categories: [],
            error: this.i18n.t('budget.loadError')
          })
        )
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  setYear(event: Event): void {
    this.budgetYear = Number((event.target as HTMLInputElement).value);
    this.resetTransientState();
    this.form.patchValue({ dueDate: this.defaultDueDate() });
    this.reload$.next();
  }

  setMonth(event: Event): void {
    this.budgetMonth = Number((event.target as HTMLSelectElement).value);
    this.resetTransientState();
    this.form.patchValue({ dueDate: this.defaultDueDate() });
    this.reload$.next();
  }

  setCountry(event: Event): void {
    this.countryCode = (event.target as HTMLSelectElement).value as CountryCode;
    this.currencyCode = this.countryCode === 'CO' ? 'COP' : 'EUR';
    this.resetTransientState();
    this.reload$.next();
  }

  setCurrency(event: Event): void {
    this.currencyCode = (event.target as HTMLSelectElement).value as CurrencyCode;
    this.resetTransientState();
    this.reload$.next();
  }

  setProjectionMonths(event: Event): void {
    this.projectionMonths = Number((event.target as HTMLSelectElement).value);
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
          this.form.reset({ name: '', itemType: 'EXPENSE', plannedAmount: 0, dueDate: this.defaultDueDate(), notes: '' });
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
    this.cancelPayment();
    this.editForm.reset({
      name: item.name,
      itemType: item.itemType,
      plannedAmount: item.plannedAmount,
      actualAmount: item.actualAmount,
      dueDate: item.dueDate || (item.dueDay ? this.dateFromDay(item.dueDay) : this.defaultDueDate()),
      notes: item.notes || ''
    });
  }

  startPayment(item: BudgetItem, accounts: Account[], categories: Category[]): void {
    this.payingItemId = item.id;
    this.cancelEdit();
    this.paymentForm.reset({
      sourceAccountId: this.paymentAccounts(accounts)[0]?.id ?? '',
      categoryId: this.paymentCategories(categories)[0]?.id ?? '',
      paidAmount: Math.max(item.remainingAmount, 0),
      paidDate: this.today()
    });
  }

  registerPayment(item: BudgetItem): void {
    if (this.paymentForm.invalid || this.registeringPayment) {
      return;
    }

    const value = this.paymentForm.getRawValue();
    if (value.paidAmount > item.remainingAmount) {
      this.paymentForm.patchValue({ paidAmount: item.remainingAmount });
      return;
    }

    this.registeringPayment = true;
    this.transactions
      .create({
        type: 'EXPENSE',
        sourceAccountId: value.sourceAccountId,
        targetAccountId: null,
        categoryId: value.categoryId,
        currencyCode: item.currencyCode,
        countryCode: item.countryCode,
        amount: value.paidAmount,
        transactionDate: value.paidDate,
        description: `${this.i18n.t('budget.transactionDescription')}: ${item.name}`
      })
      .pipe(
        switchMap((transaction) => this.transactions.post(transaction.id)),
        switchMap(() => this.budgets.markPaid(item.id, item.actualAmount + value.paidAmount, value.paidDate)),
        finalize(() => (this.registeringPayment = false))
      )
      .subscribe(() => {
        this.cancelPayment();
        this.reload$.next();
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

  deleteItem(itemId: string): void {
    if (!confirm(this.i18n.t('confirm.deleteBudgetItem'))) {
      return;
    }
    this.budgets.delete(itemId).subscribe(() => this.reload$.next());
  }

  cancelEdit(): void {
    this.editingItemId = null;
  }

  cancelPayment(): void {
    this.payingItemId = null;
  }

  resetTransientState(): void {
    this.cancelEdit();
    this.cancelPayment();
    this.showForm = false;
    this.registeringPayment = false;
    this.savingEdit = false;
  }

  paymentAccounts(accounts: Account[]): Account[] {
    return accounts.filter((account) =>
      account.active &&
      account.countryCode === this.countryCode &&
      account.currencyCode === this.currencyCode
    );
  }

  paymentCategories(categories: Category[]): Category[] {
    return categories.filter((category) => category.active && category.type === 'EXPENSE');
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

  projectionRows(months: BudgetProjectionMonth[]): BudgetProjectionRow[] {
    const rowMap = new Map<string, BudgetProjectionRow>();

    months.forEach((month, monthIndex) => {
      month.items.forEach((item) => {
        const key = `${item.itemType}:${item.name.trim().toLowerCase()}`;
        const existing = rowMap.get(key) ?? {
          key,
          name: item.name,
          itemType: item.itemType,
          months: months.map(() => ({ plannedAmount: 0, actualAmount: 0, remainingAmount: 0 })),
          totalPlanned: 0,
          totalActual: 0,
          totalRemaining: 0
        };

        existing.months[monthIndex].plannedAmount += item.plannedAmount;
        existing.months[monthIndex].actualAmount += item.actualAmount;
        existing.months[monthIndex].remainingAmount += item.remainingAmount;
        existing.totalPlanned += item.plannedAmount;
        existing.totalActual += item.actualAmount;
        existing.totalRemaining += item.remainingAmount;
        rowMap.set(key, existing);
      });
    });

    return Array.from(rowMap.values()).sort((first, second) => first.name.localeCompare(second.name));
  }

  projectionMonthFinal(month: BudgetProjectionMonth): number {
    return month.summary.incomeAmount - this.totalPlanned(month.items);
  }

  projectionIncomeTotal(months: BudgetProjectionMonth[]): number {
    return months.reduce((sum, month) => sum + month.summary.incomeAmount, 0);
  }

  projectionPlannedTotal(months: BudgetProjectionMonth[]): number {
    return months.reduce((sum, month) => sum + this.totalPlanned(month.items), 0);
  }

  projectionFinalTotal(months: BudgetProjectionMonth[]): number {
    return months.reduce((sum, month) => sum + this.projectionMonthFinal(month), 0);
  }

  sortedItems(items: BudgetItem[]): BudgetItem[] {
    return [...items].sort((first, second) => {
      const firstPaidRank = first.remainingAmount <= 0 ? 1 : 0;
      const secondPaidRank = second.remainingAmount <= 0 ? 1 : 0;
      if (firstPaidRank !== secondPaidRank) {
        return firstPaidRank - secondPaidRank;
      }

      const firstDays = this.daysUntilDue(first);
      const secondDays = this.daysUntilDue(second);
      const firstSort = firstDays === null ? Number.MAX_SAFE_INTEGER : firstDays;
      const secondSort = secondDays === null ? Number.MAX_SAFE_INTEGER : secondDays;
      if (firstSort !== secondSort) {
        return firstSort - secondSort;
      }

      return first.name.localeCompare(second.name);
    });
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

  labelForItemType(type: BudgetItemType): string {
    const labels: Record<BudgetItemType, string> = {
      EXPENSE: this.i18n.t('budget.typeExpense'),
      DEBT_PAYMENT: this.i18n.t('budget.typeDebtPayment'),
      SAVINGS: this.i18n.t('budget.typeSavings'),
      TRANSFER: this.i18n.t('budget.typeTransfer')
    };
    return labels[type];
  }

  private buildRequest(): BudgetItemRequest {
    const value = this.form.getRawValue();
    return {
      budgetYear: this.budgetYear,
      budgetMonth: this.budgetMonth,
      countryCode: this.countryCode,
      currencyCode: this.currencyCode,
      name: value.name,
      itemType: value.itemType,
      plannedAmount: value.plannedAmount,
      actualAmount: 0,
      dueDay: this.dayFromDate(value.dueDate),
      dueDate: value.dueDate,
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
      itemType: value.itemType,
      plannedAmount: value.plannedAmount,
      actualAmount: value.actualAmount,
      dueDay: this.dayFromDate(value.dueDate),
      dueDate: value.dueDate,
      paid: value.actualAmount >= value.plannedAmount,
      paidDate: value.actualAmount > 0 ? this.today() : null,
      notes: value.notes || null
    };
  }

  private daysUntilDue(item: BudgetItem): number | null {
    const dueDate = this.resolveDueDate(item);
    if (!dueDate) {
      return null;
    }
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

  private resolveDueDate(item: BudgetItem): Date | null {
    if (this.editingItemId === item.id) {
      const editingDueDate = this.editForm.controls.dueDate.value;
      if (editingDueDate) {
        return this.dateFromIso(editingDueDate);
      }
    }
    if (item.dueDate) {
      return this.dateFromIso(item.dueDate);
    }
    if (!item.dueDay) {
      return null;
    }
    return new Date(this.budgetYear, this.budgetMonth - 1, item.dueDay);
  }

  private dateFromIso(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
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

  private loadProjection(): Observable<BudgetProjectionMonth[]> {
    const periods = this.projectionPeriods();
    return forkJoin(
      periods.map((period) =>
        forkJoin({
          items: this.budgets.list(period.year, period.month, this.countryCode, this.currencyCode),
          summary: this.budgets.getSummary(period.year, period.month, this.countryCode, this.currencyCode)
        }).pipe(
          map(({ items, summary }) => ({
            ...period,
            items,
            summary
          }))
        )
      )
    );
  }

  private projectionPeriods(): Array<{ year: number; month: number; label: string }> {
    return Array.from({ length: this.projectionMonths }, (_, index) => {
      const date = new Date(this.budgetYear, this.budgetMonth - 1 + index, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
      };
    });
  }

  private today(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
}
