// gallery.js - Galería REAL desde Google Sheets + CUADRÍCULA + BARRA DE BÚSQUEDA
// Busca por nombre Y por categoría (sin pestañas por ahora)
console.log("gallery.js cargado - versión con barra de búsqueda por nombre y categoría");

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
  if (!grid) {
    console.log("ERROR: No se encontró el grid");
    return;
  }

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">Cargando tus diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');
    if (!response.ok) {
      throw new Error('No se pudo conectar con Google Sheets');
    }

    allDesigns = await response.json();

    // Interfaz simple: solo barra de búsqueda + cuadrícula
    grid.innerHTML = `
      <!-- Barra de búsqueda (filtra por nombre y categoría) -->
      <div style="grid-column:1/-1; margin-bottom:20px;">
        <input type="text" id="searchInput" placeholder="Buscar por nombre o categoría..." 
          style="width:100%; padding:12px; font-size:1rem; border-radius:10px; border:1px solid #4299e1; background:rgba(30,30,50,0.8); color:#e2e8f0;">
      </div>

      <!-- Grid en CUADRÍCULA (tu estilo que funcionaba) -->
      <div id="designsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px,1fr)); gap:20px;"></div>
    `;

    // Estilos para nombres en negrita
    const style = document.createElement('style');
    style.textContent = `
      .design-item { text-align:center; cursor:pointer; padding:10px; border-radius:8px; transition:background 0.2s; }
      .design-item:hover { background:#e2e8f0; }
      .design-name { font-weight:bold !important; color:#333; margin-top:8px; font-size:1rem; display:block; }
    `;
    document.head.appendChild(style);

    // Evento de búsqueda (filtra mientras escribes)
    document.getElementById('searchInput').addEventListener('input', (e) => {
      filterAndRender(e.target.value);
    });

    // Mostramos todos al inicio
    filterAndRender('');

  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
      Error al cargar: ${err.message}
    </div>`;
  }
}

function filterAndRender(busqueda = '') {
  const container = document.getElementById('designsContainer');
  container.innerHTML = '';

  const busquedaLower = busqueda.toLowerCase().trim();

  const filtrados = allDesigns.filter(d => {
    const nombre = (d.Nombre || d.nombre || '').toLowerCase();
    const categoria = (d.Categoria || d.categoria || '').toLowerCase();
    return !busquedaLower || nombre.includes(busquedaLower) || categoria.includes(busquedaLower);
  });

  if (filtrados.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No hay diseños que coincidan</div>';
    return;
  }

  filtrados.forEach(d => {
    const item = document.createElement('div');
    item.className = 'design-item';
    item.innerHTML = `
      <div style="width:120px; height:120px; margin:auto; background:#eee; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        <img src="${d.URL || d.url}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
      </div>
      <div class="design-name">${d.Nombre || d.nombre || 'Sin nombre'}</div>
      ${d.Categoria || d.categoria ? `<small style="color:#666;">(${d.Categoria || d.categoria})</small>` : ''}
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
      img.src = d.URL || d.url;
    });

    container.appendChild(item);
  });
}