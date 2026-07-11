import { Component } from '@angular/core';

@Component({
  selector: 'app-accounts-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Accounts</p>
          <h2>Cuentas</h2>
          <p>Bank accounts, cash accounts y credit cards por moneda y pais.</p>
        </div>
        <button type="button">New account</button>
      </section>

      <section class="module-grid">
        <article class="module-card">
          <span>Bank accounts</span>
          <strong>0</strong>
          <p>EUR, COP y USD con balance disponible.</p>
        </article>
        <article class="module-card">
          <span>Cash accounts</span>
          <strong>0</strong>
          <p>Efectivo por pais para gastos diarios.</p>
        </article>
        <article class="module-card">
          <span>Credit cards</span>
          <strong>0</strong>
          <p>Cupo, deuda y fecha de pago.</p>
        </article>
      </section>
    </main>
  `
})
export class AccountsPage {}
