import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Debt, DebtInstallment, DebtInstallmentRequest, DebtRequest, DebtStatus, DebtType, InstallmentStatus } from './debts.models';
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
          <strong>{{ activeDebts(state.debts).length }}</strong>
          <small *ngFor="let currency of debtCurrencies(state.debts)">
            {{ currency }}:
            {{ totalRemaining(state.debts, currency) | currency: currency : 'symbol' : '1.2-2' }}
          </small>
          <p>{{ i18n.t('debts.totalDebtHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('debts.nextDueDate') }}</span>
          <strong>{{ nextDueDate(state.debts) ? (nextDueDate(state.debts) | date: 'dd MMM y') : '-' }}</strong>
          <p>{{ i18n.t('debts.nextDueDateHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('debts.installments') }}</span>
          <strong>{{ pendingInstallments(state.debts) | number }}</strong>
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
                {{ i18n.t('debts.installmentAmount') }}
                <input type="number" min="0.01" step="0.01" formControlName="installmentAmount" />
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

            <label>
              {{ i18n.t('debts.interestRate') }}
              <input type="number" min="0" step="0.01" formControlName="annualInterestRate" />
            </label>

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
              <span>{{ i18n.t('debts.principalAmount') }}</span>
              <span>{{ i18n.t('debts.remainingBalance') }}</span>
              <span>{{ i18n.t('debts.installmentAmount') }}</span>
              <span>{{ i18n.t('debts.finalDueDate') }}</span>
              <span>{{ i18n.t('transactions.status') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>

            <ng-container *ngFor="let debt of sortedDebts(state.debts)">
              <div
                class="data-row debt-row"
                [class.paid]="debt.status === 'PAID'"
                [class.due-safe]="debtDueStatus(debt) === 'safe'"
                [class.due-warning]="debtDueStatus(debt) === 'warning'"
                [class.due-danger]="debtDueStatus(debt) === 'danger'"
                [formGroup]="editForm"
              >
                <span>
                  <strong *ngIf="editingDebtId !== debt.id">{{ debt.name }}</strong>
                  <input *ngIf="editingDebtId === debt.id" formControlName="name" />
                  <small>{{ debt.installments }} {{ i18n.t('debts.installments').toLowerCase() }}</small>
                  <small>{{ i18n.t('debts.monthlyPayment') }}: {{ debt.installmentAmount | currency: debt.currencyCode : 'symbol' : '1.2-2' }}</small>
                </span>
                <span>
                  <ng-container *ngIf="editingDebtId !== debt.id; else debtTypeEdit">
                    {{ labelForType(debt.debtType) }}
                  </ng-container>
                  <ng-template #debtTypeEdit>
                    <select formControlName="debtType">
                      <option value="CREDIT_CARD">{{ i18n.t('debts.typeCreditCard') }}</option>
                      <option value="MORTGAGE">{{ i18n.t('debts.typeMortgage') }}</option>
                      <option value="PERSONAL_LOAN">{{ i18n.t('debts.typePersonalLoan') }}</option>
                      <option value="VEHICLE_LOAN">{{ i18n.t('debts.typeVehicleLoan') }}</option>
                      <option value="INSTALLMENT_PURCHASE">{{ i18n.t('debts.typeInstallmentPurchase') }}</option>
                      <option value="FAMILY_LOAN">{{ i18n.t('debts.typeFamilyLoan') }}</option>
                      <option value="OTHER">{{ i18n.t('debts.typeOther') }}</option>
                    </select>
                  </ng-template>
                  <small>{{ countryLabel(debt.countryCode) }} · {{ debt.currencyCode }}</small>
                </span>
                <span>
                  <strong *ngIf="editingDebtId !== debt.id">
                    {{ debt.principalAmount | currency: debt.currencyCode : 'symbol' : '1.2-2' }}
                  </strong>
                  <input *ngIf="editingDebtId === debt.id" type="number" min="0.01" step="0.01" formControlName="principalAmount" />
                </span>
                <span>
                  <strong *ngIf="editingDebtId !== debt.id" [class.negative]="debt.remainingBalance < 0">
                    {{ debt.remainingBalance | currency: debt.currencyCode : 'symbol' : '1.2-2' }}
                  </strong>
                  <small *ngIf="editingDebtId === debt.id">{{ debt.remainingBalance | currency: debt.currencyCode : 'symbol' : '1.2-2' }}</small>
                </span>
                <span>
                  <ng-container *ngIf="editingDebtId !== debt.id; else installmentAmountEdit">
                    {{ debt.installmentAmount | currency: debt.currencyCode : 'symbol' : '1.2-2' }}
                  </ng-container>
                  <ng-template #installmentAmountEdit>
                    <input type="number" min="0.01" step="0.01" formControlName="installmentAmount" />
                  </ng-template>
                </span>
                <span>
                  <ng-container *ngIf="editingDebtId !== debt.id; else finalDateEdit">
                    <strong>{{ debtDueLabel(debt) }}</strong>
                    <small>{{ debt.finalDueDate | date: 'dd MMM y' }}</small>
                  </ng-container>
                  <ng-template #finalDateEdit>
                    <input type="date" formControlName="finalDueDate" />
                    <small>
                      {{ i18n.t('debts.installments') }}
                      <input type="number" min="1" step="1" formControlName="installments" />
                    </small>
                  </ng-template>
                </span>
                <span>{{ labelForStatus(debt.status) }}</span>
                <span class="table-actions">
                  <button class="table-action" type="button" *ngIf="editingDebtId !== debt.id" (click)="toggleInstallments(debt.id)">
                    {{ selectedDebtId === debt.id ? i18n.t('debts.hideInstallments') : i18n.t('debts.viewInstallments') }}
                  </button>
                  <button class="table-action" type="button" *ngIf="editingDebtId !== debt.id" (click)="startEditDebt(debt)">
                    {{ i18n.t('debts.edit') }}
                  </button>
                  <button class="table-action" type="button" *ngIf="editingDebtId === debt.id" (click)="saveDebtEdit(debt)">
                    {{ savingEdit ? i18n.t('common.saving') : i18n.t('debts.save') }}
                  </button>
                  <button class="table-action muted" type="button" *ngIf="editingDebtId === debt.id" (click)="cancelDebtEdit()">
                    {{ i18n.t('debts.cancel') }}
                  </button>
                  <button class="table-action danger" type="button" *ngIf="editingDebtId !== debt.id" (click)="deleteDebt(debt.id)">
                    {{ i18n.t('debts.delete') }}
                  </button>
                </span>
              </div>

            </ng-container>
          </div>

          <div class="installment-list debt-installments-panel" *ngIf="selectedDebt(state.debts) as debt">
            <div class="panel-title">
              <h3>{{ debt.name }}</h3>
              <span>{{ debt.currencyCode }} · {{ selectedInstallments.length }} {{ i18n.t('debts.installments').toLowerCase() }}</span>
            </div>
            <p class="notice" *ngIf="loadingInstallments">{{ i18n.t('common.loading') }}</p>
            <div class="data-row installment-row heading">
              <span>#</span>
              <span>{{ i18n.t('transactions.amount') }}</span>
              <span>{{ i18n.t('debts.finalDueDate') }}</span>
              <span>{{ i18n.t('transactions.status') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>
            <div
              class="data-row installment-row"
              *ngFor="let installment of selectedInstallments"
              [class.paid]="installment.status === 'PAID'"
              [class.due-warning]="installmentDueStatus(installment) === 'warning'"
              [class.due-danger]="installmentDueStatus(installment) === 'danger'"
              [formGroup]="installmentForm"
            >
              <span>{{ installment.installmentNumber }}</span>
              <span>
                <ng-container *ngIf="editingInstallmentId !== installment.id; else amountEdit">
                  {{ installment.amount | currency: debt.currencyCode : 'symbol' : '1.2-2' }}
                  <small *ngIf="installment.paidAmount">
                    {{ i18n.t('debts.paidAmount') }}:
                    {{ installment.paidAmount | currency: debt.currencyCode : 'symbol' : '1.2-2' }}
                  </small>
                </ng-container>
                <ng-template #amountEdit>
                  <input type="number" min="0.01" step="0.01" formControlName="amount" />
                  <small>
                    {{ i18n.t('debts.principalAmount') }}
                    <input type="number" min="0" step="0.01" formControlName="principalAmount" />
                  </small>
                  <small>
                    {{ i18n.t('debts.interestRate') }}
                    <input type="number" min="0" step="0.01" formControlName="interestAmount" />
                  </small>
                </ng-template>
              </span>
              <span>
                <ng-container *ngIf="editingInstallmentId !== installment.id; else installmentDateEdit">
                  {{ installment.dueDate | date: 'dd MMM y' }}
                </ng-container>
                <ng-template #installmentDateEdit>
                  <input type="date" formControlName="dueDate" />
                </ng-template>
              </span>
              <span>{{ labelForInstallmentStatus(installment.status) }}</span>
              <span class="table-actions">
                <form
                  class="inline-payment-form"
                  [formGroup]="paymentForm"
                  *ngIf="payingInstallmentId === installment.id"
                  (ngSubmit)="saveInstallmentPayment(debt.id, installment.id)"
                >
                  <input type="number" min="0.01" step="0.01" formControlName="paymentAmount" />
                  <input type="date" formControlName="paidDate" />
                  <button class="table-action" type="submit" [disabled]="paymentForm.invalid || savingPayment">
                    {{ savingPayment ? i18n.t('common.saving') : i18n.t('debts.save') }}
                  </button>
                  <button class="table-action muted" type="button" (click)="cancelPayment()">
                    {{ i18n.t('debts.cancel') }}
                  </button>
                </form>
                <button
                  class="table-action"
                  type="button"
                  *ngIf="installment.status !== 'PAID' && editingInstallmentId !== installment.id && payingInstallmentId !== installment.id"
                  (click)="startEditInstallment(installment)"
                >
                  {{ i18n.t('debts.edit') }}
                </button>
                <button
                  class="table-action"
                  type="button"
                  *ngIf="editingInstallmentId === installment.id"
                  (click)="saveInstallmentEdit(debt.id, installment)"
                >
                  {{ savingInstallment ? i18n.t('common.saving') : i18n.t('debts.save') }}
                </button>
                <button class="table-action muted" type="button" *ngIf="editingInstallmentId === installment.id" (click)="cancelInstallmentEdit()">
                  {{ i18n.t('debts.cancel') }}
                </button>
                <button
                  class="table-action"
                  type="button"
                  *ngIf="installment.status !== 'PAID' && editingInstallmentId !== installment.id && payingInstallmentId !== installment.id"
                  (click)="startPayment(installment)"
                >
                  {{ i18n.t('debts.markPaid') }}
                </button>
                <button
                  class="table-action muted"
                  type="button"
                  *ngIf="installment.status === 'PAID'"
                  (click)="markInstallmentUnpaid(debt.id, installment.id)"
                >
                  {{ i18n.t('debts.markUnpaid') }}
                </button>
              </span>
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
  savingEdit = false;
  savingInstallment = false;
  savingPayment = false;
  loadingInstallments = false;
  selectedDebtId: string | null = null;
  editingDebtId: string | null = null;
  editingInstallmentId: string | null = null;
  payingInstallmentId: string | null = null;
  selectedInstallments: DebtInstallment[] = [];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    debtType: ['INSTALLMENT_PURCHASE' as DebtType, Validators.required],
    currencyCode: ['EUR', Validators.required],
    countryCode: ['DE', Validators.required],
    principalAmount: [0, [Validators.required, Validators.min(0.01)]],
    annualInterestRate: [0, [Validators.required, Validators.min(0)]],
    installmentAmount: [0, [Validators.required, Validators.min(0.01)]],
    installments: [1, [Validators.required, Validators.min(1)]],
    startDate: [this.today(), Validators.required],
    finalDueDate: [this.today(), Validators.required]
  });

  readonly editForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    debtType: ['INSTALLMENT_PURCHASE' as DebtType, Validators.required],
    currencyCode: ['EUR', Validators.required],
    countryCode: ['DE', Validators.required],
    principalAmount: [0, [Validators.required, Validators.min(0.01)]],
    annualInterestRate: [0, [Validators.required, Validators.min(0)]],
    installmentAmount: [0, [Validators.required, Validators.min(0.01)]],
    installments: [1, [Validators.required, Validators.min(1)]],
    startDate: [this.today(), Validators.required],
    finalDueDate: [this.today(), Validators.required]
  });

  readonly installmentForm = this.formBuilder.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    principalAmount: [0, [Validators.required, Validators.min(0)]],
    interestAmount: [0, [Validators.required, Validators.min(0)]],
    dueDate: [this.today(), Validators.required]
  });

  readonly paymentForm = this.formBuilder.nonNullable.group({
    paymentAmount: [0, [Validators.required, Validators.min(0.01)]],
    paidDate: [this.today(), Validators.required]
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
            installmentAmount: 0,
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

  startEditDebt(debt: Debt): void {
    this.editingDebtId = debt.id;
    this.selectedDebtId = null;
    this.selectedInstallments = [];
    this.editForm.reset({
      name: debt.name,
      debtType: debt.debtType,
      currencyCode: debt.currencyCode,
      countryCode: debt.countryCode,
      principalAmount: debt.principalAmount,
      annualInterestRate: debt.annualInterestRate,
      installmentAmount: debt.installmentAmount,
      installments: debt.installments,
      startDate: debt.startDate,
      finalDueDate: debt.finalDueDate
    });
  }

  saveDebtEdit(debt: Debt): void {
    if (this.editForm.invalid || this.savingEdit) {
      return;
    }
    this.savingEdit = true;
    this.debts
      .update(debt.id, this.editForm.getRawValue() as DebtRequest)
      .pipe(
        tap(() => {
          this.cancelDebtEdit();
          this.reload$.next();
        }),
        catchError(() => {
          alert(this.i18n.t('debts.updateBlocked'));
          return of(null);
        }),
        finalize(() => (this.savingEdit = false))
      )
      .subscribe();
  }

  cancelDebtEdit(): void {
    this.editingDebtId = null;
  }

  deleteDebt(debtId: string): void {
    if (!confirm(this.i18n.t('confirm.deleteDebt'))) {
      return;
    }
    this.debts
      .delete(debtId)
      .pipe(
        tap(() => this.reload$.next()),
        catchError(() => {
          alert(this.i18n.t('debts.deleteBlocked'));
          return of(null);
        })
      )
      .subscribe();
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

  activeDebts(debts: Debt[]): Debt[] {
    return debts.filter((debt) => debt.status === 'ACTIVE');
  }

  sortedDebts(debts: Debt[]): Debt[] {
    return [...debts].sort((first, second) => {
      if (first.status !== second.status) {
        return first.status === 'ACTIVE' ? -1 : 1;
      }
      const dateCompare = first.finalDueDate.localeCompare(second.finalDueDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return first.name.localeCompare(second.name);
    });
  }

  debtCurrencies(debts: Debt[]): string[] {
    const currencies = this.activeDebts(debts).map((debt) => debt.currencyCode);
    return [...new Set(currencies.length > 0 ? currencies : ['EUR'])];
  }

  totalRemaining(debts: Debt[], currencyCode: string): number {
    return debts
      .filter((debt) => debt.status === 'ACTIVE' && debt.currencyCode === currencyCode)
      .reduce((total, debt) => total + Number(debt.remainingBalance || 0), 0);
  }

  pendingInstallments(debts: Debt[]): number {
    return this.activeDebts(debts).reduce((total, debt) => total + Number(debt.installments || 0), 0);
  }

  nextDueDate(debts: Debt[]): string | null {
    return debts
      .filter((debt) => debt.status === 'ACTIVE')
      .map((debt) => debt.finalDueDate)
      .sort()[0] ?? null;
  }

  monthlyPayment(debt: Debt): number {
    return Number(debt.installmentAmount || 0);
  }

  debtDueLabel(debt: Debt): string {
    if (debt.status === 'PAID') {
      return this.i18n.t('debts.statusPaid');
    }
    const days = this.daysUntil(debt.finalDueDate);
    if (days === 0) {
      return this.i18n.t('budget.dueToday');
    }
    if (days > 0) {
      return this.i18n.t('budget.daysLeft').replace('{days}', String(days));
    }
    return this.i18n.t('budget.daysOverdue').replace('{days}', String(Math.abs(days)));
  }

  debtDueStatus(debt: Debt): 'safe' | 'warning' | 'danger' | 'paid' {
    if (debt.status === 'PAID') {
      return 'paid';
    }
    const days = this.daysUntil(debt.finalDueDate);
    if (days > 10) {
      return 'safe';
    }
    if (days >= 5) {
      return 'warning';
    }
    return 'danger';
  }

  installmentDueStatus(installment: DebtInstallment): 'warning' | 'danger' | 'paid' | 'none' {
    if (installment.status === 'PAID') {
      return 'paid';
    }
    const days = this.daysUntil(installment.dueDate);
    if (days < 5) {
      return 'danger';
    }
    if (days <= 10) {
      return 'warning';
    }
    return 'none';
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
      this.loadingInstallments = false;
      this.cancelInstallmentEdit();
      this.cancelPayment();
      return;
    }

    this.selectedDebtId = debtId;
    this.selectedInstallments = [];
    this.loadingInstallments = true;
    this.cancelInstallmentEdit();
    this.debts.installments(debtId).subscribe({
      next: (installments) => {
        if (this.selectedDebtId !== debtId) {
          return;
        }
        this.selectedInstallments = installments;
        this.loadingInstallments = false;
      },
      error: () => {
        if (this.selectedDebtId === debtId) {
          this.loadingInstallments = false;
        }
      }
    });
  }

  selectedDebt(debts: Debt[]): Debt | null {
    return debts.find((debt) => debt.id === this.selectedDebtId) ?? null;
  }

  startEditInstallment(installment: DebtInstallment): void {
    this.editingInstallmentId = installment.id;
    this.cancelPayment();
    this.installmentForm.reset({
      amount: installment.amount,
      principalAmount: installment.principalAmount,
      interestAmount: installment.interestAmount,
      dueDate: installment.dueDate
    });
  }

  saveInstallmentEdit(debtId: string, installment: DebtInstallment): void {
    if (this.installmentForm.invalid || this.savingInstallment) {
      return;
    }
    this.savingInstallment = true;
    this.debts
      .updateInstallment(debtId, installment.id, this.installmentForm.getRawValue() as DebtInstallmentRequest)
      .pipe(
        tap(() => this.refreshInstallments(debtId)),
        finalize(() => (this.savingInstallment = false))
      )
      .subscribe();
  }

  cancelInstallmentEdit(): void {
    this.editingInstallmentId = null;
  }

  startPayment(installment: DebtInstallment): void {
    this.cancelInstallmentEdit();
    this.payingInstallmentId = installment.id;
    this.paymentForm.reset({
      paymentAmount: installment.amount,
      paidDate: this.today()
    });
  }

  saveInstallmentPayment(debtId: string, installmentId: string): void {
    if (this.paymentForm.invalid || this.savingPayment) {
      return;
    }
    this.savingPayment = true;
    this.debts
      .payInstallment(debtId, installmentId, {
        paymentAmount: this.paymentForm.controls.paymentAmount.value,
        paidDate: this.paymentForm.controls.paidDate.value,
        paymentTransactionId: null
      })
      .pipe(finalize(() => (this.savingPayment = false)))
      .subscribe(() => this.refreshInstallments(debtId));
  }

  cancelPayment(): void {
    this.payingInstallmentId = null;
  }

  markInstallmentUnpaid(debtId: string, installmentId: string): void {
    this.debts
      .markInstallmentUnpaid(debtId, installmentId)
      .subscribe(() => this.refreshInstallments(debtId));
  }

  private refreshInstallments(debtId: string): void {
    this.cancelInstallmentEdit();
    this.cancelPayment();
    this.loadingInstallments = true;
    this.debts.installments(debtId).subscribe({
      next: (installments) => {
        if (this.selectedDebtId !== debtId) {
          return;
        }
        this.selectedInstallments = installments;
        this.loadingInstallments = false;
        this.reload$.next();
      },
      error: () => {
        if (this.selectedDebtId === debtId) {
          this.loadingInstallments = false;
        }
      }
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

  countryLabel(countryCode: string): string {
    return countryCode === 'DE' ? this.i18n.t('accounts.countryGermany') : this.i18n.t('accounts.countryColombia');
  }

  private daysUntil(value: string): number {
    const [year, month, day] = value.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
