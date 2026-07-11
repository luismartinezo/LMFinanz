import { Component } from '@angular/core';

@Component({
  selector: 'app-transactions-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Transactions</p>
          <h2>Movimientos</h2>
          <p>Ingresos, gastos y transferencias entre cuentas.</p>
        </div>
        <button type="button">New movement</button>
      </section>

      <section class="panel">
        <div class="panel-title">
          <h3>Transaction ledger</h3>
          <span>Daily control</span>
        </div>
        <div class="table-empty">
          <span>Date</span>
          <span>Category</span>
          <span>Account</span>
          <span>Amount</span>
        </div>
      </section>
    </main>
  `
})
export class TransactionsPage {}
