import { AsyncPipe, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, map, of, startWith, switchMap, tap } from 'rxjs';
import { Account, AccountRequest, AccountType, CountryCode, CurrencyCode } from './accounts.models';
import { AccountsService } from './accounts.service';

@Component({
  selector: 'app-accounts-page',
  imports: [AsyncPipe, CurrencyPipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Accounts</p>
          <h2>Cuentas</h2>
          <p>Bank accounts, cash accounts y credit cards por moneda y pais.</p>
        </div>
        <button type="button" (click)="toggleForm()">{{ showForm ? 'Close' : 'New account' }}</button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="module-grid">
        <article class="module-card">
          <span>Bank accounts</span>
          <strong>{{ countByType(state.accounts, 'BANK_ACCOUNT') }}</strong>
          <p>EUR, COP y USD con balance disponible.</p>
        </article>
        <article class="module-card">
          <span>Cash accounts</span>
          <strong>{{ countByType(state.accounts, 'CASH_ACCOUNT') }}</strong>
          <p>Efectivo por pais para gastos diarios.</p>
        </article>
        <article class="module-card">
          <span>Credit cards</span>
          <strong>{{ countByType(state.accounts, 'CREDIT_CARD') }}</strong>
          <p>Cupo, deuda y fecha de pago.</p>
        </article>
      </section>

      <section class="content-grid accounts-layout">
        <article class="panel" *ngIf="showForm">
          <div class="panel-title">
            <h3>New account</h3>
            <span>Required fields</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createAccount()">
            <label>
              Name
              <input formControlName="name" placeholder="Main bank account" />
            </label>

            <label>
              Type
              <select formControlName="type">
                <option value="BANK_ACCOUNT">Bank account</option>
                <option value="CASH_ACCOUNT">Cash account</option>
                <option value="CREDIT_CARD">Credit card</option>
              </select>
            </label>

            <div class="form-row">
              <label>
                Currency
                <select formControlName="currencyCode">
                  <option value="EUR">EUR</option>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                </select>
              </label>

              <label>
                Country
                <select formControlName="countryCode">
                  <option value="DE">Germany</option>
                  <option value="CO">Colombia</option>
                </select>
              </label>
            </div>

            <label>
              Opening balance
              <input type="number" step="0.01" formControlName="openingBalance" />
            </label>

            <button type="submit" [disabled]="form.invalid || saving">
              {{ saving ? 'Saving' : 'Create account' }}
            </button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>Account list</h3>
            <span>{{ state.loading ? 'Loading' : state.accounts.length + ' total' }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && state.accounts.length === 0">
            <strong>No accounts yet</strong>
            <p>Crea tu primera cuenta para empezar a registrar transacciones.</p>
          </div>

          <div class="data-table" *ngIf="state.accounts.length > 0">
            <div class="data-row heading">
              <span>Name</span>
              <span>Type</span>
              <span>Country</span>
              <span>Balance</span>
            </div>

            <div class="data-row" *ngFor="let account of state.accounts">
              <span>
                <strong>{{ account.name }}</strong>
                <small>{{ account.active ? 'Active' : 'Closed' }}</small>
              </span>
              <span>{{ labelFor(account.type) }}</span>
              <span>{{ account.countryCode }}</span>
              <span>{{ account.currentBalance | currency: account.currencyCode : 'symbol' : '1.2-2' }}</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  `
})
export class AccountsPage {
  private readonly accounts = inject(AccountsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  showForm = false;
  saving = false;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    type: ['BANK_ACCOUNT' as AccountType, Validators.required],
    currencyCode: ['EUR' as CurrencyCode, Validators.required],
    countryCode: ['DE' as CountryCode, Validators.required],
    openingBalance: [0, Validators.required]
  });

  readonly state$: Observable<{ loading: boolean; accounts: Account[]; error: string | null }> = this.reload$.pipe(
    switchMap(() =>
      this.accounts.list().pipe(
        map((accounts) => ({ loading: false, accounts, error: null })),
        startWith({ loading: true, accounts: [], error: null }),
        catchError(() =>
          of({
            loading: false,
            accounts: [],
            error: 'No se pudieron cargar las cuentas. Verifica que el backend este corriendo.'
          })
        )
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  createAccount(): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.accounts
      .create(this.form.getRawValue() as AccountRequest)
      .pipe(
        tap(() => {
          this.form.reset({
            name: '',
            type: 'BANK_ACCOUNT',
            currencyCode: 'EUR',
            countryCode: 'DE',
            openingBalance: 0
          });
          this.showForm = false;
          this.reload$.next();
        }),
        catchError(() => of(null)),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe();
  }

  countByType(accounts: Account[], type: AccountType): number {
    return accounts.filter((account) => account.type === type).length;
  }

  labelFor(type: AccountType): string {
    return type
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
