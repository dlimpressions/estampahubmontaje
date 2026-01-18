// gallery.js - Galería con CATEGORÍAS, BÚSQUEDA y CUADRÍCULA FORZADA (versión FINAL)
console.log("gallery.js cargado - versión con cuadrícula forzada y nombres en negrita");

let allDesigns = [];

window.addEventListener('load', function() {
  console.log("DOM listo - inicializando galería");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    console.log("Botón encontrado ✓");
    openGalleryBtn.addEventListener('click', () => {
      console.log("Clic detectado - abriendo galería");
      if (galleryOverlay) {
        galleryOverlay.style.display = 'flex';
        cargarGaleriaDesdeSheets();
      }
    });
  }

  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      if (galleryOverlay) galleryOverlay.style.display = 'none';
    });
  }
});

async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="text-align:center;color:#aaa;padding:50px;">Cargando diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');
    if (!response.ok) throw new Error('Error al conectar');
    allDesigns = await response.json();
    renderGalleryUI();
    filterAndRender('todos');
  } catch (err) {
    grid.innerHTML = '<div style="text-align:center;color:red;padding:50px;">Error al cargar</div>';
  }
}

function renderGalleryUI() {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = `
    <div style="margin-bottom:20px;">
      <input id="searchInput" type="text" placeholder="Buscar por nombre..." 
        style="width:100%;padding:12px;font-size:1rem;border-radius:10px;border:1px solid #4299e1;background:rgba(30,30,50,0.8);color:white;">
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;justify-content:center;">
      <button class="cat-tab active" data-cat="todos">Todos</button>
      <button class="cat-tab" data-cat="logos">Logos</button>
      <button class="cat-tab" data-cat="frases">Frases</button>
      <button class="cat-tab" data-cat="fondos">Fondos</button>
    </div>

    <!-- FORZAMOS CUADRÍCULA -->
    <div id="designsContainer" style="display:grid !important; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)) !important; gap:25px !important; padding:15px !important;"></div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #designsContainer {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)) !important;
      gap: 25px !important;
    }
    .design-item {
      text-align:center;
      cursor:pointer;
      transition:transform 0.2s;
    }
    .design-item:hover { transform:scale(1.08); }
    .design-name {
      font-weight:bold !important;
      color:#ffffff !important;
      margin-top:10px;
      font-size:1rem;
      display:block;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .cat-tab {
      padding:10px 22px;
      border:none;
      border-radius:30px;
      background:rgba(66,153,225,0.3);
      color:white;
      cursor:pointer;
      transition:all 0.3s;
    }
    .cat-tab:hover { background:rgba(66,153,225,0.6); }
    .cat-tab.active { background:#4299e1; box-shadow:0 0 15px #4299e1; }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterAndRender(tab.dataset.cat, document.getElementById('searchInput').value);
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const cat = document.querySelector('.cat-tab.active')?.dataset.cat || 'todos';
    filterAndRender(cat, e.target.value);
  });
}

function filterAndRender(cat = 'todos', search = '') {
  const container = document.getElementById('designsContainer');
  container.innerHTML = '';

  const filtered = allDesigns.filter(d => {
    const catMatch = (cat === 'todos') || (d.categoria && d.categoria.toLowerCase() === cat);
    const nameMatch = !search || (d.nombre && d.nombre.toLowerCase().includes(search.toLowerCase()));
    return catMatch && nameMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#e53e3e;padding:60px;">No hay diseños</div>';
    return;
  }

  filtered.forEach(d => {
    const item = document.createElement('div');
    item.className = 'design-item';
    item.innerHTML = `
      <div style="width:170px;height:170px;margin:auto;background:#1a1a2e;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.5);">
        <img src="${d.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
      </div>
      <div class="design-name">${d.nombre || 'Sin nombre'}</div>
      ${d.categoria ? `<small style="color:#a0aec0;">(${d.categoria})</small>` : ''}
    `;

    item.onclick = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const id = 'design-' + Date.now();
        const nuevo = new Design(id, img);
        const maxW = canvas.width - 20;
        const maxH = canvas.height - 20;
        nuevo.scale = Math.min(1, Math.min(maxW / nuevo.width, maxH / nuevo.height));
        designs.push(nuevo);
        selectedDesignId = id;
        updateDesignsList();
        updateControls();
        drawCanvas();
        showMessage('Diseño cargado', 'success', 2000);
        document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      };
      img.src = d.url;
    };

    container.appendChild(item);
  });
}