// gallery.js - Galería futurista con recorte de transparencia y carga optimizada
console.log("gallery.js cargado - con trimTransparency + lazy optimizado");

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

  grid.innerHTML = `
    <div style="grid-column:1/-1; text-align:center; padding:40px;">
      <div style="display:inline-block; width:36px; height:36px; border:3px solid rgba(14,165,233,0.3);
        border-top-color:#0ea5e9; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
      <p style="color:#94a3b8; font-family:monospace; font-size:0.82rem; margin-top:12px;">Cargando diseños...</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    if (!response.ok) throw new Error('No se pudo conectar');

    allDesigns = await response.json();

    const oldSearch = document.getElementById('searchContainer');
    if (oldSearch) oldSearch.innerHTML = '';

    const searchContainer = document.getElementById('searchContainer') || document.createElement('div');
    searchContainer.id = 'searchContainer';
    searchContainer.style.marginBottom = '16px';
    searchContainer.innerHTML = `
      <input type="text" id="searchInput" placeholder="🔍 Buscar por nombre o categoría..."
        style="width:100%; padding:10px 14px; font-size:0.9rem; border-radius:8px;
        border:1px solid rgba(14,165,233,0.35); background:rgba(14,165,233,0.07);
        color:#e2e8f0; outline:none; font-family:monospace;
        transition:border-color 0.2s, box-shadow 0.2s;"
        onfocus="this.style.borderColor='#0ea5e9';this.style.boxShadow='0 0 0 2px rgba(14,165,233,0.2)'"
        onblur="this.style.borderColor='rgba(14,165,233,0.35)';this.style.boxShadow='none'">
    `;
    if (!document.getElementById('searchContainer')) {
      grid.parentNode.insertBefore(searchContainer, grid);
    }

    currentPage = 1;
    currentCategoria = 'todos';
    filterAndRender(currentCategoria, '');

    document.getElementById('searchInput').addEventListener('input', (e) => {
      currentPage = 1;
      filterAndRender(currentCategoria, e.target.value);
    });

  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#f43f5e; padding:40px; font-family:monospace; font-size:0.82rem;">
      ❌ Error al cargar: ${err.message}
    </div>`;
  }
}

function filterAndRender(categoria = 'todos', busqueda = '') {
  const container = document.getElementById('imgbb-designs-grid');
  if (!container) return;

  container.innerHTML = '';

  const busquedaLower = busqueda.toLowerCase().trim();

  const filtrados = allDesigns.filter(d => {
    const nombre = (d.nombre || d.Nombre || '').toLowerCase();
    const categoriaValor = (d.categoria || d.Categoria || '').toLowerCase();
    return !busquedaLower || nombre.includes(busquedaLower) || categoriaValor.includes(busquedaLower);
  });

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageDesigns = filtrados.slice(start, end);

  if (pageDesigns.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#f43f5e; padding:40px; font-family:monospace; font-size:0.82rem;">Sin resultados</div>';
    return;
  }

  pageDesigns.forEach(d => {
    const item = document.createElement('div');
    item.style.cssText = `
      cursor:pointer; text-align:center; padding:8px;
      border-radius:8px; border:1px solid rgba(14,165,233,0.15);
      background:rgba(14,165,233,0.04);
      transition:all 0.18s; position:relative;
    `;
    item.onmouseenter = () => {
      item.style.background = 'rgba(14,165,233,0.1)';
      item.style.borderColor = 'rgba(14,165,233,0.5)';
      item.style.transform = 'translateY(-2px)';
      item.style.boxShadow = '0 6px 20px rgba(14,165,233,0.15)';
    };
    item.onmouseleave = () => {
      item.style.background = 'rgba(14,165,233,0.04)';
      item.style.borderColor = 'rgba(14,165,233,0.15)';
      item.style.transform = 'translateY(0)';
      item.style.boxShadow = 'none';
    };

    // Skeleton placeholder mientras carga
    item.innerHTML = `
      <div id="thumb-wrap-${d.url.slice(-10).replace(/\W/g,'')}" style="
        width:110px; height:110px; margin:auto; border-radius:6px; overflow:hidden;
        background: linear-gradient(90deg, #0f1220 25%, #141828 50%, #0f1220 75%);
        background-size:200% 100%;
        animation:shimmer 1.2s infinite;
        display:flex; align-items:center; justify-content:center;
      ">
        <style>@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>
      </div>
      <small style="display:block; margin-top:6px; color:#e2e8f0; font-weight:600; font-size:0.72rem; font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:120px;">${d.nombre || 'Sin nombre'}</small>
      ${d.categoria ? `<small style="color:#64748b; font-size:0.62rem; font-family:monospace;">${d.categoria}</small>` : ''}
    `;

    container.appendChild(item);

    // Carga la imagen real con IntersectionObserver (solo cuando es visible)
    const wrapId = `thumb-wrap-${d.url.slice(-10).replace(/\W/g,'')}`;
    const wrap = item.querySelector(`#${wrapId}`);

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.disconnect();

        const img = document.createElement('img');
        img.src = d.url;
        img.crossOrigin = 'anonymous';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.3s;';
        img.onload = () => {
          wrap.style.animation = 'none';
          wrap.style.background = '#111';
          wrap.innerHTML = '';
          wrap.appendChild(img);
          img.style.opacity = '1';
        };
        img.onerror = () => {
          wrap.style.animation = 'none';
          wrap.innerHTML = '<span style="color:#f43f5e;font-size:0.65rem;font-family:monospace;">Error</span>';
        };
      });
    }, { rootMargin: '100px' });

    observer.observe(wrap);

    // Click: cargar al canvas con recorte de transparencia
    item.addEventListener('click', () => {
      const fullImg = new Image();
      fullImg.crossOrigin = 'anonymous';

      const loadingMsg = showMessage('Cargando diseño...', 'loading', 0);

      fullImg.onload = () => {
        try {
          // Aplicar recorte de transparencia
          const trimmed = trimTransparentPixels(fullImg);
          const id = 'sheet-' + Date.now();
          const design = new Design(id, trimmed);
          const maxW = canvas.width - 20;
          const maxH = canvas.height - 20;
          design.scale = Math.min(1, Math.min(maxW / design.width, maxH / design.height));
          designs.push(design);
          syncDesignsRef();
          selectedDesignId = id;
          updateDesignsList();
          updateControls();
          drawCanvas();
          loadingMsg.remove();
          showMessage('✅ Diseño cargado sin transparencia', 'success', 3000);
          document.getElementById('imgbb-gallery-overlay').style.display = 'none';
        } catch(err) {
          loadingMsg.remove();
          showMessage('Error al procesar el diseño', 'error', 3000);
        }
      };

      fullImg.onerror = () => {
        loadingMsg.remove();
        showMessage('No se pudo cargar la imagen', 'error', 3000);
      };

      fullImg.src = d.url;
    });
  });

  // Paginación
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  pagination.innerHTML = '';

  const btnStyle = `
    padding:7px 16px; border-radius:6px;
    background:linear-gradient(135deg,rgba(14,165,233,0.2),rgba(99,102,241,0.15));
    color:#0ea5e9; border:1px solid rgba(14,165,233,0.35);
    margin:0 4px; cursor:pointer; font-family:monospace; font-size:0.78rem;
    transition:all 0.15s;
  `;

  const info = document.createElement('span');
  info.style.cssText = 'font-family:monospace;font-size:0.72rem;color:#64748b;margin:0 10px;';
  info.textContent = `Página ${currentPage} · ${filtrados.length} diseños`;

  if (currentPage > 1) {
    const prev = document.createElement('button');
    prev.textContent = '← Anterior';
    prev.style.cssText = btnStyle;
    prev.onmouseenter = () => prev.style.background = 'rgba(14,165,233,0.25)';
    prev.onmouseleave = () => prev.style.background = 'linear-gradient(135deg,rgba(14,165,233,0.2),rgba(99,102,241,0.15))';
    prev.addEventListener('click', () => {
      currentPage--;
      filterAndRender(currentCategoria, document.getElementById('searchInput')?.value || '');
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    pagination.appendChild(prev);
  }

  pagination.appendChild(info);

  if (end < filtrados.length) {
    const next = document.createElement('button');
    next.textContent = 'Siguiente →';
    next.style.cssText = btnStyle;
    next.onmouseenter = () => next.style.background = 'rgba(14,165,233,0.25)';
    next.onmouseleave = () => next.style.background = 'linear-gradient(135deg,rgba(14,165,233,0.2),rgba(99,102,241,0.15))';
    next.addEventListener('click', () => {
      currentPage++;
      filterAndRender(currentCategoria, document.getElementById('searchInput')?.value || '');
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    pagination.appendChild(next);
  }
}