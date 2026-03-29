// gallery.js - Preview LQ + multi-selección + carga optimizada
console.log("gallery.js - preview LQ + multi-select v2");

let allDesigns = [];
let currentPage = 1;
const itemsPerPage = 24;
let currentCategoria = 'todos';
let selectedGalleryItems = new Set();

window.addEventListener('load', function() {
  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const openGalleryBtn  = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      galleryOverlay.style.display = 'flex';
      selectedGalleryItems.clear();
      updateMultiSelectBar();
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

/* ── Barra de multi-selección ── */
function updateMultiSelectBar() {
  const bar = document.getElementById('gallery-multibar');
  if (!bar) return;
  const count = selectedGalleryItems.size;
  if (count === 0) {
    bar.innerHTML = '<span style="color:#475569;font-family:monospace;font-size:0.74rem;">Clic = seleccionar · Doble clic = cargar uno · Botón = cargar todos los seleccionados</span>';
    return;
  }
  bar.innerHTML = `
    <span style="color:#0ea5e9;font-family:monospace;font-size:0.74rem;">✅ ${count} seleccionado(s)</span>
    <button id="gallery-load-selected" style="
      padding:5px 14px;border-radius:6px;border:1px solid rgba(14,165,233,0.5);
      background:rgba(14,165,233,0.15);color:#0ea5e9;font-family:monospace;
      font-size:0.74rem;cursor:pointer;margin-left:10px;">
      ⬆️ Cargar seleccionados
    </button>
    <button id="gallery-clear-selected" style="
      padding:5px 10px;border-radius:6px;border:1px solid rgba(244,63,94,0.35);
      background:rgba(244,63,94,0.07);color:#f43f5e;font-family:monospace;
      font-size:0.74rem;cursor:pointer;margin-left:6px;">
      ✕ Limpiar
    </button>`;
  document.getElementById('gallery-load-selected')?.addEventListener('click', loadSelectedDesigns);
  document.getElementById('gallery-clear-selected')?.addEventListener('click', () => {
    selectedGalleryItems.clear();
    updateMultiSelectBar();
    document.querySelectorAll('.gallery-item.gal-selected').forEach(el => applyItemStyle(el, false));
  });
}

/* ── Thumbnail a baja resolución ── */
function makeThumb(img, size) {
  size = size || 120;
  const r = Math.min(size / img.width, size / img.height);
  const w = Math.max(1, Math.round(img.width * r));
  const h = Math.max(1, Math.round(img.height * r));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/webp', 0.55);
}

/* ── Estilo de item seleccionado/no seleccionado ── */
function applyItemStyle(item, selected) {
  item.style.borderColor  = selected ? '#0ea5e9' : 'rgba(14,165,233,0.12)';
  item.style.background   = selected ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.03)';
  const check = item.querySelector('.gal-check');
  if (check) {
    check.style.background = selected ? '#0ea5e9' : 'transparent';
    check.textContent = selected ? '✓' : '';
  }
  if (selected) item.classList.add('gal-selected');
  else item.classList.remove('gal-selected');
}

/* ── Carga principal desde Sheets ── */
async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:40px;">
      <div style="display:inline-block;width:30px;height:30px;
        border:3px solid rgba(14,165,233,0.2);border-top-color:#0ea5e9;
        border-radius:50%;animation:galspin 0.7s linear infinite;"></div>
      <p style="color:#475569;font-family:monospace;font-size:0.74rem;margin-top:10px;">Cargando...</p>
    </div>
    <style>@keyframes galspin{to{transform:rotate(360deg)}}
    @keyframes galshimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>`;

  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    if (!res.ok) throw new Error('Error de conexión');
    allDesigns = await res.json();

    /* Barra de búsqueda */
    let sc = document.getElementById('searchContainer');
    if (!sc) { sc = document.createElement('div'); sc.id = 'searchContainer'; grid.parentNode.insertBefore(sc, grid); }
    sc.style.marginBottom = '10px';
    sc.innerHTML = `
      <input type="text" id="searchInput" placeholder="🔍 Buscar diseño o categoría..." style="
        width:100%;padding:8px 13px;font-size:0.85rem;border-radius:7px;box-sizing:border-box;
        border:1px solid rgba(14,165,233,0.28);background:rgba(14,165,233,0.05);
        color:#e2e8f0;outline:none;font-family:monospace;"
        onfocus="this.style.borderColor='#0ea5e9'"
        onblur="this.style.borderColor='rgba(14,165,233,0.28)'">`;

    /* Barra multi-selección */
    let mb = document.getElementById('gallery-multibar');
    if (!mb) {
      mb = document.createElement('div');
      mb.id = 'gallery-multibar';
      mb.style.cssText = 'margin-bottom:10px;min-height:28px;display:flex;align-items:center;';
      grid.parentNode.insertBefore(mb, grid);
    }

    currentPage = 1;
    selectedGalleryItems.clear();
    updateMultiSelectBar();
    filterAndRender('todos', '');

    document.getElementById('searchInput')?.addEventListener('input', e => {
      currentPage = 1;
      filterAndRender(currentCategoria, e.target.value);
    });

  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#f43f5e;padding:32px;font-family:monospace;font-size:0.76rem;">❌ ${err.message}</div>`;
  }
}

/* ── Filtrar y renderizar ── */
function filterAndRender(categoria, busqueda) {
  const container = document.getElementById('imgbb-designs-grid');
  if (!container) return;
  container.innerHTML = '';

  const bl = (busqueda || '').toLowerCase().trim();
  const filtrados = allDesigns.filter(d => {
    const n = (d.nombre || d.Nombre || '').toLowerCase();
    const c = (d.categoria || d.Categoria || '').toLowerCase();
    return !bl || n.includes(bl) || c.includes(bl);
  });

  const start = (currentPage - 1) * itemsPerPage;
  const page  = filtrados.slice(start, start + itemsPerPage);

  if (page.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#475569;padding:28px;font-family:monospace;font-size:0.76rem;">Sin resultados</div>';
    renderPagination(filtrados.length, busqueda);
    return;
  }

  page.forEach((d, index) => {
    const key = d.url;
    const isSel = selectedGalleryItems.has(key);

    const item = document.createElement('div');
    item.className = 'gallery-item' + (isSel ? ' gal-selected' : '');
    item.dataset.url = key;
    item.style.cssText = `
      cursor:pointer;text-align:center;padding:6px;border-radius:8px;position:relative;
      border:2px solid ${isSel ? '#0ea5e9' : 'rgba(14,165,233,0.12)'};
      background:${isSel ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.03)'};
      transition:border-color 0.15s,background 0.15s,transform 0.15s;
      user-select:none;`;

    /* Check */
    const check = document.createElement('div');
    check.className = 'gal-check';
    check.style.cssText = `
      position:absolute;top:5px;right:5px;width:17px;height:17px;
      border-radius:50%;border:2px solid #0ea5e9;
      background:${isSel ? '#0ea5e9' : 'transparent'};
      display:flex;align-items:center;justify-content:center;
      font-size:9px;color:#fff;z-index:2;transition:all 0.15s;`;
    check.textContent = isSel ? '✓' : '';

    /* Skeleton thumb */
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      width:100%;aspect-ratio:1/1;border-radius:5px;overflow:hidden;
      background:linear-gradient(90deg,#0d1020 25%,#182035 50%,#0d1020 75%);
      background-size:200% 100%;animation:galshimmer 1.3s infinite;`;

    /* Nombre */
    const nameEl = document.createElement('small');
    nameEl.style.cssText = 'display:block;margin-top:5px;color:#94a3b8;font-size:0.62rem;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    nameEl.textContent = d.nombre || '—';

    item.appendChild(check);
    item.appendChild(wrap);
    item.appendChild(nameEl);
    container.appendChild(item);

    /* Hover */
    item.addEventListener('mouseenter', () => {
      if (!selectedGalleryItems.has(key)) {
        item.style.borderColor = 'rgba(14,165,233,0.45)';
        item.style.transform = 'translateY(-2px)';
      }
    });
    item.addEventListener('mouseleave', () => {
      if (!selectedGalleryItems.has(key)) {
        item.style.borderColor = 'rgba(14,165,233,0.12)';
        item.style.transform = 'translateY(0)';
      }
    });

    /* Clic simple = toggle selección */
    item.addEventListener('click', () => {
      if (selectedGalleryItems.has(key)) {
        selectedGalleryItems.delete(key);
        applyItemStyle(item, false);
      } else {
        selectedGalleryItems.add(key);
        applyItemStyle(item, true);
      }
      updateMultiSelectBar();
    });

    /* Doble clic = cargar inmediatamente */
    item.addEventListener('dblclick', e => {
      e.stopPropagation();
      loadSingleDesign(key);
    });

    /* Carga lazy con preview en baja resolución */
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        o.disconnect();
        setTimeout(() => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const thumbSrc = makeThumb(img, 130); // preview 130px, ~8–15KB
            const tImg = document.createElement('img');
            tImg.src = thumbSrc;
            tImg.style.cssText = 'width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.22s;';
            tImg.onload = () => {
              wrap.style.animation = 'none';
              wrap.style.background = '#09111f';
              wrap.innerHTML = '';
              wrap.appendChild(tImg);
              requestAnimationFrame(() => { tImg.style.opacity = '1'; });
            };
          };
          img.onerror = () => {
            wrap.style.animation = 'none';
            wrap.innerHTML = '<span style="color:#f43f5e;font-size:0.58rem;font-family:monospace;padding:4px;">Error</span>';
          };
          img.src = key;
        }, index * 35); // escalonado para no saturar
      });
    }, { rootMargin: '180px' });

    obs.observe(wrap);
  });

  renderPagination(filtrados.length, busqueda);
}

/* ── Paginación ── */
function renderPagination(total, busqueda) {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  pag.innerHTML = '';
  const totalPages = Math.ceil(total / itemsPerPage);
  if (totalPages <= 1) return;

  const bs = 'padding:5px 13px;border-radius:6px;margin:0 3px;cursor:pointer;font-family:monospace;font-size:0.74rem;border:1px solid rgba(14,165,233,0.35);background:rgba(14,165,233,0.07);color:#0ea5e9;transition:background 0.15s;';

  const scrollUp = () => document.getElementById('imgbb-designs-grid')?.scrollIntoView({ behavior:'smooth', block:'start' });

  if (currentPage > 1) {
    const p = document.createElement('button');
    p.textContent = '← Anterior'; p.style.cssText = bs;
    p.onclick = () => { currentPage--; filterAndRender(currentCategoria, busqueda); scrollUp(); };
    pag.appendChild(p);
  }

  const info = document.createElement('span');
  info.style.cssText = 'font-family:monospace;font-size:0.7rem;color:#334155;margin:0 8px;';
  info.textContent = `${currentPage} / ${totalPages}  ·  ${total} diseños`;
  pag.appendChild(info);

  if (currentPage < totalPages) {
    const n = document.createElement('button');
    n.textContent = 'Siguiente →'; n.style.cssText = bs;
    n.onclick = () => { currentPage++; filterAndRender(currentCategoria, busqueda); scrollUp(); };
    pag.appendChild(n);
  }
}

/* ── Cargar un diseño ── */
function loadSingleDesign(url) {
  const lm = showMessage('Cargando diseño...', 'loading', 0);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const trimmed = trimTransparentPixels(img);
      const id = 'sheet-' + Date.now() + Math.random().toString(36).slice(2,5);
      const design = new Design(id, trimmed);
      design.scale = Math.min(1, Math.min((canvas.width - 20) / design.width, (canvas.height - 20) / design.height));
      designs.push(design);
      syncDesignsRef();
      selectedDesignId = id;
      updateDesignsList(); updateControls(); drawCanvas();
      lm.remove();
      showMessage('✅ Diseño cargado', 'success', 2000);
      document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      selectedGalleryItems.clear();
    } catch(e) { lm.remove(); showMessage('Error al procesar', 'error', 3000); }
  };
  img.onerror = () => { lm.remove(); showMessage('No se pudo cargar la imagen', 'error', 3000); };
  img.src = url;
}

/* ── Cargar múltiples diseños seleccionados ── */
async function loadSelectedDesigns() {
  const urls = Array.from(selectedGalleryItems);
  if (!urls.length) return;
  const lm = showMessage(`Cargando ${urls.length} diseño(s)...`, 'loading', 0);
  let ok = 0, fail = 0;

  for (const url of urls) {
    await new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const trimmed = trimTransparentPixels(img);
          const id = 'sheet-' + Date.now() + Math.random().toString(36).slice(2,5);
          const design = new Design(id, trimmed);
          design.scale = Math.min(1, Math.min((canvas.width - 20) / design.width, (canvas.height - 20) / design.height));
          designs.push(design);
          syncDesignsRef();
          selectedDesignId = id;
          ok++;
        } catch(e) { fail++; }
        resolve();
      };
      img.onerror = () => { fail++; resolve(); };
      img.src = url;
    });
  }

  updateDesignsList(); updateControls(); drawCanvas();
  lm.remove();
  showMessage(fail > 0 ? `${ok} cargado(s), ${fail} error(es)` : `✅ ${ok} diseño(s) cargados`, fail > 0 ? 'warning' : 'success', 2500);
  document.getElementById('imgbb-gallery-overlay').style.display = 'none';
  selectedGalleryItems.clear();
}