// gallery.js - Galería REAL desde Google Sheets + CUADRÍCULA + categorías + búsqueda
// Adaptado a tu Sheet: columnas Nombre, URL, Acceso, Categoria
console.log("gallery.js cargado - versión FINAL para tu Sheet nueva");

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
      throw new Error('No se pudo conectar con Google Sheets. Revisa la URL o permisos.');
    }

    allDesigns = await response.json();

    // Interfaz con pestañas y búsqueda
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

      <!-- Grid en CUADRÍCULA (estilo probado que funciona) -->
      <div id="designsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px,1fr)); gap:20px;"></div>
    `;

    // Estilos para pestañas y nombres en negrita
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
      .design-item { text-align:center; cursor:pointer; padding:10px; border-radius:8px; transition:background 0.2s; }
      .design-item:hover { background:#e2e8f0; }
      .design-name { font-weight:bold !important; color:#333; margin-top:8px; font-size:1rem; display:block; }
    `;
    document.head.appendChild(style);

    // Eventos
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
      Error al cargar: ${err.message}<br>
      <small>Verifica la URL del Apps Script y que la sheet esté compartida como "Cualquiera".</small>
    </div>`;
  }
}

function filterAndRender(categoria = 'todos', busqueda = '') {
  const container = document.getElementById('designsContainer');
  container.innerHTML = '';

  const filtrados = allDesigns.filter(d => {
    // Usamos "Categoria" con mayúscula inicial como en tu nueva Sheet
    const catValor = d.Categoria || '';
    const catMatch = (categoria === 'todos') || (catValor.trim().toLowerCase() === categoria.toLowerCase());
    const nameMatch = !busqueda || (d.Nombre && d.Nombre.toLowerCase().includes(busqueda.toLowerCase()));
    return catMatch && nameMatch;
  });

  if (filtrados.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No hay diseños en esta categoría o búsqueda</div>';
    return;
  }

  filtrados.forEach(d => {
    const item = document.createElement('div');
    item.className = 'design-item';
    item.innerHTML = `
      <div style="width:120px; height:120px; margin:auto; background:#eee; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        <img src="${d.URL}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
      </div>
      <div class="design-name">${d.Nombre || 'Sin nombre'}</div>
      ${d.Categoria ? `<small style="color:#666;">(${d.Categoria})</small>` : ''}
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
        showMessage(`¡Diseño "${d.Nombre || 'sin nombre'}" cargado!`, 'success', 3000);
        document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      };
      img.src = d.URL;
    });

    container.appendChild(item);
  });
}