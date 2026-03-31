// gallery.js - Versión estable + MULTI-SELECCIÓN
console.log("✅ gallery.js v7 - Multi-selección agregada al código estable");

let allDesigns = [];
let selectedGalleryItems = new Set();   // ← Multi-selección
let currentPage = 1;
const itemsPerPage = 20;

window.addEventListener('load', function() {
  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      galleryOverlay.style.display = 'flex';
      selectedGalleryItems.clear();
      cargarGaleriaDesdeSheets();
    });
  }
  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      galleryOverlay.style.display = 'none';
      selectedGalleryItems.clear();
    });
  }
});

async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = `
    <div style="grid-column:1/-1; text-align:center; padding:60px; color:#64748b;">
      Cargando miniaturas...
    </div>`;

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    allDesigns = await response.json();

    // Barra de búsqueda
    let searchContainer = document.getElementById('searchContainer');
    if (!searchContainer) {
      searchContainer = document.createElement('div');
      searchContainer.id = 'searchContainer';
      grid.parentNode.insertBefore(searchContainer, grid);
    }
    searchContainer.innerHTML = `
      <input type="text" id="searchInput" placeholder="🔍 Buscar diseño..." 
        style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(14,165,233,0.35);
        background:rgba(14,165,233,0.07);color:#e2e8f0;outline:none;">`;

    document.getElementById('searchInput').addEventListener('input', e => {
  currentPage = 1;  // ← reset página al buscar
  filterAndRender(e.target.value);
});

    filterAndRender('');
  } catch (err) {
    grid.innerHTML = `<div style="color:#f43f5e;padding:40px;text-align:center;">❌ Error al cargar</div>`;
  }
}



function filterAndRender(busqueda = '') {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = '';

  const term = busqueda.toLowerCase().trim();
  const filtrados = allDesigns.filter(d => {
    const nombre = (d.nombre || d.Nombre || '').toLowerCase();
    const cat    = (d.categoria || d.Categoria || '').toLowerCase();
    return !term || nombre.includes(term) || cat.includes(term);
  });

  const totalPages = Math.ceil(filtrados.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const pagina = filtrados.slice(start, start + itemsPerPage);

  if(pagina.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#64748b;padding:60px;">Sin resultados</div>`;
    renderPagination(totalPages, busqueda);
    return;
  }

  pagina.forEach(d => {
    const url = d.url;
    const isSel = selectedGalleryItems.has(url);
    const item = document.createElement('div');
    item.style.cssText = `
      cursor:pointer;padding:8px;border-radius:8px;position:relative;
      border:2px solid ${isSel?'#0ea5e9':'rgba(14,165,233,0.15)'};
      background:${isSel?'rgba(14,165,233,0.12)':'rgba(14,165,233,0.03)'};
      transition:all 0.18s;
    `;
    item.innerHTML = `
      <div style="width:100%;aspect-ratio:1/1;border-radius:6px;overflow:hidden;background:#111827;">
        <img src="${url}" loading="lazy" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .35s;">
        <div class="gal-check" style="position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;border:2px solid #0ea5e9;background:${isSel?'#0ea5e9':'transparent'};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;z-index:2;">${isSel?'✓':''}</div>
      </div>
      <small style="display:block;margin-top:5px;color:#94a3b8;font-size:0.66rem;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.nombre||'Sin nombre'}</small>`;

    const img = item.querySelector('img');
    img.onload = () => img.style.opacity = '1';
    img.onerror = () => { img.style.opacity='1'; img.src=''; };

    item.addEventListener('click', () => {
      selectedGalleryItems.has(url) ? selectedGalleryItems.delete(url) : selectedGalleryItems.add(url);
      filterAndRender(document.getElementById('searchInput')?.value || '');
      updateMultiSelectBar();
    });
    item.addEventListener('dblclick', e => { e.stopImmediatePropagation(); loadSingleDesign(url); });
    grid.appendChild(item);
  });

  renderPagination(totalPages, busqueda);
}

function renderPagination(totalPages, busqueda) {
  let pag = document.getElementById('pagination');
  if(!pag) return;
  pag.innerHTML = '';
  if(totalPages <= 1) return;

  const bs = `padding:6px 14px;border-radius:6px;margin:0 4px;cursor:pointer;
    font-size:0.78rem;border:1px solid rgba(14,165,233,0.35);
    background:rgba(14,165,233,0.08);color:#0ea5e9;`;

  if(currentPage > 1){
    const b = document.createElement('button');
    b.style.cssText = bs; b.textContent = '← Anterior';
    b.onclick = () => { currentPage--; filterAndRender(busqueda); document.getElementById('imgbb-designs-grid')?.scrollIntoView({behavior:'smooth',block:'start'}); };
    pag.appendChild(b);
  }

  const info = document.createElement('span');
  info.style.cssText = 'font-size:0.72rem;color:#475569;margin:0 10px;';
  info.textContent = `Pág. ${currentPage} / ${totalPages}`;
  pag.appendChild(info);

  if(currentPage < totalPages){
    const b = document.createElement('button');
    b.style.cssText = bs; b.textContent = 'Siguiente →';
    b.onclick = () => { currentPage++; filterAndRender(busqueda); document.getElementById('imgbb-designs-grid')?.scrollIntoView({behavior:'smooth',block:'start'}); };
    pag.appendChild(b);
  }
}

function updateMultiSelectBar() {
  let bar = document.getElementById('gallery-multibar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'gallery-multibar';
    bar.style.cssText = 'margin:12px 0; min-height:34px; display:flex; align-items:center; gap:12px;';
    const grid = document.getElementById('imgbb-designs-grid');
    grid.parentNode.insertBefore(bar, grid);
  }

  const count = selectedGalleryItems.size;
  if (count === 0) {
    bar.innerHTML = `<span style="color:#64748b;">Clic = seleccionar · Doble clic = cargar uno</span>`;
    return;
  }

  bar.innerHTML = `
    <span style="color:#0ea5e9;font-weight:600;">${count} seleccionado(s)</span>
    <button id="load-selected-btn" style="padding:7px 18px;background:#0ea5e9;color:white;border:none;border-radius:6px;cursor:pointer;">⬆️ Cargar seleccionados</button>
    <button id="clear-selected-btn" style="padding:7px 14px;background:transparent;border:1px solid #f43f5e;color:#f43f5e;border-radius:6px;cursor:pointer;">Limpiar</button>`;

  document.getElementById('load-selected-btn').onclick = loadSelectedDesigns;
  document.getElementById('clear-selected-btn').onclick = () => {
    selectedGalleryItems.clear();
    filterAndRender(document.getElementById('searchInput')?.value || '');
    updateMultiSelectBar();
  };
}

function loadSingleDesign(url) {
  const msg = showMessage('Cargando diseño al canvas...', 'loading', 0);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const trimmed = trimTransparentPixels(img);
    const id = 'gal-' + Date.now();
    const design = new Design(id, trimmed);
    const maxW = canvas.width - 40;
    const maxH = canvas.height - 40;
    design.scale = Math.min(1, Math.min(maxW / design.width, maxH / design.height));

    designs.push(design);
    window.designs = designs;
    selectedDesignId = id;

    updateDesignsList();
    updateControls();
    drawCanvas();

    msg.remove();
    showMessage('✅ Diseño cargado', 'success', 1800);
    document.getElementById('imgbb-gallery-overlay').style.display = 'none';
  };
  img.onerror = () => { msg.remove(); showMessage('Error al cargar', 'error'); };
  img.src = url;
}

async function loadSelectedDesigns() {
  const urls = Array.from(selectedGalleryItems);
  if (!urls.length) return;

  const msg = showMessage(`Cargando ${urls.length} diseño(s)...`, 'loading', 0);
  let ok = 0;

  for (const url of urls) {
    await new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const trimmed = trimTransparentPixels(img);
        const id = 'gal-' + Date.now();
        const design = new Design(id, trimmed);
        const maxW = canvas.width - 40;
        const maxH = canvas.height - 40;
        design.scale = Math.min(1, Math.min(maxW / design.width, maxH / design.height));
        designs.push(design);
        ok++;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  window.designs = designs;
  updateDesignsList();
  updateControls();
  drawCanvas();

  msg.remove();
  showMessage(`✅ ${ok} diseño(s) cargados`, 'success', 2200);
  document.getElementById('imgbb-gallery-overlay').style.display = 'none';
  selectedGalleryItems.clear();
}