import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSelectorComponent } from '../../core/i18n/language-selector.component';

@Component({
  selector: 'app-shell',
  imports: [LanguageSelectorComponent, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span>LM</span>
          <strong>LMFinanz</strong>
        </div>

        <nav aria-label="Main navigation">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ i18n.t('app.dashboard') }}</a>
          <a routerLink="/accounts" routerLinkActive="active">{{ i18n.t('app.accounts') }}</a>
          <a routerLink="/transactions" routerLinkActive="active">{{ i18n.t('app.transactions') }}</a>
          <a routerLink="/debts" routerLinkActive="active">{{ i18n.t('app.debts') }}</a>
          <a routerLink="/savings" routerLinkActive="active">{{ i18n.t('app.savings') }}</a>
          <a routerLink="/assets" routerLinkActive="active">{{ i18n.t('app.assets') }}</a>
          <a routerLink="/reports" routerLinkActive="active">{{ i18n.t('app.reports') }}</a>
        </nav>
      </aside>

      <section class="workspace">
        <header class="topbar">
          <div class="topbar-user">
            <span class="user-avatar">{{ initials() }}</span>
            <div>
              <strong>{{ auth.user()?.fullName }}</strong>
              <span>{{ auth.user()?.email }}</span>
            </div>
          </div>
          <div class="topbar-actions">
            <app-language-selector />
            <button class="button-secondary" type="button" (click)="logout()">{{ i18n.t('app.logout') }}</button>
          </div>
        </header>

        <router-outlet />
      </section>
    </div>
  `
})
export class AppShellComponent {
  constructor(
    readonly auth: AuthService,
    readonly i18n: I18nService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }

  initials(): string {
    const fullName = this.auth.user()?.fullName?.trim();
    if (!fullName) {
      return 'LM';
    }
    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
