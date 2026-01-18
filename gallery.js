// gallery.js - Galería con CATEGORÍAS y BÚSQUEDA
console.log("gallery.js cargado - versión con categorías y búsqueda");

let allDesigns = []; // Guardamos todos los diseños para filtrar

window.addEventListener('load', function() {
  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const designsGrid = document.getElementById('imgbb-designs-grid');
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
    <div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">
      Cargando tus diseños desde Google Sheets...
    </div>
  `;

  try {
    // ← Tu URL real del Apps Script
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');
    
    if (!response.ok) throw new Error('Error al conectar con Google Sheets');

    allDesigns = await response.json(); // Guardamos todos

    // Limpiamos y construimos la interfaz con pestañas + búsqueda
    renderGalleryUI();
    filterAndRender('todos'); // Mostramos todos al inicio

  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
        Error al cargar: ${err.message}<br>
        <small>Revisa la URL y permisos de la Sheet.</small>
      </div>
    `;
  }
}

// Renderiza pestañas + barra de búsqueda + grid
function renderGalleryUI() {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = `
    <!-- Barra de búsqueda -->
    <div style="grid-column:1/-1; margin-bottom:15px;">
      <input type="text" id="searchInput" placeholder="Buscar por nombre..." 
        style="width:100%; padding:10px; font-size:1rem; border-radius:8px; border:1px solid #cbd5e0;">
    </div>

    <!-- Pestañas de categorías -->
    <div style="grid-column:1/-1; display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
      <button class="category-tab active" data-cat="todos">Todos</button>
      <button class="category-tab" data-cat="logos">Logos</button>
      <button class="category-tab" data-cat="frases">Frases</button>
      <button class="category-tab" data-cat="fondos">Fondos</button>
      <!-- Agrega más categorías según necesites -->
    </div>

    <!-- Grid de diseños -->
    <div id="designsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:15px;"></div>
  `;

  // Estilo rápido para pestañas (puedes mover a <style> si quieres)
  const style = document.createElement('style');
  style.textContent = `
    .category-tab {
      padding: 8px 16px;
      border: none;
      border-radius: 20px;
      background: rgba(66,153,225,0.2);
      color: #e2e8f0;
      cursor: pointer;
      transition: all 0.3s;
    }
    .category-tab:hover { background: rgba(66,153,225,0.4); }
    .category-tab.active {
      background: #4299e1;
      color: white;
      box-shadow: 0 0 15px rgba(66,153,225,0.5);
    }
  `;
  document.head.appendChild(style);

  // Eventos
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      filterAndRender(cat, document.getElementById('searchInput').value);
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const activeCat = document.querySelector('.category-tab.active')?.dataset.cat || 'todos';
    filterAndRender(activeCat, e.target.value);
  });
}

// Filtra y renderiza los diseños según categoría y búsqueda
function filterAndRender(category = 'todos', search = '') {
  const container = document.getElementById('designsContainer');
  if (!container) return;

  container.innerHTML = '';

  const searchLower = search.toLowerCase().trim();

  const filtered = allDesigns.filter(d => {
    const catMatch = (category === 'todos') || (d.categoria?.toLowerCase() === category);
    const nameMatch = !searchLower || d.nombre?.toLowerCase().includes(searchLower);
    return catMatch && nameMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
        No se encontraron diseños${search ? ' con "' + search + '"' : ''} en esta categoría
      </div>
    `;
    return;
  }

  filtered.forEach(d => {
    const item = document.createElement('div');
    item.style.cursor = 'pointer';
    item.style.textAlign = 'center';
    item.style.padding = '10px';
    item.style.borderRadius = '8px';
    item.style.background = 'rgba(30,30,50,0.6)';
    item.style.transition = 'background 0.2s';

    item.innerHTML = `
      <div style="width:120px;height:120px;margin:auto;background:#222;border-radius:6px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        <img src="${d.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
      </div>
      <small style="display:block;margin-top:8px;color:#e2e8f0;">${d.nombre || 'Sin nombre'}</small>
      ${d.categoria ? `<small style="color:#a0aec0;">(${d.categoria})</small>` : ''}
    `;

    item.addEventListener('mouseover', () => item.style.background = 'rgba(66,153,225,0.3)');
    item.addEventListener('mouseout', () => item.style.background = 'rgba(30,30,50,0.6)');

    item.addEventListener('click', () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const id = 'sheet-' + Date.now();
        const design = new Design(id, img);
        const maxW = canvas.width - 20;
        const maxH = canvas.height - 20;
        const scaleToFit = Math.min(maxW / design.width, maxH / design.height);
        design.scale = Math.min(1, scaleToFit);
        designs.push(design);
        selectedDesignId = id;
        updateDesignsList();
        updateControls();
        drawCanvas();
        showMessage(`¡Diseño "${d.nombre}" cargado!`, 'success', 3000);
        document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      };
      img.onerror = () => showMessage('Error al cargar diseño', 'error');
      img.src = d.url;
    });

    container.appendChild(item);
  });
}