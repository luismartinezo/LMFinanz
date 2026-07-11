import { AsyncPipe, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Account, AccountRequest, AccountType, CountryCode, CurrencyCode } from './accounts.models';
import { AccountsService } from './accounts.service';

@Component({
  selector: 'app-accounts-page',
  imports: [AsyncPipe, CurrencyPipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('accounts.eyebrow') }}</p>
          <h2>{{ i18n.t('accounts.title') }}</h2>
          <p>{{ i18n.t('accounts.subtitle') }}</p>
        </div>
        <button type="button" (click)="toggleForm()">{{ showForm ? i18n.t('accounts.closeForm') : i18n.t('accounts.newAccount') }}</button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('accounts.bankAccounts') }}</span>
          <strong>{{ countByType(state.accounts, 'BANK_ACCOUNT') }}</strong>
          <p>{{ i18n.t('accounts.bankAccountsHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('accounts.cashAccounts') }}</span>
          <strong>{{ countByType(state.accounts, 'CASH_ACCOUNT') }}</strong>
          <p>{{ i18n.t('accounts.cashAccountsHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('accounts.creditCards') }}</span>
          <strong>{{ countByType(state.accounts, 'CREDIT_CARD') }}</strong>
          <p>{{ i18n.t('accounts.creditCardsHint') }}</p>
        </article>
      </section>

      <section class="content-grid accounts-layout">
        <article class="panel" *ngIf="showForm">
          <div class="panel-title">
            <h3>{{ i18n.t('accounts.formTitle') }}</h3>
            <span>{{ i18n.t('common.requiredFields') }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createAccount()">
            <label>
              {{ i18n.t('accounts.name') }}
              <input formControlName="name" [placeholder]="i18n.t('accounts.namePlaceholder')" />
            </label>

            <label>
              {{ i18n.t('accounts.type') }}
              <select formControlName="type">
                <option value="BANK_ACCOUNT">{{ i18n.t('accounts.typeBank') }}</option>
                <option value="CASH_ACCOUNT">{{ i18n.t('accounts.typeCash') }}</option>
                <option value="CREDIT_CARD">{{ i18n.t('accounts.typeCredit') }}</option>
              </select>
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
                {{ i18n.t('accounts.country') }}
                <select formControlName="countryCode">
                  <option value="DE">{{ i18n.t('accounts.countryGermany') }}</option>
                  <option value="CO">{{ i18n.t('accounts.countryColombia') }}</option>
                </select>
              </label>
            </div>

            <label>
              {{ i18n.t('accounts.openingBalance') }}
              <input type="number" step="0.01" formControlName="openingBalance" />
            </label>

            <button type="submit" [disabled]="form.invalid || saving">
              {{ saving ? i18n.t('common.saving') : i18n.t('accounts.create') }}
            </button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('accounts.listTitle') }}</h3>
            <span>{{ state.loading ? i18n.t('common.loading') : state.accounts.length + ' ' + i18n.t('common.total') }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && state.accounts.length === 0">
            <strong>{{ i18n.t('accounts.emptyTitle') }}</strong>
            <p>{{ i18n.t('accounts.emptyHint') }}</p>
          </div>

          <div class="data-table" *ngIf="state.accounts.length > 0">
            <div class="data-row heading">
              <span>{{ i18n.t('accounts.tableName') }}</span>
              <span>{{ i18n.t('accounts.tableType') }}</span>
              <span>{{ i18n.t('accounts.tableCountry') }}</span>
              <span>{{ i18n.t('accounts.tableBalance') }}</span>
            </div>

            <div class="data-row" *ngFor="let account of state.accounts">
              <span>
                <strong>{{ account.name }}</strong>
                <small>{{ account.active ? i18n.t('common.active') : i18n.t('common.closed') }}</small>
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
  readonly i18n = inject(I18nService);

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
            error: this.i18n.t('accounts.loadError')
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
    const labels: Record<AccountType, string> = {
      BANK_ACCOUNT: this.i18n.t('accounts.typeBank'),
      CASH_ACCOUNT: this.i18n.t('accounts.typeCash'),
      CREDIT_CARD: this.i18n.t('accounts.typeCredit')
    };
    return labels[type];
  }
}
