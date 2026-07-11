import { Component } from '@angular/core';

@Component({
  selector: 'app-savings-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Savings</p>
          <h2>Metas de ahorro</h2>
          <p>Objetivo, progreso y fecha limite para cada meta.</p>
        </div>
        <button type="button">New goal</button>
      </section>

      <section class="panel">
        <div class="panel-title">
          <h3>Goal progress</h3>
          <span>0 active goals</span>
        </div>
        <div class="empty-state">
          <strong>No savings goals yet</strong>
          <p>Las metas apareceran aqui con avance porcentual y deadline.</p>
        </div>
      </section>
    </main>
  `
})
export class SavingsPage {}
