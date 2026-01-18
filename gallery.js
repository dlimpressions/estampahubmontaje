// gallery.js - Galería con CUADRÍCULA FORZADA, nombres en negrita y filtro por categoría
console.log("gallery.js cargado - versión con cuadrícula 100% forzada");

let allDesigns = [];

window.addEventListener('load', function() {
  console.log("Página lista - buscando botón");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      console.log("Clic detectado - abriendo galería");
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
  grid.innerHTML = '<div style="text-align:center;color:#aaa;padding:60px;">Cargando diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');
    if (!response.ok) throw new Error('Error al conectar');
    allDesigns = await response.json();
    renderGalleryUI();
    filterAndRender('todos');
  } catch (err) {
    grid.innerHTML = '<div style="text-align:center;color:red;padding:60px;">Error al cargar</div>';
  }
}

function renderGalleryUI() {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = `
    <div style="margin-bottom:20px;">
      <input id="searchInput" type="text" placeholder="Buscar por nombre..." 
        style="width:100%;padding:12px;font-size:1rem;border-radius:10px;border:1px solid #4299e1;background:rgba(30,30,50,0.8);color:white;">
    </div>

    <div style="display:flex;gap:15px;margin-bottom:25px;flex-wrap:wrap;justify-content:center;">
      <button class="cat-tab active" data-cat="todos">Todos</button>
      <button class="cat-tab" data-cat="logos">Logos</button>
      <button class="cat-tab" data-cat="frases">Frases</button>
      <button class="cat-tab" data-cat="fondos">Fondos</button>
    </div>

    <div id="designsContainer" style="display:grid !important;grid-template-columns:repeat(auto-fill,minmax(180px,1fr)) !important;gap:30px !important;padding:20px !important;width:100% !important;"></div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #designsContainer {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
      gap: 30px !important;
    }
    #designsContainer > div {
      text-align: center !important;
      cursor: pointer !important;
      transition: transform 0.2s !important;
    }
    #designsContainer > div:hover {
      transform: scale(1.08) !important;
    }
    .design-thumb {
      width: 180px !important;
      height: 180px !important;
      margin: 0 auto !important;
      background: #1a1a2e !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
    }
    .design-thumb img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
    }
    .design-name {
      font-weight: bold !important;
      color: #ffffff !important;
      margin-top: 12px !important;
      font-size: 1.1rem !important;
      display: block !important;
    }
    .cat-tab {
      padding: 12px 25px;
      border: none;
      border-radius: 30px;
      background: rgba(66,153,225,0.3);
      color: white;
      cursor: pointer;
      transition: all 0.3s;
    }
    .cat-tab:hover { background: rgba(66,153,225,0.6); transform: scale(1.05); }
    .cat-tab.active { background: #4299e1; box-shadow: 0 0 20px #4299e1; }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterAndRender(tab.dataset.cat.toLowerCase(), document.getElementById('searchInput').value);
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const catActiva = document.querySelector('.cat-tab.active')?.dataset.cat.toLowerCase() || 'todos';
    filterAndRender(catActiva, e.target.value);
  });
}

function filterAndRender(categoria = 'todos', busqueda = '') {
  const container = document.getElementById('designsContainer');
  container.innerHTML = '';

  const filtrados = allDesigns.filter(d => {
    const catMatch = (categoria === 'todos') || 
                     (d.categoria && d.categoria.toLowerCase() === categoria) ||
                     (d.Categoría && d.Categoría.toLowerCase() === categoria); // acepta mayúscula también

    const nameMatch = !busqueda || (d.nombre && d.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    return catMatch && nameMatch;
  });

  if (filtrados.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#e53e3e;padding:80px;">No hay diseños en esta categoría o búsqueda</div>';
    return;
  }

  filtrados.forEach(d => {
    const item = document.createElement('div');
    item.innerHTML = `
      <div class="design-thumb">
        <img src="${d.url}" loading="lazy" alt="${d.nombre || 'Diseño'}">
      </div>
      <div class="design-name">${d.nombre || 'Sin nombre'}</div>
      ${d.categoria || d.Categoría ? `<small style="color:#a0aec0;font-size:0.9rem;">(${d.categoria || d.Categoría})</small>` : ''}
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