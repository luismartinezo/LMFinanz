import { Component } from '@angular/core';

@Component({
  selector: 'app-assets-page',
  template: `
    <main class="module-page">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Assets</p>
          <h2>Inventario de activos</h2>
          <p>Casa, vehiculo, electronica, muebles y otros activos.</p>
        </div>
        <button type="button">New asset</button>
      </section>

      <section class="module-grid">
        <article class="module-card"><span>House</span><strong>0</strong><p>Propiedades registradas.</p></article>
        <article class="module-card"><span>Vehicle</span><strong>0</strong><p>Vehiculos y valor estimado.</p></article>
        <article class="module-card"><span>Other assets</span><strong>0</strong><p>Electronica, muebles y otros.</p></article>
      </section>
    </main>
  `
})
export class AssetsPage {}
