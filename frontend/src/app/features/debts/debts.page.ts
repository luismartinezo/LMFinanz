import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Debt, DebtInstallment, DebtRequest, DebtStatus, DebtType, InstallmentStatus } from './debts.models';
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
                {{ i18n.t('debts.type') }}
                <select formControlName="debtType">
                  <option value="CREDIT_CARD">{{ i18n.t('debts.typeCreditCard') }}</option>
                  <option value="MORTGAGE">{{ i18n.t('debts.typeMortgage') }}</option>
                  <option value="PERSONAL_LOAN">{{ i18n.t('debts.typePersonalLoan') }}</option>
                  <option value="VEHICLE_LOAN">{{ i18n.t('debts.typeVehicleLoan') }}</option>
                  <option value="INSTALLMENT_PURCHASE">{{ i18n.t('debts.typeInstallmentPurchase') }}</option>
                  <option value="FAMILY_LOAN">{{ i18n.t('debts.typeFamilyLoan') }}</option>
                  <option value="OTHER">{{ i18n.t('debts.typeOther') }}</option>
                </select>
              </label>

              <label>
                {{ i18n.t('accounts.country') }}
                <select formControlName="countryCode" (change)="syncCurrencyWithCountry()">
                  <option value="DE">{{ i18n.t('accounts.countryGermany') }}</option>
                  <option value="CO">{{ i18n.t('accounts.countryColombia') }}</option>
                </select>
              </label>
            </div>

            <div class="form-row">
              <label>
                {{ i18n.t('accounts.currency') }}
                <select formControlName="currencyCode" (change)="syncCountryWithCurrency()">
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
              <span>{{ i18n.t('debts.type') }}</span>
              <span>{{ i18n.t('debts.remainingBalance') }}</span>
              <span>{{ i18n.t('debts.interestRate') }}</span>
              <span>{{ i18n.t('debts.finalDueDate') }}</span>
              <span>{{ i18n.t('transactions.status') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>

            <ng-container *ngFor="let debt of state.debts">
              <div class="data-row debt-row">
                <span>
                  <strong>{{ debt.name }}</strong>
                  <small>{{ debt.installments }} {{ i18n.t('debts.installments').toLowerCase() }}</small>
                </span>
                <span>
                  {{ labelForType(debt.debtType) }}
                  <small>{{ debt.countryCode }}</small>
                </span>
                <span>{{ debt.remainingBalance | currency: debt.currencyCode : 'symbol' : '1.2-2' }}</span>
                <span>{{ debt.annualInterestRate | number: '1.2-2' }}%</span>
                <span>{{ debt.finalDueDate | date: 'dd MMM y' }}</span>
                <span>{{ labelForStatus(debt.status) }}</span>
                <span>
                  <button class="table-action" type="button" (click)="toggleInstallments(debt.id)">
                    {{ selectedDebtId === debt.id ? i18n.t('debts.hideInstallments') : i18n.t('debts.viewInstallments') }}
                  </button>
                </span>
              </div>

              <div class="installment-list" *ngIf="selectedDebtId === debt.id">
                <div class="data-row installment-row heading">
                  <span>#</span>
                  <span>{{ i18n.t('transactions.amount') }}</span>
                  <span>{{ i18n.t('debts.finalDueDate') }}</span>
                  <span>{{ i18n.t('transactions.status') }}</span>
                  <span>{{ i18n.t('transactions.actions') }}</span>
                </div>
                <div class="data-row installment-row" *ngFor="let installment of selectedInstallments">
                  <span>{{ installment.installmentNumber }}</span>
                  <span>{{ installment.amount | currency: debt.currencyCode : 'symbol' : '1.2-2' }}</span>
                  <span>{{ installment.dueDate | date: 'dd MMM y' }}</span>
                  <span>{{ labelForInstallmentStatus(installment.status) }}</span>
                  <span>
                    <button
                      class="table-action"
                      type="button"
                      *ngIf="installment.status !== 'PAID'"
                      (click)="payInstallment(debt.id, installment.id)"
                    >
                      {{ i18n.t('debts.markPaid') }}
                    </button>
                  </span>
                </div>
              </div>
            </ng-container>
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
  selectedDebtId: string | null = null;
  selectedInstallments: DebtInstallment[] = [];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    debtType: ['INSTALLMENT_PURCHASE' as DebtType, Validators.required],
    currencyCode: ['EUR', Validators.required],
    countryCode: ['DE', Validators.required],
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
            debtType: 'INSTALLMENT_PURCHASE',
            currencyCode: 'EUR',
            countryCode: 'DE',
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

  syncCurrencyWithCountry(): void {
    const currencyByCountry: Record<string, string> = {
      DE: 'EUR',
      CO: 'COP'
    };
    this.form.patchValue({ currencyCode: currencyByCountry[this.form.controls.countryCode.value] });
  }

  syncCountryWithCurrency(): void {
    const currency = this.form.controls.currencyCode.value;
    if (currency === 'EUR') {
      this.form.patchValue({ countryCode: 'DE' });
    }
    if (currency === 'COP') {
      this.form.patchValue({ countryCode: 'CO' });
    }
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

  labelForType(type: DebtType): string {
    const labels: Record<DebtType, string> = {
      CREDIT_CARD: this.i18n.t('debts.typeCreditCard'),
      MORTGAGE: this.i18n.t('debts.typeMortgage'),
      PERSONAL_LOAN: this.i18n.t('debts.typePersonalLoan'),
      VEHICLE_LOAN: this.i18n.t('debts.typeVehicleLoan'),
      INSTALLMENT_PURCHASE: this.i18n.t('debts.typeInstallmentPurchase'),
      FAMILY_LOAN: this.i18n.t('debts.typeFamilyLoan'),
      OTHER: this.i18n.t('debts.typeOther')
    };
    return labels[type];
  }

  toggleInstallments(debtId: string): void {
    if (this.selectedDebtId === debtId) {
      this.selectedDebtId = null;
      this.selectedInstallments = [];
      return;
    }

    this.selectedDebtId = debtId;
    this.debts.installments(debtId).subscribe((installments) => {
      this.selectedInstallments = installments;
    });
  }

  payInstallment(debtId: string, installmentId: string): void {
    if (!confirm(this.i18n.t('confirm.payInstallment'))) {
      return;
    }
    this.debts
      .payInstallment(debtId, installmentId, {
        paidDate: this.today(),
        paymentTransactionId: null
      })
      .subscribe(() => {
        this.debts.installments(debtId).subscribe((installments) => {
          this.selectedInstallments = installments;
          this.reload$.next();
        });
      });
  }

  labelForInstallmentStatus(status: InstallmentStatus): string {
    const labels: Record<InstallmentStatus, string> = {
      PENDING: this.i18n.t('debts.statusPending'),
      PAID: this.i18n.t('debts.statusPaid'),
      OVERDUE: this.i18n.t('debts.statusOverdue')
    };
    return labels[status];
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
