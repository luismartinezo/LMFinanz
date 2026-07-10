import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet],
  template: `
    <div class="shell">
      <aside>
        <h1>LMFinanz</h1>
        <nav>
          <a class="active">Dashboard</a>
          <a>Accounts</a>
          <a>Transactions</a>
          <a>Reports</a>
        </nav>
      </aside>

      <section class="workspace">
        <header>
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
