// gallery.js - v13: búsqueda visual con rango ampliado y orden descendente por similitud
console.log("✅ gallery.js v13 - rango ampliado y orden correcto");

let allDesigns        = [];
let currentPage       = 1;
const itemsPerPage    = 20;
let selectedItems     = new Set();
let currentSearch     = '';
let visualSearchMode  = false;
let vsScores          = new Map(); // distancia (menor = más similar)

window.addEventListener('load', () => {
  const overlay     = document.getElementById('imgbb-gallery-overlay');
  const openBtn     = document.getElementById('open-imgbb-gallery');
  const closeBtn    = document.getElementById('close-imgbb-gallery');

  openBtn?.addEventListener('click', () => {
    overlay.style.display = 'flex';
    selectedItems.clear();
    visualSearchMode = false;
    vsScores.clear();
    loadFromSheets();
  });

  closeBtn?.addEventListener('click', () => {
    overlay.style.display = 'none';
    selectedItems.clear();
  });
});

async function loadFromSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if(!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:50px;color:#475569;font-family:monospace;">
      <div style="display:inline-block;width:28px;height:28px;border:3px solid rgba(14,165,233,0.2);
        border-top-color:#0ea5e9;border-radius:50%;animation:gspin 0.7s linear infinite;margin-bottom:10px;"></div><br>
      Cargando diseños...
    </div>
    <style>@keyframes gspin{to{transform:rotate(360deg)}}</style>`;

  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec');
    allDesigns = await res.json();
    currentPage = 1;
    currentSearch = '';
    buildSearchBar();
    buildMultiBar();
    render();
  } catch(e) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#f43f5e;padding:40px;">❌ Error al cargar: ${e.message}</div>`;
  }
}

function buildSearchBar() {
  let sc = document.getElementById('searchContainer');
  if(!sc){
    sc = document.createElement('div');
    sc.id = 'searchContainer';
    document.getElementById('imgbb-designs-grid').parentNode
      .insertBefore(sc, document.getElementById('imgbb-designs-grid'));
  }

  sc.style.cssText = 'margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
  sc.innerHTML = `
    <input id="searchInput" type="text" placeholder="🔍 Buscar por nombre..." style="
      flex:1;min-width:180px;padding:9px 13px;border-radius:7px;
      border:1px solid rgba(14,165,233,0.3);background:rgba(14,165,233,0.06);
      color:#e2e8f0;outline:none;font-family:monospace;font-size:0.85rem;">
    
    <label id="vs-label" title="Buscar diseño similar por imagen" style="
      display:flex;align-items:center;gap:5px;padding:8px 12px;
      border-radius:7px;border:1px solid rgba(168,85,247,0.4);
      background:rgba(168,85,247,0.08);color:#a855f7;
      font-size:0.8rem;font-family:monospace;cursor:pointer;
      transition:all 0.15s;">
      🖼️ Buscar por imagen
      <input id="vs-input" type="file" accept="image/*" style="display:none;">
    </label>

    <button id="vs-clear" style="display:none;padding:7px 12px;border-radius:7px;
      border:1px solid rgba(244,63,94,0.4);background:rgba(244,63,94,0.08);
      color:#f43f5e;font-size:0.78rem;font-family:monospace;cursor:pointer;">
      ✕ Quitar filtro visual
    </button>`;

  document.getElementById('searchInput').addEventListener('input', e => {
    currentPage = 1;
    currentSearch = e.target.value;
    visualSearchMode = false;
    vsScores.clear();
    document.getElementById('vs-clear').style.display = 'none';
    render();
  });

  document.getElementById('vs-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    runVisualSearch(file);
    e.target.value = '';
  });

  document.getElementById('vs-clear').addEventListener('click', () => {
    visualSearchMode = false;
    vsScores.clear();
    currentPage = 1;
    document.getElementById('vs-clear').style.display = 'none';
    render();
  });
}

// ========== MOSTRAR PROGRESO DENTRO DEL MODAL ==========
function showModalProgress(text, percent) {
  const grid = document.getElementById('imgbb-designs-grid');
  if(!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:40px;color:#cbd5e0;">
      <div style="width:80%;max-width:300px;margin:0 auto 20px auto;background:#1e293b;border-radius:30px;overflow:hidden;">
        <div style="width:${percent}%;height:6px;background:#0ea5e9;transition:width 0.2s;"></div>
      </div>
      <div style="font-family:monospace;font-size:0.85rem;">${text}</div>
      <div style="margin-top:12px;font-size:0.7rem;color:#94a3b8;">Analizando colores... por favor espera</div>
    </div>
  `;
}

// ========== FUNCIONES DE HISTOGRAMA RÁPIDO ==========
function getFastHistogram(img, size) {
  size = size || 16;
  try {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const bins = 8;
    const hist = new Float32Array(bins * 3);
    const total = size * size;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i+3];
      if (a < 30) continue;
      hist[Math.floor(data[i]   / 256 * bins)]          += 1;
      hist[bins   + Math.floor(data[i+1] / 256 * bins)] += 1;
      hist[bins*2 + Math.floor(data[i+2] / 256 * bins)] += 1;
    }
    for (let i = 0; i < hist.length; i++) hist[i] /= total;
    return hist;
  } catch(e) {
    console.warn('Error en histograma rápido', e);
    return null;
  }
}

function histogramDistance(a, b) {
  if (!a || !b) return 999;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    d += diff * diff;
  }
  return Math.sqrt(d);
}

// ========== BÚSQUEDA VISUAL CON RANGO AMPLIADO ==========
async function runVisualSearch(file) {
  vsScores.clear();
  showModalProgress('📷 Cargando imagen de búsqueda...', 5);

  let queryImg;
  try {
    queryImg = await new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
      img.src = url;
    });
  } catch(e) {
    showModalProgress('❌ Error al cargar la imagen', 0);
    setTimeout(() => render(), 1500);
    return;
  }

  showModalProgress('🎨 Analizando paleta de colores...', 15);
  const queryHist = getFastHistogram(queryImg, 16);
  if (!queryHist) {
    showModalProgress('⚠️ No se pudo analizar la imagen', 0);
    setTimeout(() => render(), 1500);
    return;
  }

  // 🔥 RANGO AMPLIADO: puedes cambiar este número (ej: 300, 400)
  const MAX_COMPARE = 200;
  const toCompare = allDesigns.slice(0, MAX_COMPARE);
  const total = toCompare.length;
  let done = 0;
  let failed = 0;

  const BATCH = 5;

  for (let i = 0; i < toCompare.length; i += BATCH) {
    const batch = toCompare.slice(i, i + BATCH);
    await Promise.all(batch.map(d => new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const hist = getFastHistogram(img, 16);
          vsScores.set(d.url, hist ? histogramDistance(queryHist, hist) : 999);
        } catch(e) {
          vsScores.set(d.url, 999);
          failed++;
        }
        done++;
        const percent = 15 + Math.floor((done / total) * 70);
        showModalProgress(`🖼️ Comparando ${done}/${total} imágenes...`, percent);
        resolve();
      };
      img.onerror = () => {
        vsScores.set(d.url, 999);
        failed++;
        done++;
        const percent = 15 + Math.floor((done / total) * 70);
        showModalProgress(`🖼️ Comparando ${done}/${total} imágenes...`, percent);
        resolve();
      };
      img.src = d.url;
    })));
  }

  if (done === 0 || failed === done) {
    showModalProgress('⚠️ No se pudo comparar ningún diseño (CORS)', 0);
    setTimeout(() => render(), 2000);
    return;
  }

  // Asignar score alto a las imágenes no comparadas
  allDesigns.forEach(d => {
    if (!vsScores.has(d.url)) vsScores.set(d.url, 999);
  });

  visualSearchMode = true;
  currentPage = 1;
  document.getElementById('vs-clear').style.display = 'inline-flex';

  showModalProgress(`✅ Mostrando ${Math.min(total, MAX_COMPARE)} resultados similares...`, 100);
  setTimeout(() => {
    render();
  }, 500);
}
// ========== FIN BÚSQUEDA VISUAL ==========

function buildMultiBar() {
  let bar = document.getElementById('gallery-multibar');
  if(!bar) {
    bar = document.createElement('div');
    bar.id = 'gallery-multibar';
    bar.style.cssText = 'min-height:32px;display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;';
    const grid = document.getElementById('imgbb-designs-grid');
    grid.parentNode.insertBefore(bar, grid);
  }
  updateMultiBar();
}

function updateMultiBar() {
  const bar = document.getElementById('gallery-multibar');
  if(!bar) return;
  const n = selectedItems.size;
  if(n === 0) {
    bar.innerHTML = `<span style="color:#475569;font-family:monospace;font-size:0.72rem;">Clic = seleccionar · Doble clic = cargar uno directamente</span>`;
    return;
  }
  bar.innerHTML = `
    <span style="color:#0ea5e9;font-family:monospace;font-size:0.75rem;font-weight:600;">✅ ${n} seleccionado(s)</span>
    <button id="gal-load-sel" style="padding:6px 16px;background:#0ea5e9;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.78rem;">⬆️ Cargar al canvas</button>
    <button id="gal-clear-sel" style="padding:6px 11px;background:transparent;border:1px solid #f43f5e;color:#f43f5e;border-radius:6px;cursor:pointer;font-size:0.78rem;">✕</button>`;
  document.getElementById('gal-load-sel').onclick  = loadSelected;
  document.getElementById('gal-clear-sel').onclick = () => {
    selectedItems.clear();
    updateMultiBar();
    document.querySelectorAll('.gal-item').forEach(el => {
      el.dataset.sel = '0';
      applySelStyle(el, false);
    });
  };
}

function getFilteredList() {
  const term = currentSearch.toLowerCase().trim();
  let list = allDesigns.filter(d => {
    if(!term) return true;
    const n = (d.nombre || d.Nombre || '').toLowerCase();
    const c = (d.categoria || d.Categoria || '').toLowerCase();
    return n.includes(term) || c.includes(term);
  });

  if(visualSearchMode && vsScores.size > 0) {
    // Orden ascendente por distancia (menor distancia = más similar)
    list = [...list].sort((a, b) => (vsScores.get(a.url) || 999) - (vsScores.get(b.url) || 999));
  }
  return list;
}

function render() {
  const grid = document.getElementById('imgbb-designs-grid');
  if(!grid) return;
  grid.innerHTML = '';

  const list       = getFilteredList();
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const start      = (currentPage - 1) * itemsPerPage;
  const page       = list.slice(start, start + itemsPerPage);

  if (visualSearchMode && list.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#f59e0b;padding:50px;font-family:monospace;">
      🔍 No se encontraron diseños similares. Prueba con otra imagen o desactiva el filtro visual.
    </div>`;
    renderPagination(totalPages);
    return;
  }

  if(page.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#475569;padding:50px;">Sin resultados</div>`;
    renderPagination(totalPages);
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      const img = entry.target.querySelector('img[data-src]');
      if(img) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
    });
  }, { rootMargin: '120px' });

  // Distancia máxima observada empíricamente (~1.5) para calcular porcentaje
  const maxDistance = 1.5;

  page.forEach(d => {
    const url   = d.url;
    const isSel = selectedItems.has(url);
    let score = vsScores.get(url);
    let similarityPercent = 0;
    if (score !== undefined && score < 998) {
      let similarity = Math.max(0, 1 - (score / maxDistance));
      similarityPercent = Math.round(similarity * 100);
    }

    const item = document.createElement('div');
    item.className    = 'gal-item';
    item.dataset.url  = url;
    item.dataset.sel  = isSel ? '1' : '0';
    item.style.cssText = `
      cursor:pointer;padding:7px;border-radius:8px;position:relative;
      border:2px solid ${isSel ? '#0ea5e9' : 'rgba(14,165,233,0.14)'};
      background:${isSel ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.025)'};
      transition:border-color 0.15s,background 0.15s,transform 0.12s;`;

    const scoreBadge = (visualSearchMode && similarityPercent > 0)
      ? `<div style="position:absolute;top:4px;left:6px;font-size:0.55rem;font-family:monospace;
           background:rgba(168,85,247,0.8);color:#fff;padding:1px 5px;border-radius:4px;z-index:2;">
           ${similarityPercent}% similar
         </div>` : '';

    item.innerHTML = `
      ${scoreBadge}
      <div style="width:100%;aspect-ratio:1/1;border-radius:5px;overflow:hidden;background:#0d1120;
        position:relative;">
        <img data-src="${url}" src=""
          style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .3s;"
          loading="lazy">
        <div class="gal-chk" style="
          position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;
          border:2px solid #0ea5e9;
          background:${isSel ? '#0ea5e9' : 'transparent'};
          color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:11px;z-index:2;">${isSel ? '✓' : ''}</div>
      </div>
      <small style="display:block;margin-top:4px;color:#64748b;font-size:0.62rem;
        text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${d.nombre || '—'}</small>`;

    const img = item.querySelector('img');
    img.onload  = () => img.style.opacity = '1';
    img.onerror = () => { img.style.opacity = '0.3'; };
    io.observe(item);

    item.addEventListener('mouseenter', () => {
      if(item.dataset.sel !== '1') item.style.transform = 'translateY(-2px)';
    });
    item.addEventListener('mouseleave', () => { item.style.transform = 'none'; });

    item.addEventListener('click', () => {
      const sel = item.dataset.sel === '1';
      if(sel) { selectedItems.delete(url); item.dataset.sel = '0'; applySelStyle(item, false); }
      else    { selectedItems.add(url);    item.dataset.sel = '1'; applySelStyle(item, true);  }
      updateMultiBar();
    });

    item.addEventListener('dblclick', e => { e.stopImmediatePropagation(); loadOne(url); });
    grid.appendChild(item);
  });
  renderPagination(totalPages);
}

function applySelStyle(item, sel) {
  item.style.borderColor = sel ? '#0ea5e9' : 'rgba(14,165,233,0.14)';
  item.style.background  = sel ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.025)';
  const chk = item.querySelector('.gal-chk');
  if(chk) { chk.style.background = sel ? '#0ea5e9' : 'transparent'; chk.textContent = sel ? '✓' : ''; }
}

function renderPagination(totalPages) {
  const pag = document.getElementById('pagination');
  if(!pag) return;
  pag.innerHTML = '';
  if(totalPages <= 1) return;

  const bs = `padding:5px 13px;border-radius:6px;margin:0 3px;cursor:pointer;
    font-size:0.76rem;border:1px solid rgba(14,165,233,0.35);
    background:rgba(14,165,233,0.07);color:#0ea5e9;font-family:monospace;`;

  const scrollUp = () => document.getElementById('imgbb-designs-grid')?.scrollIntoView({behavior:'smooth',block:'start'});

  if(currentPage > 1){
    const b = document.createElement('button');
    b.style.cssText = bs; b.textContent = '← Anterior';
    b.onclick = () => { currentPage--; render(); scrollUp(); };
    pag.appendChild(b);
  }

  const info = document.createElement('span');
  info.style.cssText = 'font-family:monospace;font-size:0.7rem;color:#334155;margin:0 8px;';
  info.textContent = `Pág. ${currentPage} / ${totalPages}  ·  ${getFilteredList().length} diseños`;
  pag.appendChild(info);

  if(currentPage < totalPages){
    const b = document.createElement('button');
    b.style.cssText = bs; b.textContent = 'Siguiente →';
    b.onclick = () => { currentPage++; render(); scrollUp(); };
    pag.appendChild(b);
  }
}

function loadOne(url) {
  const m = showMessage('Cargando...', 'loading', 0);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const t  = trimTransparentPixels(img);
      const id = 'gal-' + Date.now();
      const d  = new Design(id, t);
      d.scale  = Math.min(1, Math.min((canvas.width-40)/d.width, (canvas.height-40)/d.height));
      designs.push(d);
      window.designs = designs;
      selectedDesignId = id;
      updateDesignsList(); updateControls(); drawCanvas();
      m.remove();
      showMessage('✅ Diseño cargado', 'success', 1800);
      document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      selectedItems.clear();
    } catch(e) { m.remove(); showMessage('Error: ' + e.message, 'error'); }
  };
  img.onerror = () => { m.remove(); showMessage('No se pudo cargar', 'error'); };
  img.src = url;
}

async function loadSelected() {
  const urls = Array.from(selectedItems);
  if(!urls.length) return;
  const m = showMessage(`Cargando ${urls.length} diseño(s)...`, 'loading', 0);
  let ok = 0;

  for(const url of urls) {
    await new Promise(res => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const t  = trimTransparentPixels(img);
          const id = 'gal-' + Date.now() + Math.random().toString(36).slice(2,5);
          const d  = new Design(id, t);
          d.scale  = Math.min(1, Math.min((canvas.width-40)/d.width, (canvas.height-40)/d.height));
          designs.push(d);
          window.designs = designs;
          selectedDesignId = id;
          ok++;
        } catch(e) {}
        res();
      };
      img.onerror = () => res();
      img.src = url;
    });
  }

  updateDesignsList(); updateControls(); drawCanvas();
  m.remove();
  showMessage(`✅ ${ok} diseño(s) cargados al canvas`, 'success', 2500);
  document.getElementById('imgbb-gallery-overlay').style.display = 'none';
  selectedItems.clear();
}

// Función auxiliar trimTransparentPixels
if (typeof trimTransparentPixels !== 'function') {
  window.trimTransparentPixels = function(img) {
    const tc = document.createElement('canvas');
    tc.width = img.width;
    tc.height = img.height;
    const tctx = tc.getContext('2d');
    tctx.drawImage(img, 0, 0);
    const { data } = tctx.getImageData(0, 0, tc.width, tc.height);
    let top = tc.height, left = tc.width, right = 0, bottom = 0;
    let found = false;
    for (let y = 0; y < tc.height; y++) {
      for (let x = 0; x < tc.width; x++) {
        if (data[(y * tc.width + x) * 4 + 3] > 10) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
          found = true;
        }
      }
    }
    if (!found) return tc;
    const w = right - left + 1;
    const h = bottom - top + 1;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    out.getContext('2d').drawImage(tc, left, top, w, h, 0, 0, w, h);
    return out;
  };
}

if (typeof showMessage !== 'function') {
  window.showMessage = function(msg, type, duration) {
    console.log(`[${type}] ${msg}`);
  };
}