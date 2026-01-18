// gallery.js - Galería con CATEGORÍAS, BÚSQUEDA y CUADRÍCULA
console.log("gallery.js cargado correctamente - v2026 con categorías y búsqueda");

window.addEventListener('load', function() {
  console.log("DOM listo - buscando elementos de galería");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const designsGrid = document.getElementById('imgbb-designs-grid');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (!openGalleryBtn) {
    console.error("ERROR: No se encontró el botón #open-imgbb-gallery");
  } else {
    console.log("Botón encontrado ✓ - agregando evento de clic");
    openGalleryBtn.addEventListener('click', () => {
      console.log("¡Clic detectado! Abriendo galería...");
      if (galleryOverlay) {
        galleryOverlay.style.display = 'flex';
        cargarGaleriaDesdeSheets();
      } else {
        console.error("ERROR: No se encontró #imgbb-gallery-overlay");
      }
    });
  }

  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      console.log("Clic en Cerrar - ocultando galería");
      if (galleryOverlay) galleryOverlay.style.display = 'none';
    });
  } else {
    console.error("No se encontró botón de cerrar galería");
  }
});

let allDesigns = [];

async function cargarGaleriaDesdeSheets() {
  console.log("Iniciando carga desde Sheets...");
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) {
    console.error("No se encontró el grid #imgbb-designs-grid");
    return;
  }

  grid.innerHTML = `
    <div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">
      Cargando diseños...
    </div>
  `;

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');
    
    if (!response.ok) throw new Error('Error al conectar con Sheets');

    allDesigns = await response.json();
    console.log("Diseños cargados:", allDesigns.length);

    renderGalleryUI();
    filterAndRender('todos'); // Mostrar todos al inicio

  } catch (err) {
    console.error("Error cargando galería:", err);
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
        Error: ${err.message}
      </div>
    `;
  }
}

function renderGalleryUI() {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = `
    <!-- Barra de búsqueda -->
    <div style="grid-column:1/-1; margin-bottom:15px;">
      <input type="text" id="searchInput" placeholder="Buscar por nombre..." 
        style="width:100%; padding:10px; font-size:1rem; border-radius:8px; border:1px solid #cbd5e0; background:rgba(30,30,50,0.6); color:#e2e8f0;">
    </div>

    <!-- Pestañas -->
    <div style="grid-column:1/-1; display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; justify-content:center;">
      <button class="category-tab active" data-cat="todos">Todos</button>
      <button class="category-tab" data-cat="logos">Logos</button>
      <button class="category-tab" data-cat="frases">Frases</button>
      <button class="category-tab" data-cat="fondos">Fondos</button>
    </div>

    <!-- Grid en CUADRÍCULA -->
    <div id="designsContainer" style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 20px;
      padding: 10px;
    "></div>
  `;

  // Estilos de pestañas
  const style = document.createElement('style');
  style.textContent = `
    .category-tab {
      padding: 10px 20px;
      border: none;
      border-radius: 30px;
      background: rgba(66,153,225,0.25);
      color: #e2e8f0;
      cursor: pointer;
      transition: all 0.3s;
    }
    .category-tab:hover { background: rgba(66,153,225,0.5); transform: scale(1.05); }
    .category-tab.active { background: #4299e1; color: white; box-shadow: 0 0 15px rgba(66,153,225,0.6); }
  `;
  document.head.appendChild(style);

  // Eventos
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterAndRender(tab.dataset.cat, document.getElementById('searchInput').value);
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const active = document.querySelector('.category-tab.active')?.dataset.cat || 'todos';
    filterAndRender(active, e.target.value);
  });
}

function filterAndRender(category = 'todos', search = '') {
  const container = document.getElementById('designsContainer');
  if (!container) return;
  container.innerHTML = '';

  const filtered = allDesigns.filter(d => {
    const catMatch = category === 'todos' || (d.categoria && d.categoria.toLowerCase() === category);
    const searchMatch = !search || (d.nombre && d.nombre.toLowerCase().includes(search.toLowerCase()));
    return catMatch && searchMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No se encontraron diseños</div>';
    return;
  }

  filtered.forEach(d => {
    const item = document.createElement('div');
    item.style.cursor = 'pointer';
    item.innerHTML = `
      <div style="width:140px;height:140px;margin:auto;background:#222;border-radius:8px;overflow:hidden;">
        <img src="${d.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
      </div>
      <small style="color:#e2e8f0;">${d.nombre || 'Sin nombre'}</small>
    `;
    item.onclick = () => loadDesignToCanvas(d);
    container.appendChild(item);
  });
}

function loadDesignToCanvas(d) {
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
    showMessage(`Diseño "${d.nombre}" cargado`, 'success', 2000);
    document.getElementById('imgbb-gallery-overlay').style.display = 'none';
  };
  img.src = d.url;
}