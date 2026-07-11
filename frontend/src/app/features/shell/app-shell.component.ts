import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span>LM</span>
          <strong>LMFinanz</strong>
        </div>

        <nav aria-label="Main navigation">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
          <a routerLink="/accounts" routerLinkActive="active">Accounts</a>
          <a routerLink="/transactions" routerLinkActive="active">Transactions</a>
          <a routerLink="/debts" routerLinkActive="active">Debts</a>
          <a routerLink="/savings" routerLinkActive="active">Savings</a>
          <a routerLink="/assets" routerLinkActive="active">Assets</a>
          <a routerLink="/reports" routerLinkActive="active">Reports</a>
        </nav>
      </aside>

      <section class="workspace">
        <header class="topbar">
          <div>
            <strong>{{ auth.user()?.fullName }}</strong>
            <span>{{ auth.user()?.email }}</span>
          </div>
          <button type="button" (click)="logout()">Logout</button>
        </header>

        <router-outlet />
      </section>
    </div>
  `
})
export class AppShellComponent {
  constructor(
    readonly auth: AuthService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
