// gallery.js - Galería REAL desde Google Sheets + CUADRÍCULA + barra de búsqueda separada
console.log("gallery.js cargado - barra de búsqueda fuera del grid para no romper cuadrícula");

let allDesigns = [];

window.addEventListener('load', function() {
  console.log("Página lista - inicializando galería");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const designsGrid = document.getElementById('imgbb-designs-grid');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      console.log("Botón clicado - cargando diseños");
      if (galleryOverlay) {
        galleryOverlay.style.display = 'flex';
        cargarGaleriaDesdeSheets();
      }
    });
  }

  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      if (galleryOverlay) {
        galleryOverlay.style.display = 'none';
      }
    });
  }
});

async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="text-align:center;color:#666;padding:40px;">Cargando diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    if (!response.ok) throw new Error('No se pudo conectar');

    allDesigns = await response.json();

    // Creamos la barra de búsqueda ARRIBA del grid (separada para no romper nada)
    const searchContainer = document.createElement('div');
    searchContainer.style.marginBottom = '20px';
    searchContainer.innerHTML = `
      <input type="text" id="searchInput" placeholder="Buscar por nombre o categoría..." 
        style="width:100%; padding:12px; font-size:1rem; border-radius:10px; border:1px solid #4299e1; background:rgba(30,30,50,0.8); color:#e2e8f0; outline:none;">
    `;
    grid.parentNode.insertBefore(searchContainer, grid); // La ponemos antes del grid

    // Limpiamos el grid y mostramos todos
    grid.innerHTML = '';
    renderDesigns(allDesigns);

    // Evento de búsqueda (filtra mientras escribes)
    document.getElementById('searchInput').addEventListener('input', (e) => {
      const busqueda = e.target.value.toLowerCase().trim();
      const filtrados = allDesigns.filter(d => {
        const nombre = (d.nombre || d.Nombre || '').toLowerCase();
        const categoria = (d.categoria || d.Categoria || '').toLowerCase();
        return !busqueda || nombre.includes(busqueda) || categoria.includes(busqueda);
      });
      renderDesigns(filtrados);
    });

  } catch (err) {
    grid.innerHTML = `<div style="text-align:center;color:#e53e3e;padding:40px;">
      Error al cargar: ${err.message}
    </div>`;
  }
}

function renderDesigns(disenos) {
  const container = document.getElementById('imgbb-designs-grid');
  container.innerHTML = '';

  if (disenos.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#e53e3e; padding:40px;">No hay diseños que coincidan</div>';
    return;
  }

  disenos.forEach(d => {
    const item = document.createElement('div');
    item.style.cursor = 'pointer';
    item.style.textAlign = 'center';
    item.style.padding = '10px';
    item.style.borderRadius = '8px';
    item.style.background = '#f8f9fa';
    item.style.transition = 'background 0.2s';

    item.innerHTML = `
      <div style="width:120px; height:120px; margin:auto; background:#eee; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        <img src="${d.url || d.URL || ''}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
      </div>
      <div style="font-weight:bold; color:#333; margin-top:8px; font-size:1rem;">${d.nombre || d.Nombre || 'Sin nombre'}</div>
      ${d.categoria || d.Categoria ? `<small style="color:#666;">(${d.categoria || d.Categoria})</small>` : ''}
    `;

    item.addEventListener('mouseover', () => item.style.background = '#e2e8f0');
    item.addEventListener('mouseout', () => item.style.background = '#f8f9fa');

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
      img.src = d.url || d.URL || '';
    });

    container.appendChild(item);
  });
}