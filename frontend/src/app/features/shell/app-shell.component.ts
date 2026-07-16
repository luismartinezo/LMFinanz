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
                <path d="M12 3a6 6 0 0 0 9 7.4A9 9 0 1 1 12 3Z" />
              </svg>
            </button>
            <button class="topbar-icon" type="button" [attr.aria-label]="i18n.t('topbar.messages')" [title]="i18n.t('topbar.messages')" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4V6.5Z" />
                <path d="M8 9h8" />
                <path d="M8 12h5" />
              </svg>
              <span class="topbar-badge">5</span>
            </button>
            <button class="topbar-icon" type="button" [attr.aria-label]="i18n.t('topbar.notifications')" [title]="i18n.t('topbar.notifications')" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
                <path d="M10 21h4" />
              </svg>
              <span class="topbar-badge alert">3</span>
            </button>
            <button class="topbar-icon" type="button" (click)="toggleFullscreen()" [attr.aria-label]="i18n.t('topbar.fullscreen')" [title]="i18n.t('topbar.fullscreen')">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 3H4a1 1 0 0 0-1 1v4" />
                <path d="M16 3h4a1 1 0 0 1 1 1v4" />
                <path d="M21 16v4a1 1 0 0 1-1 1h-4" />
                <path d="M3 16v4a1 1 0 0 0 1 1h4" />
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
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l-2 3.4a1.8 1.8 0 0 0-2.3-.4 1.8 1.8 0 0 0-.9 1.6H9.4a1.8 1.8 0 0 0-.9-1.6 1.8 1.8 0 0 0-2.3.4l-2-3.4a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1V10a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l2-3.4a1.8 1.8 0 0 0 2.3.4 1.8 1.8 0 0 0 .9-1.6h5.2a1.8 1.8 0 0 0 .9 1.6 1.8 1.8 0 0 0 2.3-.4l2 3.4a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1v4a1.8 1.8 0 0 0-1.6 1Z" />
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
