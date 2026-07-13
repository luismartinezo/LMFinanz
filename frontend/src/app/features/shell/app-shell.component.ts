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
          <a routerLink="/budget" routerLinkActive="active">{{ i18n.t('app.budget') }}</a>
          <a routerLink="/categories" routerLinkActive="active">{{ i18n.t('app.categories') }}</a>
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
            <button class="topbar-icon" type="button" [attr.aria-label]="i18n.t('topbar.theme')" [title]="i18n.t('topbar.theme')" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 14.6A8.7 8.7 0 0 1 9.4 3a7.4 7.4 0 1 0 11.6 11.6Z" />
              </svg>
            </button>
            <button class="topbar-icon" type="button" [attr.aria-label]="i18n.t('topbar.messages')" [title]="i18n.t('topbar.messages')" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v11H7l-3 3V5Z" />
              </svg>
              <span class="topbar-badge">5</span>
            </button>
            <button class="topbar-icon" type="button" [attr.aria-label]="i18n.t('topbar.notifications')" [title]="i18n.t('topbar.notifications')" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z" />
                <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
              </svg>
              <span class="topbar-badge alert">3</span>
            </button>
            <button class="topbar-icon" type="button" (click)="toggleFullscreen()" [attr.aria-label]="i18n.t('topbar.fullscreen')" [title]="i18n.t('topbar.fullscreen')">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 3H3v5" />
                <path d="M16 3h5v5" />
                <path d="M21 16v5h-5" />
                <path d="M3 16v5h5" />
              </svg>
            </button>
            <details class="profile-menu">
              <summary class="topbar-avatar-button" [attr.aria-label]="i18n.t('topbar.profileMenu')" [title]="i18n.t('topbar.profileMenu')">
                <span class="user-avatar compact">{{ initials() }}</span>
              </summary>
              <div class="profile-dropdown">
                <div class="profile-summary">
                  <strong>{{ auth.user()?.fullName }}</strong>
                  <span>{{ auth.user()?.email }}</span>
                </div>
                <button type="button" disabled>{{ i18n.t('topbar.profile') }} - {{ i18n.t('topbar.comingSoon') }}</button>
                <button type="button" disabled>{{ i18n.t('topbar.settings') }} - {{ i18n.t('topbar.comingSoon') }}</button>
                <button type="button" (click)="logout()">{{ i18n.t('app.logout') }}</button>
              </div>
            </details>
            <button class="topbar-icon" type="button" [attr.aria-label]="i18n.t('topbar.settings')" [title]="i18n.t('topbar.settings')" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
                <path d="m19 12 .8-2.1-2-3.4-2.3.4a7 7 0 0 0-1.6-.9L13 4h-4l-.9 2a7 7 0 0 0-1.6.9l-2.3-.4-2 3.4L3 12l-.8 2.1 2 3.4 2.3-.4a7 7 0 0 0 1.6.9l.9 2h4l.9-2a7 7 0 0 0 1.6-.9l2.3.4 2-3.4L19 12Z" />
              </svg>
            </button>
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

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }

    document.documentElement.requestFullscreen?.();
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
