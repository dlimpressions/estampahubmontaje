// gallery.js - Galería futurista con cuadrícula, búsqueda, categorías y paginación
console.log("gallery.js cargado - versión final sin error grid");

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
  if (!grid) {
    console.log("ERROR: No se encontró el grid");
    return;
  }

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">Cargando diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    if (!response.ok) throw new Error('No se pudo conectar');

    allDesigns = await response.json();

    // Limpiamos barra vieja
    const oldSearch = document.getElementById('searchContainer');
    if (oldSearch) oldSearch.remove();

    // Creamos barra de búsqueda separada
    const searchContainer = document.createElement('div');
    searchContainer.id = 'searchContainer';
    searchContainer.style.marginBottom = '20px';
    searchContainer.innerHTML = `
      <input type="text" id="searchInput" placeholder="Buscar por nombre o categoría..." 
        style="width:100%; padding:12px; font-size:1rem; border-radius:12px; border:1px solid rgba(66,153,225,0.4); background:rgba(255,255,255,0.08); color:#e2e8f0; box-shadow:inset 0 0 10px rgba(66,153,225,0.2); outline:none;">
    `;
    grid.parentNode.insertBefore(searchContainer, grid);

    currentPage = 1;
    currentCategoria = 'todos';
    filterAndRender(currentCategoria, '');

    document.getElementById('searchInput').addEventListener('input', (e) => {
      currentPage = 1;
      filterAndRender(currentCategoria, e.target.value);
    });

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
    const nombre = (d.nombre || d.Nombre || '').toLowerCase();
    const categoriaValor = (d.categoria || d.Categoria || '').toLowerCase();
    const catMatch = (categoria === 'todos') || categoriaValor.includes(categoria.toLowerCase());
    const nameMatch = !busqueda || nombre.includes(busqueda.toLowerCase());
    return catMatch && nameMatch;
  });

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
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

  // Paginación futurista (sin cambios)
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (currentPage > 1) {
    const prev = document.createElement('button');
    prev.textContent = 'Anterior';
    prev.style.padding = '8px 16px';
    prev.style.borderRadius = '8px';
    prev.style.background = 'linear-gradient(135deg, #4299e1, #3182ce)';
    prev.style.color = 'white';
    prev.style.border = 'none';
    prev.style.margin = '0 5px';
    prev.style.cursor = 'pointer';
    prev.style.boxShadow = '0 4px 15px rgba(66,153,225,0.5)';
    prev.addEventListener('click', () => {
      currentPage--;
      filterAndRender(currentCategoria, document.getElementById('searchInput').value);
    });
    pagination.appendChild(prev);
  }

  if (end < filtrados.length) {
    const next = document.createElement('button');
    next.textContent = 'Siguiente';
    next.style.padding = '8px 16px';
    next.style.borderRadius = '8px';
    next.style.background = 'linear-gradient(135deg, #4299e1, #3182ce)';
    next.style.color = 'white';
    next.style.border = 'none';
    next.style.margin = '0 5px';
    next.style.cursor = 'pointer';
    next.style.boxShadow = '0 4px 15px rgba(66,153,225,0.5)';
    next.addEventListener('click', () => {
      currentPage++;
      filterAndRender(currentCategoria, document.getElementById('searchInput').value);
    });
    pagination.appendChild(next);
  }
}