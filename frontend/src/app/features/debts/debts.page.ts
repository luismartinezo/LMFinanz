import { Component } from '@angular/core';

@Component({
  selector: 'app-debts-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Debts</p>
          <h2>Deudas</h2>
          <p>Total, tasa de interes, cuotas, fechas de pago y saldo pendiente.</p>
        </div>
        <button type="button">New debt</button>
      </section>

      <section class="module-grid">
        <article class="module-card">
          <span>Total debt</span>
          <strong>EUR 0.00</strong>
          <p>Saldo consolidado por moneda.</p>
        </article>
        <article class="module-card">
          <span>Next due date</span>
          <strong>-</strong>
          <p>Proxima cuota pendiente.</p>
        </article>
        <article class="module-card">
          <span>Installments</span>
          <strong>0</strong>
          <p>Cuotas activas por pagar.</p>
        </article>
      </section>
    </main>
  `
})
export class DebtsPage {}
