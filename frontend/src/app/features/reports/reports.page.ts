import { Component } from '@angular/core';

@Component({
  selector: 'app-reports-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Reports</p>
          <h2>Reportes</h2>
          <p>Analisis diario, mensual y anual por moneda y pais.</p>
        </div>
        <button type="button">Export</button>
      </section>

      <section class="module-grid">
        <article class="module-card">
          <span>Daily</span>
          <strong>0</strong>
          <p>Resumen operativo por dia.</p>
        </article>
        <article class="module-card">
          <span>Monthly</span>
          <strong>0</strong>
          <p>Balance mensual por categoria.</p>
        </article>
        <article class="module-card">
          <span>Yearly</span>
          <strong>0</strong>
          <p>Tendencias por moneda y pais.</p>
        </article>
      </section>
    </main>
  `
})
export class ReportsPage {}
