// gallery.js - Galería REAL desde Google Sheets + CUADRÍCULA + paginación para rendimiento
console.log("gallery.js cargado - versión con paginación (20 por página)");

let allDesigns = [];
let currentPage = 1;
const itemsPerPage = 20;

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

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">Cargando tus diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    if (!response.ok) throw new Error('No se pudo conectar');

    allDesigns = await response.json();

    // Limpiamos y mostramos la primera página
    currentPage = 1;
    renderPage(currentPage);

  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
      Error al cargar: ${err.message}
    </div>`;
  }
}

// Renderiza una página específica (20 diseños)
function renderPage(page) {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = '';

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageDesigns = allDesigns.slice(start, end);

  if (pageDesigns.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No hay diseños en esta página</div>';
  }

  pageDesigns.forEach(d => {
    const item = document.createElement('div');
    item.style.cursor = 'pointer';
    item.style.textAlign = 'center';
    item.style.padding = '10px';
    item.style.borderRadius = '8px';
    item.style.background = '#f8f9fa';
    item.style.transition = 'background 0.2s';

    item.innerHTML = `
      <div style="width:120px; height:120px; margin:auto; background:#eee; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        <img src="${d.url}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
      </div>
      <small style="display:block; margin-top:8px; color:#333; font-weight:bold;">${d.nombre || 'Sin nombre'}</small>
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
        showMessage(`¡Diseño "${d.nombre}" cargado!`, 'success', 3000);
        document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      };
      img.src = d.url;
    });

    grid.appendChild(item);
  });

  // Agregamos botones de paginación abajo
  const pagination = document.createElement('div');
  pagination.style.gridColumn = '1/-1';
  pagination.style.textAlign = 'center';
  pagination.style.marginTop = '20px';

  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Anterior';
    prevBtn.style.marginRight = '10px';
    prevBtn.style.padding = '8px 16px';
    prevBtn.style.borderRadius = '8px';
    prevBtn.style.background = '#4299e1';
    prevBtn.style.color = 'white';
    prevBtn.style.cursor = 'pointer';
    prevBtn.addEventListener('click', () => {
      currentPage--;
      renderPage(currentPage);
    });
    pagination.appendChild(prevBtn);
  }

  if (end < allDesigns.length) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Siguiente';
    nextBtn.style.padding = '8px 16px';
    nextBtn.style.borderRadius = '8px';
    nextBtn.style.background = '#4299e1';
    nextBtn.style.color = 'white';
    nextBtn.style.cursor = 'pointer';
    nextBtn.addEventListener('click', () => {
      currentPage++;
      renderPage(currentPage);
    });
    pagination.appendChild(nextBtn);
  }

  grid.appendChild(pagination);
}