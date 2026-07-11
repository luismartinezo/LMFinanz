import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSelectorComponent } from '../../core/i18n/language-selector.component';

@Component({
  selector: 'app-register-page',
  imports: [LanguageSelectorComponent, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <div class="auth-page-language">
        <app-language-selector />
      </div>

      <section class="auth-panel">
        <div class="auth-visual" aria-hidden="true">
          <img src="/images/auth-finance-illustration.png" alt="" />
        </div>

        <div class="auth-form-panel">
          <div class="auth-heading">
            <p class="eyebrow">LMFinanz</p>
            <h1>{{ i18n.t('auth.register') }}</h1>
            <p>{{ i18n.t('auth.registerSubtitle') }}</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <label>
              {{ i18n.t('auth.fullName') }}
              <input type="text" formControlName="fullName" autocomplete="name" />
            </label>

            <label>
              {{ i18n.t('auth.email') }}
              <input type="email" formControlName="email" autocomplete="email" />
            </label>

            <label>
              {{ i18n.t('auth.password') }}
              <input type="password" formControlName="password" autocomplete="new-password" />
            </label>

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            <button type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? i18n.t('auth.creating') : i18n.t('auth.registerSubmit') }}
            </button>
          </form>

          <p class="switch">{{ i18n.t('auth.hasAccount') }} <a routerLink="/auth/login">{{ i18n.t('auth.login') }}</a></p>
        </div>
      </section>
    </main>
  `
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(140)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
      ]
    ]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('auth.registerError'));
      }
    });
  }
}
