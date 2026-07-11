import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSelectorComponent } from '../../core/i18n/language-selector.component';

@Component({
  selector: 'app-login-page',
  imports: [LanguageSelectorComponent, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <div class="auth-page-language">
        <app-language-selector />
      </div>

      <section class="auth-panel">
        <div class="auth-visual" aria-hidden="true">
          <div class="visual-card visual-card-small"></div>
          <div class="visual-card visual-card-wide"></div>
          <div class="visual-desk">
            <div class="visual-screen">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="visual-person">
              <span class="person-head"></span>
              <span class="person-body"></span>
              <span class="person-arm"></span>
              <span class="person-leg person-leg-left"></span>
              <span class="person-leg person-leg-right"></span>
            </div>
          </div>
          <div class="visual-chart">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div class="auth-form-panel">
          <div class="auth-heading">
            <p class="eyebrow">LMFinanz</p>
            <h1>{{ i18n.t('auth.signIn') }}</h1>
            <p>{{ i18n.t('auth.signInSubtitle') }}</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <label>
              {{ i18n.t('auth.email') }}
              <input type="email" formControlName="email" autocomplete="email" />
            </label>

            <label>
              {{ i18n.t('auth.password') }}
              <input type="password" formControlName="password" autocomplete="current-password" />
            </label>

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            <button type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? i18n.t('auth.signingIn') : i18n.t('auth.loginSubmit') }}
            </button>
          </form>

          <p class="switch">{{ i18n.t('auth.noAccount') }} <a routerLink="/auth/register">{{ i18n.t('auth.createAccount') }}</a></p>
        </div>
      </section>
    </main>
  `
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('auth.loginError'));
      }
    });
  }
}
