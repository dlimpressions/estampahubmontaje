// gallery.js - Galería REAL desde Google Sheets + CUADRÍCULA + categorías + búsqueda
console.log("gallery.js cargado - versión FINAL con cuadrícula y nombres en negrita");

let allDesigns = []; // Guardamos todos para filtrar

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

// Carga desde Sheets
async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) {
    console.log("ERROR: No se encontró el grid");
    return;
  }

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">Cargando diseños...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');
    if (!response.ok) throw new Error('No se pudo conectar');

    allDesigns = await response.json();

    // Creamos la interfaz con pestañas y búsqueda
    grid.innerHTML = `
      <!-- Barra de búsqueda -->
      <div style="grid-column:1/-1; margin-bottom:15px;">
        <input type="text" id="searchInput" placeholder="Buscar por nombre..." 
          style="width:100%; padding:10px; font-size:1rem; border-radius:8px; border:1px solid #4299e1; background:rgba(30,30,50,0.8); color:#e2e8f0;">
      </div>

      <!-- Pestañas de categorías -->
      <div style="grid-column:1/-1; display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; justify-content:center;">
        <button class="cat-tab active" data-cat="todos">Todos</button>
        <button class="cat-tab" data-cat="logos">Logos</button>
        <button class="cat-tab" data-cat="frases">Frases</button>
        <button class="cat-tab" data-cat="fondos">Fondos</button>
      </div>

      <!-- Grid en CUADRÍCULA (usando la lógica que SÍ funciona) -->
      <div id="designsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px,1fr)); gap:20px;"></div>
    `;

    // Estilos para pestañas y nombres
    const style = document.createElement('style');
    style.textContent = `
      .cat-tab {
        padding: 8px 16px;
        border: none;
        border-radius: 20px;
        background: rgba(66,153,225,0.2);
        color: #e2e8f0;
        cursor: pointer;
        transition: all 0.3s;
      }
      .cat-tab:hover { background: rgba(66,153,225,0.4); }
      .cat-tab.active { background: #4299e1; color: white; }
      .design-item { text-align:center; cursor:pointer; }
      .design-name { font-weight:bold; color:#e2e8f0; margin-top:8px; font-size:1rem; display:block; }
    `;
    document.head.appendChild(style);

    // Eventos de pestañas y búsqueda
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

    // Mostramos todos al inicio
    filterAndRender('todos');

  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
      Error: ${err.message}
    </div>`;
  }
}

// Filtra y muestra diseños en cuadrícula
function filterAndRender(categoria = 'todos', busqueda = '') {
  const container = document.getElementById('designsContainer');
  container.innerHTML = '';

  const filtrados = allDesigns.filter(d => {
    const catMatch = (categoria === 'todos') || (d.categoria && d.categoria.toLowerCase() === categoria);
    const nameMatch = !busqueda || (d.nombre && d.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    return catMatch && nameMatch;
  });

  if (filtrados.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No hay diseños</div>';
    return;
  }

  filtrados.forEach(d => {
    const item = document.createElement('div');
    item.className = 'design-item';
    item.innerHTML = `
      <div style="width:140px; height:140px; margin:auto; background:#222; border-radius:8px; overflow:hidden;">
        <img src="${d.url}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
      </div>
      <div class="design-name">${d.nombre || 'Sin nombre'}</div>
      ${d.categoria ? `<small style="color:#a0aec0;">(${d.categoria})</small>` : ''}
    `;

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
        showMessage(`¡Diseño cargado!`, 'success', 2000);
        document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      };
      img.src = d.url;
    });

    container.appendChild(item);
  });
}