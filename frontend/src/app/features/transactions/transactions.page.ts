import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Account } from '../accounts/accounts.models';
import { AccountsService } from '../accounts/accounts.service';
import { Category } from '../categories/categories.models';
import { CategoriesService } from '../categories/categories.service';
import { Transaction, TransactionRequest, TransactionStatus, TransactionType } from './transactions.models';
import { TransactionsService } from './transactions.service';

@Component({
  selector: 'app-transactions-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('transactions.eyebrow') }}</p>
          <h2>{{ i18n.t('transactions.title') }}</h2>
          <p>{{ i18n.t('transactions.subtitle') }}</p>
        </div>
        <button type="button" (click)="toggleForm()">
          {{ showForm ? i18n.t('accounts.closeForm') : i18n.t('transactions.newMovement') }}
        </button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="panel report-filters">
        <form [formGroup]="filterForm" (ngSubmit)="reloadTransactions()">
          <label>
            {{ i18n.t('reports.from') }}
            <input type="date" formControlName="from" />
          </label>

          <label>
            {{ i18n.t('reports.to') }}
            <input type="date" formControlName="to" />
          </label>

          <label>
            {{ i18n.t('transactions.type') }}
            <select formControlName="type">
              <option value="ALL">{{ i18n.t('common.all') }}</option>
              <option value="INCOME">{{ i18n.t('transactions.typeIncome') }}</option>
              <option value="EXPENSE">{{ i18n.t('transactions.typeExpense') }}</option>
              <option value="TRANSFER">{{ i18n.t('transactions.typeTransfer') }}</option>
            </select>
          </label>

          <label>
            {{ i18n.t('transactions.status') }}
            <select formControlName="status">
              <option value="ALL">{{ i18n.t('common.all') }}</option>
              <option value="DRAFT">{{ i18n.t('transactions.statusDraft') }}</option>
              <option value="POSTED">{{ i18n.t('transactions.statusPosted') }}</option>
              <option value="CANCELLED">{{ i18n.t('transactions.statusCancelled') }}</option>
            </select>
          </label>

          <label>
            {{ i18n.t('transactions.category') }}
            <select formControlName="categoryId">
              <option value="ALL">{{ i18n.t('common.all') }}</option>
              <option *ngFor="let category of state.categories" [value]="category.id">{{ category.name }}</option>
            </select>
          </label>

          <button type="submit">{{ i18n.t('reports.apply') }}</button>
        </form>
      </section>

      <section class="content-grid transaction-form-grid" *ngIf="showForm">
        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('transactions.newMovement') }}</h3>
            <span>{{ i18n.t('common.requiredFields') }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createTransaction(state.accounts)">
            <label>
              {{ i18n.t('transactions.type') }}
              <select formControlName="type" (change)="syncAccountReference(state.accounts)">
                <option value="INCOME">{{ i18n.t('transactions.typeIncome') }}</option>
                <option value="EXPENSE">{{ i18n.t('transactions.typeExpense') }}</option>
                <option value="TRANSFER">{{ i18n.t('transactions.typeTransfer') }}</option>
              </select>
            </label>

            <label *ngIf="form.controls.type.value !== 'INCOME'">
              {{ i18n.t('transactions.sourceAccount') }}
              <select formControlName="sourceAccountId" (change)="syncAccountReference(state.accounts)">
                <option value="">{{ i18n.t('transactions.selectAccount') }}</option>
                <option *ngFor="let account of state.accounts" [value]="account.id">
                  {{ account.name }} · {{ account.currencyCode }} · {{ account.countryCode }}
                </option>
              </select>
            </label>

            <label *ngIf="form.controls.type.value !== 'EXPENSE'">
              {{ i18n.t('transactions.targetAccount') }}
              <select formControlName="targetAccountId" (change)="syncAccountReference(state.accounts)">
                <option value="">{{ i18n.t('transactions.selectAccount') }}</option>
                <option *ngFor="let account of state.accounts" [value]="account.id">
                  {{ account.name }} · {{ account.currencyCode }} · {{ account.countryCode }}
                </option>
              </select>
            </label>

            <label *ngIf="form.controls.type.value !== 'TRANSFER'">
              {{ i18n.t('transactions.category') }}
              <select formControlName="categoryId">
                <option value="">{{ i18n.t('transactions.selectCategory') }}</option>
                <option *ngFor="let category of categoriesForType(state.categories)" [value]="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <div class="form-row">
              <label>
                {{ i18n.t('accounts.currency') }}
                <input formControlName="currencyCode" readonly />
              </label>

              <label>
                {{ i18n.t('accounts.country') }}
                <input formControlName="countryCode" readonly />
              </label>
            </div>

            <div class="form-row">
              <label>
                {{ i18n.t('transactions.amount') }}
                <input type="number" min="0.01" step="0.01" formControlName="amount" />
              </label>

              <label>
                {{ i18n.t('transactions.date') }}
                <input type="date" formControlName="transactionDate" />
              </label>
            </div>

            <label>
              {{ i18n.t('transactions.description') }}
              <input formControlName="description" />
            </label>

            <button type="submit" [disabled]="form.invalid || saving || state.accounts.length === 0">
              {{ saving ? i18n.t('common.saving') : i18n.t('transactions.createDraft') }}
            </button>
          </form>
        </article>

      </section>

      <article class="panel transaction-ledger-panel">
        <div class="panel-title">
          <h3>{{ i18n.t('transactions.ledger') }}</h3>
          <span>{{ state.loading ? i18n.t('common.loading') : filteredTransactions(state.transactions).length + ' ' + i18n.t('common.total') }}</span>
        </div>

        <div class="empty-state" *ngIf="!state.loading && filteredTransactions(state.transactions).length === 0">
          <strong>{{ i18n.t('transactions.emptyTitle') }}</strong>
          <p>{{ i18n.t('transactions.emptyHint') }}</p>
        </div>

        <div class="data-table" *ngIf="filteredTransactions(state.transactions).length > 0">
          <div class="data-row transaction-row heading">
            <span>{{ i18n.t('transactions.date') }}</span>
            <span>{{ i18n.t('transactions.type') }}</span>
            <span>{{ i18n.t('transactions.account') }}</span>
            <span>{{ i18n.t('transactions.amount') }}</span>
            <span>{{ i18n.t('transactions.status') }}</span>
            <span>{{ i18n.t('transactions.actions') }}</span>
          </div>

          <div class="data-row transaction-row" *ngFor="let transaction of filteredTransactions(state.transactions)">
            <span>{{ transaction.transactionDate | date: 'dd MMM y' }}</span>
            <span>{{ labelForType(transaction.type) }}</span>
            <span>{{ accountLabel(transaction, state.accounts) }}</span>
            <span>{{ signedAmount(transaction) | currency: transaction.currencyCode : 'symbol' : '1.2-2' }}</span>
            <span>{{ labelForStatus(transaction.status) }}</span>
            <span>
              <button
                class="table-action"
                type="button"
                *ngIf="transaction.status === 'DRAFT'"
                (click)="postTransaction(transaction.id)"
              >
                {{ i18n.t('transactions.post') }}
              </button>
              <button
                class="table-action"
                type="button"
                *ngIf="transaction.status !== 'CANCELLED'"
                (click)="cancelTransaction(transaction.id)"
              >
                {{ i18n.t('transactions.cancel') }}
              </button>
            </span>
          </div>
        </div>
      </article>
    </main>
  `
})
export class TransactionsPage {
  private readonly accounts = inject(AccountsService);
  private readonly categories = inject(CategoriesService);
  private readonly transactions = inject(TransactionsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);

  showForm = false;
  saving = false;

  readonly form = this.formBuilder.nonNullable.group({
    type: ['EXPENSE' as TransactionType, Validators.required],
    sourceAccountId: [''],
    targetAccountId: [''],
    categoryId: [''],
    currencyCode: ['EUR', Validators.required],
    countryCode: ['DE', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    transactionDate: [this.today(), Validators.required],
    description: ['']
  });

  readonly filterForm = this.formBuilder.nonNullable.group({
    from: [this.currentMonthRange().from, Validators.required],
    to: [this.currentMonthRange().to, Validators.required],
    type: ['ALL' as TransactionType | 'ALL'],
    status: ['ALL' as TransactionStatus | 'ALL'],
    categoryId: ['ALL']
  });

  readonly state$: Observable<{
    loading: boolean;
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    error: string | null;
  }> = this.reload$.pipe(
    switchMap(() =>
      forkJoin({
        transactions: this.transactions.list(this.filterForm.controls.from.value, this.filterForm.controls.to.value),
        accounts: this.accounts.list(),
        categories: this.categories.list()
      }).pipe(
        tap(({ accounts }) => this.syncAccountReference(accounts)),
        map(({ transactions, accounts, categories }) => ({
          loading: false,
          transactions,
          accounts: accounts.filter((account) => account.active),
          categories: categories.filter((category) => category.active),
          error: null
        })),
        startWith({ loading: true, transactions: [], accounts: [], categories: [], error: null }),
        catchError(() =>
          of({
            loading: false,
            transactions: [],
            accounts: [],
            categories: [],
            error: this.i18n.t('transactions.loadError')
          })
        )
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  createTransaction(accounts: Account[]): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    const request = this.toRequest();
    this.saving = true;
    this.transactions
      .create(request)
      .pipe(
        tap(() => {
          this.form.patchValue({
            amount: 0,
            description: '',
            transactionDate: this.today()
          });
          this.showForm = false;
          this.reload$.next();
          this.syncAccountReference(accounts);
        }),
        catchError(() => of(null))
      )
      .subscribe(() => {
        this.saving = false;
      });
  }

  postTransaction(transactionId: string): void {
    this.transactions.post(transactionId).subscribe(() => this.reload$.next());
  }

  cancelTransaction(transactionId: string): void {
    if (!confirm(this.i18n.t('confirm.cancelTransaction'))) {
      return;
    }
    this.transactions.cancel(transactionId).subscribe(() => this.reload$.next());
  }

  reloadTransactions(): void {
    if (this.filterForm.invalid) {
      return;
    }
    this.reload$.next();
  }

  filteredTransactions(transactions: Transaction[]): Transaction[] {
    const filters = this.filterForm.getRawValue();
    return transactions.filter((transaction) => {
      const typeMatches = filters.type === 'ALL' || transaction.type === filters.type;
      const statusMatches = filters.status === 'ALL' || transaction.status === filters.status;
      const categoryMatches = filters.categoryId === 'ALL' || transaction.categoryId === filters.categoryId;
      return typeMatches && statusMatches && categoryMatches;
    });
  }

  syncAccountReference(accounts: Account[]): void {
    const selectedAccountId = this.form.controls.type.value === 'INCOME'
      ? this.form.controls.targetAccountId.value
      : this.form.controls.sourceAccountId.value;
    const account = accounts.find((item) => item.id === selectedAccountId) ?? accounts[0];
    if (!account) {
      return;
    }

    const patch: Partial<typeof this.form.value> = {
      currencyCode: account.currencyCode,
      countryCode: account.countryCode
    };

    if (!this.form.controls.sourceAccountId.value && this.form.controls.type.value !== 'INCOME') {
      patch.sourceAccountId = account.id;
    }
    if (!this.form.controls.targetAccountId.value && this.form.controls.type.value !== 'EXPENSE') {
      patch.targetAccountId = account.id;
    }

    this.form.patchValue(patch);
  }

  categoriesForType(categories: Category[]): Category[] {
    const type = this.form.controls.type.value;
    if (type === 'TRANSFER') {
      return [];
    }
    return categories.filter((category) => category.type === type);
  }

  accountLabel(transaction: Transaction, accounts: Account[]): string {
    const source = accounts.find((account) => account.id === transaction.sourceAccountId)?.name;
    const target = accounts.find((account) => account.id === transaction.targetAccountId)?.name;
    if (transaction.type === 'TRANSFER') {
      return `${source ?? '-'} -> ${target ?? '-'}`;
    }
    return target ?? source ?? '-';
  }

  signedAmount(transaction: Transaction): number {
    if (transaction.type === 'EXPENSE') {
      return -Math.abs(transaction.amount);
    }
    return transaction.amount;
  }

  labelForType(type: TransactionType): string {
    const labels: Record<TransactionType, string> = {
      INCOME: this.i18n.t('transactions.typeIncome'),
      EXPENSE: this.i18n.t('transactions.typeExpense'),
      TRANSFER: this.i18n.t('transactions.typeTransfer')
    };
    return labels[type];
  }

  labelForStatus(status: TransactionStatus): string {
    const labels: Record<TransactionStatus, string> = {
      DRAFT: this.i18n.t('transactions.statusDraft'),
      POSTED: this.i18n.t('transactions.statusPosted'),
      CANCELLED: this.i18n.t('transactions.statusCancelled')
    };
    return labels[status];
  }

  private toRequest(): TransactionRequest {
    const value = this.form.getRawValue();
    return {
      type: value.type,
      sourceAccountId: value.type === 'INCOME' ? null : value.sourceAccountId || null,
      targetAccountId: value.type === 'EXPENSE' ? null : value.targetAccountId || null,
      categoryId: value.type === 'TRANSFER' ? null : value.categoryId || null,
      currencyCode: value.currencyCode,
      countryCode: value.countryCode,
      amount: value.amount,
      transactionDate: value.transactionDate,
      description: value.description || null
    };
  }

  private currentMonthRange(): { from: string; to: string } {
    const today = new Date();
    return {
      from: this.toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: this.toDateInput(today)
    };
  }

  private today(): string {
    return this.toDateInput(new Date());
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
