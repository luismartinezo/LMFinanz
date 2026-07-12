import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Debt, DebtRequest, DebtStatus } from './debts.models';
import { DebtsService } from './debts.service';

@Component({
  selector: 'app-debts-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('debts.eyebrow') }}</p>
          <h2>{{ i18n.t('debts.title') }}</h2>
          <p>{{ i18n.t('debts.subtitle') }}</p>
        </div>
        <button type="button" (click)="toggleForm()">
          {{ showForm ? i18n.t('accounts.closeForm') : i18n.t('debts.newDebt') }}
        </button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('debts.totalDebt') }}</span>
          <strong>
            {{ totalRemaining(state.debts, primaryCurrency(state.debts)) | currency: primaryCurrency(state.debts) : 'symbol' : '1.2-2' }}
          </strong>
          <p>{{ i18n.t('debts.totalDebtHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('debts.nextDueDate') }}</span>
          <strong>{{ nextDueDate(state.debts) ? (nextDueDate(state.debts) | date: 'dd MMM y') : '-' }}</strong>
          <p>{{ i18n.t('debts.nextDueDateHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('debts.installments') }}</span>
          <strong>{{ totalInstallments(state.debts) | number }}</strong>
          <p>{{ i18n.t('debts.installmentsHint') }}</p>
        </article>
      </section>

      <section class="content-grid accounts-layout">
        <article class="panel" *ngIf="showForm">
          <div class="panel-title">
            <h3>{{ i18n.t('debts.newDebt') }}</h3>
            <span>{{ i18n.t('common.requiredFields') }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createDebt()">
            <label>
              {{ i18n.t('debts.name') }}
              <input formControlName="name" />
            </label>

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
                {{ i18n.t('debts.interestRate') }}
                <input type="number" min="0" step="0.01" formControlName="annualInterestRate" />
              </label>
            </div>

            <div class="form-row">
              <label>
                {{ i18n.t('debts.principalAmount') }}
                <input type="number" min="0.01" step="0.01" formControlName="principalAmount" />
              </label>

              <label>
                {{ i18n.t('debts.installments') }}
                <input type="number" min="1" step="1" formControlName="installments" />
              </label>
            </div>

            <div class="form-row">
              <label>
                {{ i18n.t('debts.startDate') }}
                <input type="date" formControlName="startDate" />
              </label>

              <label>
                {{ i18n.t('debts.finalDueDate') }}
                <input type="date" formControlName="finalDueDate" />
              </label>
            </div>

            <button type="submit" [disabled]="form.invalid || saving">
              {{ saving ? i18n.t('common.saving') : i18n.t('debts.create') }}
            </button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('debts.listTitle') }}</h3>
            <span>{{ state.loading ? i18n.t('common.loading') : state.debts.length + ' ' + i18n.t('common.total') }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && state.debts.length === 0">
            <strong>{{ i18n.t('debts.emptyTitle') }}</strong>
            <p>{{ i18n.t('debts.emptyHint') }}</p>
          </div>

          <div class="data-table" *ngIf="state.debts.length > 0">
            <div class="data-row debt-row heading">
              <span>{{ i18n.t('debts.name') }}</span>
              <span>{{ i18n.t('debts.remainingBalance') }}</span>
              <span>{{ i18n.t('debts.interestRate') }}</span>
              <span>{{ i18n.t('debts.finalDueDate') }}</span>
              <span>{{ i18n.t('transactions.status') }}</span>
            </div>

            <div class="data-row debt-row" *ngFor="let debt of state.debts">
              <span>
                <strong>{{ debt.name }}</strong>
                <small>{{ debt.installments }} {{ i18n.t('debts.installments').toLowerCase() }}</small>
              </span>
              <span>{{ debt.remainingBalance | currency: debt.currencyCode : 'symbol' : '1.2-2' }}</span>
              <span>{{ debt.annualInterestRate | number: '1.2-2' }}%</span>
              <span>{{ debt.finalDueDate | date: 'dd MMM y' }}</span>
              <span>{{ labelForStatus(debt.status) }}</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  `
})
export class DebtsPage {
  private readonly debts = inject(DebtsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);

  showForm = false;
  saving = false;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    currencyCode: ['EUR', Validators.required],
    principalAmount: [0, [Validators.required, Validators.min(0.01)]],
    annualInterestRate: [0, [Validators.required, Validators.min(0)]],
    installments: [1, [Validators.required, Validators.min(1)]],
    startDate: [this.today(), Validators.required],
    finalDueDate: [this.today(), Validators.required]
  });

  readonly state$: Observable<{ loading: boolean; debts: Debt[]; error: string | null }> = this.reload$.pipe(
    switchMap(() =>
      this.debts.list().pipe(
        map((debts) => ({ loading: false, debts, error: null })),
        startWith({ loading: true, debts: [], error: null }),
        catchError(() =>
          of({
            loading: false,
            debts: [],
            error: this.i18n.t('debts.loadError')
          })
        )
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  createDebt(): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.debts
      .create(this.form.getRawValue() as DebtRequest)
      .pipe(
        tap(() => {
          this.form.reset({
            name: '',
            currencyCode: 'EUR',
            principalAmount: 0,
            annualInterestRate: 0,
            installments: 1,
            startDate: this.today(),
            finalDueDate: this.today()
          });
          this.showForm = false;
          this.reload$.next();
        }),
        catchError(() => of(null))
      )
      .subscribe(() => {
        this.saving = false;
      });
  }

  primaryCurrency(debts: Debt[]): string {
    return debts.find((debt) => debt.status === 'ACTIVE')?.currencyCode ?? debts[0]?.currencyCode ?? 'EUR';
  }

  totalRemaining(debts: Debt[], currencyCode: string): number {
    return debts
      .filter((debt) => debt.currencyCode === currencyCode)
      .reduce((total, debt) => total + Number(debt.remainingBalance || 0), 0);
  }

  totalInstallments(debts: Debt[]): number {
    return debts.reduce((total, debt) => total + Number(debt.installments || 0), 0);
  }

  nextDueDate(debts: Debt[]): string | null {
    return debts
      .filter((debt) => debt.status === 'ACTIVE')
      .map((debt) => debt.finalDueDate)
      .sort()[0] ?? null;
  }

  labelForStatus(status: DebtStatus): string {
    const labels: Record<DebtStatus, string> = {
      ACTIVE: this.i18n.t('common.active'),
      PAID: this.i18n.t('debts.statusPaid'),
      DEFAULTED: this.i18n.t('debts.statusDefaulted'),
      CANCELLED: this.i18n.t('debts.statusCancelled')
    };
    return labels[status];
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
