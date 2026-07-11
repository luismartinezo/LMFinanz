import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  template: `
    <main class="dashboard">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Overview</p>
          <h2>Tu centro financiero</h2>
          <p>Vista inicial para controlar cuentas, transacciones, deudas, metas, activos y reportes.</p>
        </div>
        <button type="button">New transaction</button>
      </section>

      <div class="metric-grid">
        <article>
          <span>Net worth</span>
          <strong>EUR 0.00</strong>
          <small>Across all countries</small>
        </article>
        <article>
          <span>Monthly balance</span>
          <strong>EUR 0.00</strong>
          <small>Income minus expenses</small>
        </article>
        <article>
          <span>Open debts</span>
          <strong>0</strong>
          <small>Pending installments</small>
        </article>
      </div>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-title">
            <h3>Recent activity</h3>
            <span>EUR · COP · USD</span>
          </div>
          <div class="empty-state">
            <strong>No transactions yet</strong>
            <p>Cuando conectemos el modulo de transacciones, aqui veras los ultimos movimientos.</p>
          </div>
        </article>

        <article class="panel">
          <div class="panel-title">
            <h3>Portfolio split</h3>
            <span>Germany · Colombia</span>
          </div>
          <ul class="status-list">
            <li><span>Bank accounts</span><strong>Ready</strong></li>
            <li><span>Cash accounts</span><strong>Ready</strong></li>
            <li><span>Credit cards</span><strong>Ready</strong></li>
            <li><span>Assets inventory</span><strong>Ready</strong></li>
          </ul>
        </article>
      </section>
    </main>
  `
})
export class DashboardPage {}
