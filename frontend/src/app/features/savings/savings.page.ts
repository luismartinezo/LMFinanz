import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, finalize, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { SavingsGoal, SavingsGoalRequest, SavingsGoalStatus } from './savings.models';
import { SavingsService } from './savings.service';

@Component({
  selector: 'app-savings-page',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('savings.eyebrow') }}</p>
          <h2>{{ i18n.t('savings.title') }}</h2>
          <p>{{ i18n.t('savings.subtitle') }}</p>
        </div>
        <button type="button" (click)="toggleForm()">
          {{ showForm ? i18n.t('accounts.closeForm') : i18n.t('savings.newGoal') }}
        </button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('savings.progress') }}</span>
          <strong>{{ averageProgress(state.goals) | number: '1.0-0' }}%</strong>
          <p>{{ i18n.t('savings.progressHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('savings.savedAmount') }}</span>
          <strong>{{ savedAmount(state.goals, primaryCurrency(state.goals)) | currency: primaryCurrency(state.goals) : 'symbol' : '1.2-2' }}</strong>
          <p>{{ i18n.t('savings.savedAmountHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('savings.activeGoals') }}</span>
          <strong>{{ activeGoals(state.goals) }}</strong>
          <p>{{ i18n.t('savings.activeGoalsHint') }}</p>
        </article>
      </section>

      <section class="content-grid accounts-layout">
        <article class="panel" *ngIf="showForm">
          <div class="panel-title">
            <h3>{{ i18n.t('savings.newGoal') }}</h3>
            <span>{{ i18n.t('common.requiredFields') }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createGoal()">
            <label>
              {{ i18n.t('savings.name') }}
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
                {{ i18n.t('savings.targetAmount') }}
                <input type="number" min="0.01" step="0.01" formControlName="targetAmount" />
              </label>
            </div>

            <label>
              {{ i18n.t('savings.deadline') }}
              <input type="date" formControlName="deadline" />
            </label>

            <button type="submit" [disabled]="form.invalid || saving">
              {{ saving ? i18n.t('common.saving') : i18n.t('savings.create') }}
            </button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('savings.listTitle') }}</h3>
            <span>{{ state.loading ? i18n.t('common.loading') : state.goals.length + ' ' + i18n.t('common.total') }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && state.goals.length === 0">
            <strong>{{ i18n.t('savings.emptyTitle') }}</strong>
            <p>{{ i18n.t('savings.emptyHint') }}</p>
          </div>

          <div class="data-table" *ngIf="state.goals.length > 0">
            <div class="data-row savings-row heading">
              <span>{{ i18n.t('savings.name') }}</span>
              <span>{{ i18n.t('savings.progress') }}</span>
              <span>{{ i18n.t('savings.targetAmount') }}</span>
              <span>{{ i18n.t('savings.deadline') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>

            <div class="data-row savings-row" *ngFor="let goal of state.goals">
              <span>
                <strong>{{ goal.name }}</strong>
                <small>{{ labelForStatus(goal.status) }}</small>
              </span>
              <span>
                <strong>{{ progress(goal) | number: '1.0-0' }}%</strong>
                <span class="progress-track">
                  <span class="progress-fill" [style.width.%]="progress(goal)"></span>
                </span>
                <small>{{ goal.currentAmount | currency: goal.currencyCode : 'symbol' : '1.2-2' }}</small>
              </span>
              <span>{{ goal.targetAmount | currency: goal.currencyCode : 'symbol' : '1.2-2' }}</span>
              <span>{{ goal.deadline | date: 'dd MMM y' }}</span>
              <span class="table-actions">
                <form class="inline-form" [formGroup]="contributionForms[goal.id]" (ngSubmit)="contribute(goal.id)" *ngIf="goal.status === 'ACTIVE'">
                  <input type="number" min="0.01" step="0.01" formControlName="amount" [placeholder]="i18n.t('savings.contribution')" />
                  <button class="table-action" type="submit" [disabled]="contributionForms[goal.id].invalid">
                    {{ i18n.t('savings.add') }}
                  </button>
                </form>
                <button class="table-action" type="button" *ngIf="goal.status === 'ACTIVE'" (click)="cancelGoal(goal.id)">
                  {{ i18n.t('savings.cancel') }}
                </button>
              </span>
            </div>
          </div>
        </article>
      </section>
    </main>
  `
})
export class SavingsPage {
  private readonly savings = inject(SavingsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);

  showForm = false;
  saving = false;
  readonly contributionForms: Record<string, FormGroup<{ amount: FormControl<number> }>> = {};

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(140)]],
    currencyCode: ['EUR', Validators.required],
    targetAmount: [0, [Validators.required, Validators.min(0.01)]],
    deadline: [this.tomorrow(), Validators.required]
  });

  readonly state$: Observable<{ loading: boolean; goals: SavingsGoal[]; error: string | null }> = this.reload$.pipe(
    switchMap(() =>
      this.savings.list().pipe(
        tap((goals) => this.ensureContributionForms(goals)),
        map((goals) => ({ loading: false, goals, error: null })),
        startWith({ loading: true, goals: [], error: null }),
        catchError(() =>
          of({
            loading: false,
            goals: [],
            error: this.i18n.t('savings.loadError')
          })
        )
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  createGoal(): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.savings
      .create(this.form.getRawValue() as SavingsGoalRequest)
      .pipe(
        tap(() => {
          this.form.reset({
            name: '',
            currencyCode: 'EUR',
            targetAmount: 0,
            deadline: this.tomorrow()
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

  contribute(goalId: string): void {
    const form = this.contributionForms[goalId];
    if (!form || form.invalid) {
      return;
    }

    this.savings
      .contribute(goalId, {
        transactionId: null,
        amount: Number(form.getRawValue().amount),
        contributionDate: this.today()
      })
      .subscribe(() => {
        form.reset({ amount: 0 });
        this.reload$.next();
      });
  }

  cancelGoal(goalId: string): void {
    this.savings.cancel(goalId).subscribe(() => this.reload$.next());
  }

  progress(goal: SavingsGoal): number {
    if (!goal.targetAmount) {
      return 0;
    }
    return Math.min(100, (Number(goal.currentAmount || 0) / Number(goal.targetAmount)) * 100);
  }

  averageProgress(goals: SavingsGoal[]): number {
    const active = goals.filter((goal) => goal.status === 'ACTIVE');
    if (active.length === 0) {
      return 0;
    }
    return active.reduce((total, goal) => total + this.progress(goal), 0) / active.length;
  }

  activeGoals(goals: SavingsGoal[]): number {
    return goals.filter((goal) => goal.status === 'ACTIVE').length;
  }

  primaryCurrency(goals: SavingsGoal[]): string {
    return goals.find((goal) => goal.status === 'ACTIVE')?.currencyCode ?? goals[0]?.currencyCode ?? 'EUR';
  }

  savedAmount(goals: SavingsGoal[], currencyCode: string): number {
    return goals
      .filter((goal) => goal.currencyCode === currencyCode)
      .reduce((total, goal) => total + Number(goal.currentAmount || 0), 0);
  }

  labelForStatus(status: SavingsGoalStatus): string {
    const labels: Record<SavingsGoalStatus, string> = {
      ACTIVE: this.i18n.t('common.active'),
      COMPLETED: this.i18n.t('savings.statusCompleted'),
      CANCELLED: this.i18n.t('savings.statusCancelled')
    };
    return labels[status];
  }

  private ensureContributionForms(goals: SavingsGoal[]): void {
    goals.forEach((goal) => {
      if (!this.contributionForms[goal.id]) {
        this.contributionForms[goal.id] = this.formBuilder.nonNullable.group({
          amount: [0, [Validators.required, Validators.min(0.01)]]
        });
      }
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private tomorrow(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }
}
