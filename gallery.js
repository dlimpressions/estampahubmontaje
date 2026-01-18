// gallery.js - Galería con CATEGORÍAS, BÚSQUEDA y CUADRÍCULA (versión final 2026)
// Este archivo hace que al clic en "Mis Diseños ImgBB" se abra el modal con diseños en cuadrícula

console.log("gallery.js cargado - versión FINAL con cuadrícula y nombres en negrita");

let allDesigns = []; // Aquí guardamos todos los diseños para filtrar

window.addEventListener('load', function() {
  console.log("Página lista - buscando botón y modal de galería");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    console.log("Botón encontrado ✓ - agregando clic");
    openGalleryBtn.addEventListener('click', () => {
      console.log("¡Clic en Mis Diseños ImgBB! Abriendo...");
      if (galleryOverlay) {
        galleryOverlay.style.display = 'flex';
        cargarGaleriaDesdeSheets();
      } else {
        console.log("ERROR: No se encontró el modal");
      }
    });
  } else {
    console.log("ERROR: No se encontró el botón #open-imgbb-gallery");
  }

  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      if (galleryOverlay) galleryOverlay.style.display = 'none';
    });
  }
});

async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) {
    console.log("ERROR: No se encontró el contenedor de diseños");
    return;
  }

  grid.innerHTML = '<div style="text-align:center; color:#666; padding:50px;">Cargando tus diseños...</div>';

  try {
    // ← Tu URL real del Apps Script (cámbiala solo si es diferente)
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');
    
    if (!response.ok) throw new Error('No se pudo conectar');

    allDesigns = await response.json();
    console.log("Diseños cargados:", allDesigns.length);

    renderGalleryUI();
    filterAndRender('todos'); // Mostramos todos al abrir

  } catch (err) {
    grid.innerHTML = `<div style="text-align:center; color:#e53e3e; padding:50px;">
      Error: ${err.message}<br>Revisa la conexión o permisos.
    </div>`;
  }
}

// Crea la interfaz (pestañas + búsqueda + cuadrícula)
function renderGalleryUI() {
  const grid = document.getElementById('imgbb-designs-grid');
  grid.innerHTML = `
    <!-- Barra de búsqueda -->
    <div style="margin-bottom:20px;">
      <input type="text" id="searchInput" placeholder="Buscar diseño..." 
        style="width:100%; padding:12px; font-size:1rem; border-radius:10px; border:1px solid #4299e1; background:rgba(30,30,50,0.8); color:white; outline:none;">
    </div>

    <!-- Pestañas -->
    <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; justify-content:center;">
      <button class="cat-tab active" data-cat="todos">Todos</button>
      <button class="cat-tab" data-cat="logos">Logos</button>
      <button class="cat-tab" data-cat="frases">Frases</button>
      <button class="cat-tab" data-cat="fondos">Fondos</button>
    </div>

    <!-- Cuadrícula de diseños -->
    <div id="designsContainer" style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 25px;
      padding: 15px;
    "></div>
  `;

  // Estilos rápidos (puedes mover a <style> del HTML si prefieres)
  const style = document.createElement('style');
  style.textContent = `
    .cat-tab {
      padding: 10px 24px;
      border: none;
      border-radius: 30px;
      background: rgba(66,153,225,0.3);
      color: white;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }
    .cat-tab:hover { background: rgba(66,153,225,0.6); transform: scale(1.05); }
    .cat-tab.active { background: #4299e1; box-shadow: 0 0 15px #4299e1; }
    .design-item {
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .design-item:hover { transform: scale(1.08); }
    .design-name {
      font-weight: bold !important;
      color: #e2e8f0;
      margin-top: 10px;
      font-size: 1rem;
      display: block;
    }
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
    const catActiva = document.querySelector('.cat-tab.active')?.dataset.cat || 'todos';
    filterAndRender(catActiva, e.target.value);
  });
}

// Filtra y muestra en cuadrícula
function filterAndRender(categoria = 'todos', busqueda = '') {
  const container = document.getElementById('designsContainer');
  container.innerHTML = '';

  const filtrados = allDesigns.filter(d => {
    const coincideCat = (categoria === 'todos') || (d.categoria && d.categoria.toLowerCase() === categoria);
    const coincideBusq = !busqueda || (d.nombre && d.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    return coincideCat && coincideBusq;
  });

  if (filtrados.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:50px;">No hay diseños que coincidan</div>';
    return;
  }

  filtrados.forEach(d => {
    const item = document.createElement('div');
    item.className = 'design-item';
    item.innerHTML = `
      <div style="width:170px; height:170px; margin:auto; background:#1a1a2e; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
        <img src="${d.url}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
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
        showMessage(`¡Diseño cargado!`, 'success', 2000);
        document.getElementById('imgbb-gallery-overlay').style.display = 'none';
      };
      img.src = d.url;
    };

    container.appendChild(item);
  });
}