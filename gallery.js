// Renderiza pestañas + barra de búsqueda + grid en CUADRÍCULA
function renderGalleryUI() {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = `
    <!-- Barra de búsqueda -->
    <div style="grid-column:1/-1; margin-bottom:15px;">
      <input type="text" id="searchInput" placeholder="Buscar por nombre..." 
        style="width:100%; padding:10px; font-size:1rem; border-radius:8px; border:1px solid #cbd5e0; background:rgba(30,30,50,0.6); color:#e2e8f0;">
    </div>

    <!-- Pestañas de categorías -->
    <div style="grid-column:1/-1; display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; justify-content:center;">
      <button class="category-tab active" data-cat="todos">Todos</button>
      <button class="category-tab" data-cat="logos">Logos</button>
      <button class="category-tab" data-cat="frases">Frases</button>
      <button class="category-tab" data-cat="fondos">Fondos</button>
      <!-- Agrega más aquí si quieres -->
    </div>

    <!-- Grid de diseños EN CUADRÍCULA -->
    <div id="designsContainer" style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 20px;
      padding: 10px;
    "></div>
  `;

  // Estilo para pestañas (más bonito y centrado)
  const style = document.createElement('style');
  style.textContent = `
    .category-tab {
      padding: 10px 20px;
      border: none;
      border-radius: 30px;
      background: rgba(66,153,225,0.25);
      color: #e2e8f0;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      min-width: 100px;
      text-align: center;
    }
    .category-tab:hover {
      background: rgba(66,153,225,0.5);
      transform: scale(1.05);
    }
    .category-tab.active {
      background: #4299e1;
      color: white;
      box-shadow: 0 0 15px rgba(66,153,225,0.6);
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);

  // Eventos de pestañas y búsqueda (sin cambios)
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      filterAndRender(cat, document.getElementById('searchInput').value);
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const activeCat = document.querySelector('.category-tab.active')?.dataset.cat || 'todos';
    filterAndRender(activeCat, e.target.value);
  });
}