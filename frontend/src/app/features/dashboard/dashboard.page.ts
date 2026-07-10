import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  template: `
    <main class="dashboard">
      <section>
        <p class="eyebrow">Overview</p>
        <h2>Tu centro financiero</h2>
        <p>La base Angular ya esta conectada para autenticacion, rutas protegidas y consumo del backend.</p>
      </section>

      <div class="metric-grid">
        <article>
          <span>Accounts</span>
          <strong>Listo para conectar</strong>
        </article>
        <article>
          <span>Transactions</span>
          <strong>JWT interceptor activo</strong>
        </article>
        <article>
          <span>Reports</span>
          <strong>Rutas protegidas</strong>
        </article>
      </div>
    </main>
  `
})
export class DashboardPage {}
