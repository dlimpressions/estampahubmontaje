// gallery.js - Galería con estilo futurista, paginación, búsqueda y categorías
console.log("gallery.js cargado - versión futurista completa");

let allDesigns = [];
let currentPage = 1;
const itemsPerPage = 20;
let currentCategoria = 'todos';

window.addEventListener('load', function() {
  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      galleryOverlay.style.display = 'flex';
      cargarGaleriaDesdeSheets();
    });
  }

  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      galleryOverlay.style.display = 'none';
    });
  }
});

async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">Cargando diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    if (!response.ok) throw new Error('No se pudo conectar');

    allDesigns = await response.json();

    // Interfaz futurista
    grid.innerHTML = `
      <!-- Barra de búsqueda futurista -->
      <div style="grid-column:1/-1; margin-bottom:20px;">
        <input type="text" id="searchInput" placeholder="Buscar por nombre o categoría..." 
          style="width:100%; padding:12px; font-size:1rem; border-radius:12px; border:1px solid rgba(66,153,225,0.4); background:rgba(255,255,255,0.08); color:#e2e8f0; box-shadow:inset 0 0 10px rgba(66,153,225,0.2); outline:none;">
      </div>

      <!-- Pestañas neón -->
      <div style="grid-column:1/-1; display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; justify-content:center;">
        <button class="cat-tab active" data-cat="todos">Todos</button>
        <button class="cat-tab" data-cat="logos">Logos</button>
        <button class="cat-tab" data-cat="frases">Frases</button>
        <button class="cat-tab" data-cat="fondos">Fondos</button>
      </div>

      <!-- Grid -->
      <div id="designsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px,1fr)); gap:20px; padding:10px;"></div>

      <!-- Paginación futurista -->
      <div id="pagination" style="grid-column:1/-1; text-align:center; margin-top:20px;"></div>
    `;

    // Estilos futurista
    const style = document.createElement('style');
    style.textContent = `
      .cat-tab {
        padding: 10px 20px;
        border: none;
        border-radius: 30px;
        background: linear-gradient(135deg, #4299e1, #3182ce);
        color: white;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(66,153,225,0.5);
        transition: all 0.3s ease;
      }
      .cat-tab:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(66,153,225,0.7); }
      .cat-tab.active { background: linear-gradient(135deg, #4299e1, #3182ce); box-shadow: 0 8px 30px rgba(66,153,225,0.7); }
      .design-item { text-align:center; cursor:pointer; padding:10px; border-radius:8px; background:rgba(30,30,60,0.7); transition:all 0.2s; }
      .design-item:hover { background:rgba(66,153,225,0.3); transform:scale(1.05); }
      .design-name { font-weight:bold !important; color:#e2e8f0; margin-top:8px; font-size:1rem; display:block; }
      .page-btn { padding:8px 16px; border:none; border-radius:8px; background:linear-gradient(135deg,#4299e1,#3182ce); color:white; font-weight:600; cursor:pointer; box-shadow:0 4px 15px rgba(66,153,225,0.5); transition:all 0.3s; margin:0 5px; }
      .page-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(66,153,225,0.7); }
      .page-btn.disabled { background:#4a5568; cursor:not-allowed; box-shadow:none; }
    `;
    document.head.appendChild(style);

    // Eventos
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategoria = tab.dataset.cat;
        currentPage = 1;
        filterAndRender(currentCategoria, document.getElementById('searchInput').value);
      });
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
      currentPage = 1;
      filterAndRender(currentCategoria, e.target.value);
    });

    filterAndRender('todos', '');

  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
      Error al cargar: ${err.message}
    </div>`;
  }
}

function filterAndRender(categoria = 'todos', busqueda = '') {
  const container = document.getElementById('designsContainer');
  container.innerHTML = '';

  const filtrados = allDesigns.filter(d => {
    const catValor = (d.categoria || '').toLowerCase();
    const catMatch = (categoria === 'todos') || catValor.includes(categoria);
    const nameMatch = !busqueda || (d.nombre || '').toLowerCase().includes(busqueda.toLowerCase());
    return catMatch && nameMatch;
  });

  const start = (currentPage - 1) * 20;
  const end = start + 20;
  const pageDesigns = filtrados.slice(start, end);

  if (pageDesigns.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No hay diseños</div>';
  }

  pageDesigns.forEach(d => {
    const item = document.createElement('div');
    item.style.cursor = 'pointer';
    item.style.textAlign = 'center';
    item.style.padding = '10px';
    item.style.borderRadius = '8px';
    item.style.background = 'rgba(30,30,60,0.7)';
    item.style.transition = 'background 0.2s';

    item.innerHTML = `
      <div style="width:120px; height:120px; margin:auto; background:#222; border-radius:6px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
        <img src="${d.url}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
      </div>
      <small style="display:block; margin-top:8px; color:#e2e8f0; font-weight:bold;">${d.nombre || 'Sin nombre'}</small>
      ${d.categoria ? `<small style="color:#a0aec0;">(${d.categoria})</small>` : ''}
    `;

    item.addEventListener('click', () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const id = 'sheet-' + Date.now();
        const design = new Design(id, img);
        const maxW = canvas.width - 20;
        const maxH = canvas.height - 20;
        design.scale = Math.min(1, Math.min(maxW / design.width, maxH / design.height));
        designs.push(design);
        selectedDesignId = id;
        updateDesignsList();
        updateControls();
        drawCanvas();
        showMessage(`¡Diseño cargado!`, 'success', 3000);
        document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      };
      img.src = d.url;
    });

    container.appendChild(item);
  });

  // Paginación futurista
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = 'Anterior';
  prev.disabled = currentPage === 1;
  prev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      filterAndRender(currentCategoria, document.getElementById('searchInput').value);
    }
  });

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Siguiente';
  next.disabled = end >= filtrados.length;
  next.addEventListener('click', () => {
    if (end < filtrados.length) {
      currentPage++;
      filterAndRender(currentCategoria, document.getElementById('searchInput').value);
    }
  });

  pagination.appendChild(prev);
  pagination.appendChild(next);
}