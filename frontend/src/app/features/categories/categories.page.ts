import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { Category, CategoryRequest, CategoryType } from './categories.models';
import { CategoriesService } from './categories.service';

@Component({
  selector: 'app-categories-page',
  imports: [AsyncPipe, NgFor, NgIf, ReactiveFormsModule],
  template: `
    <main class="module-page" *ngIf="state$ | async as state">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ i18n.t('categories.eyebrow') }}</p>
          <h2>{{ i18n.t('categories.title') }}</h2>
          <p>{{ i18n.t('categories.subtitle') }}</p>
        </div>
        <button type="button" (click)="toggleForm()">
          {{ showForm ? i18n.t('accounts.closeForm') : i18n.t('categories.newCategory') }}
        </button>
      </section>

      <p class="notice error" *ngIf="state.error">{{ state.error }}</p>

      <section class="module-grid">
        <article class="module-card">
          <span>{{ i18n.t('categories.incomeCategories') }}</span>
          <strong>{{ countByType(state.categories, 'INCOME') }}</strong>
          <p>{{ i18n.t('categories.incomeHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('categories.expenseCategories') }}</span>
          <strong>{{ countByType(state.categories, 'EXPENSE') }}</strong>
          <p>{{ i18n.t('categories.expenseHint') }}</p>
        </article>
        <article class="module-card">
          <span>{{ i18n.t('categories.subcategories') }}</span>
          <strong>{{ subcategoryCount(state.categories) }}</strong>
          <p>{{ i18n.t('categories.subcategoriesHint') }}</p>
        </article>
      </section>

      <section class="content-grid accounts-layout">
        <article class="panel" *ngIf="showForm">
          <div class="panel-title">
            <h3>{{ i18n.t('categories.newCategory') }}</h3>
            <span>{{ i18n.t('common.requiredFields') }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="createCategory()">
            <label>
              {{ i18n.t('categories.name') }}
              <input formControlName="name" />
            </label>

            <label>
              {{ i18n.t('categories.type') }}
              <select formControlName="type">
                <option value="INCOME">{{ i18n.t('transactions.typeIncome') }}</option>
                <option value="EXPENSE">{{ i18n.t('transactions.typeExpense') }}</option>
              </select>
            </label>

            <label>
              {{ i18n.t('categories.parent') }}
              <select formControlName="parentCategoryId">
                <option value="">{{ i18n.t('categories.noParent') }}</option>
                <option *ngFor="let category of parentOptions(state.categories)" [value]="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <button type="submit" [disabled]="form.invalid || saving">
              {{ saving ? i18n.t('common.saving') : i18n.t('categories.create') }}
            </button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>{{ i18n.t('categories.listTitle') }}</h3>
            <span>{{ state.loading ? i18n.t('common.loading') : state.categories.length + ' ' + i18n.t('common.total') }}</span>
          </div>

          <div class="empty-state" *ngIf="!state.loading && state.categories.length === 0">
            <strong>{{ i18n.t('categories.emptyTitle') }}</strong>
            <p>{{ i18n.t('categories.emptyHint') }}</p>
          </div>

          <div class="data-table" *ngIf="state.categories.length > 0">
            <div class="data-row category-row heading">
              <span>{{ i18n.t('categories.name') }}</span>
              <span>{{ i18n.t('categories.type') }}</span>
              <span>{{ i18n.t('categories.parent') }}</span>
              <span>{{ i18n.t('transactions.status') }}</span>
              <span>{{ i18n.t('transactions.actions') }}</span>
            </div>

            <div class="data-row category-row" *ngFor="let category of state.categories">
              <span>
                <strong>{{ category.name }}</strong>
                <small>{{ category.systemDefined ? i18n.t('categories.system') : i18n.t('categories.custom') }}</small>
              </span>
              <span>{{ labelForType(category.type) }}</span>
              <span>{{ parentName(category, state.categories) }}</span>
              <span>{{ category.active ? i18n.t('common.active') : i18n.t('common.closed') }}</span>
              <span>
                <button
                  class="table-action"
                  type="button"
                  *ngIf="category.active"
                  (click)="deactivate(category.id)"
                >
                  {{ i18n.t('categories.deactivate') }}
                </button>
                <button
                  class="table-action"
                  type="button"
                  *ngIf="!category.active"
                  (click)="activate(category.id)"
                >
                  {{ i18n.t('categories.activate') }}
                </button>
              </span>
            </div>
          </div>
        </article>
      </section>
    </main>
  `
})
export class CategoriesPage {
  private readonly categories = inject(CategoriesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  readonly i18n = inject(I18nService);

  showForm = false;
  saving = false;

  readonly form = this.formBuilder.nonNullable.group({
    parentCategoryId: [''],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    type: ['EXPENSE' as CategoryType, Validators.required]
  });

  readonly state$: Observable<{ loading: boolean; categories: Category[]; error: string | null }> = this.reload$.pipe(
    switchMap(() =>
      this.categories.list().pipe(
        map((categories) => ({ loading: false, categories, error: null })),
        startWith({ loading: true, categories: [], error: null }),
        catchError(() =>
          of({
            loading: false,
            categories: [],
            error: this.i18n.t('categories.loadError')
          })
        )
      )
    )
  );

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  createCategory(): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    const value = this.form.getRawValue();
    const request: CategoryRequest = {
      parentCategoryId: value.parentCategoryId || null,
      name: value.name,
      type: value.type
    };

    this.saving = true;
    this.categories
      .create(request)
      .pipe(
        tap(() => {
          this.form.reset({ parentCategoryId: '', name: '', type: 'EXPENSE' });
          this.showForm = false;
          this.reload$.next();
        }),
        catchError(() => of(null))
      )
      .subscribe(() => {
        this.saving = false;
      });
  }

  activate(categoryId: string): void {
    this.categories.activate(categoryId).subscribe(() => this.reload$.next());
  }

  deactivate(categoryId: string): void {
    this.categories.deactivate(categoryId).subscribe(() => this.reload$.next());
  }

  parentOptions(categories: Category[]): Category[] {
    return categories.filter((category) => category.active && !category.parentCategoryId && category.type === this.form.controls.type.value);
  }

  countByType(categories: Category[], type: CategoryType): number {
    return categories.filter((category) => category.type === type).length;
  }

  subcategoryCount(categories: Category[]): number {
    return categories.filter((category) => Boolean(category.parentCategoryId)).length;
  }

  parentName(category: Category, categories: Category[]): string {
    return categories.find((item) => item.id === category.parentCategoryId)?.name ?? '-';
  }

  labelForType(type: CategoryType): string {
    return type === 'INCOME' ? this.i18n.t('transactions.typeIncome') : this.i18n.t('transactions.typeExpense');
  }
}
