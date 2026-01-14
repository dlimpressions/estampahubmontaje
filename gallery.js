// gallery.js - Galería REAL desde Google Sheets

console.log("gallery.js cargado - versión final con Sheets");

window.addEventListener('load', function() {
  console.log("Página lista - inicializando galería real");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const designsGrid = document.getElementById('imgbb-designs-grid');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      console.log("Botón clicado - intentando cargar diseños desde Sheets");
      if (galleryOverlay) {
        galleryOverlay.style.display = 'flex';
        cargarGaleriaDesdeSheets(); // ¡Aquí carga los diseños reales!
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

// Función que lee tu Google Sheet a través del Apps Script
async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) {
    console.log("ERROR: No se encontró el grid");
    return;
  }

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">Cargando diseños desde Google Sheets...</div>';

  try {
    // ← REEMPLAZA ESTA URL con la tuya real del Apps Script (la que termina en /exec)
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec'); // ← ¡Pega aquí tu URL!

    if (!response.ok) {
      throw new Error('Error al conectar con Google Sheets');
    }

    const disenos = await response.json();

    grid.innerHTML = '';

    if (!disenos || disenos.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No hay diseños en la hoja de Sheets</div>';
      return;
    }

    disenos.forEach(d => {
      const item = document.createElement('div');
      item.style.cursor = 'pointer';
      item.style.textAlign = 'center';
      item.style.padding = '10px';
      item.style.borderRadius = '8px';
      item.style.background = '#f8f9fa';
      item.style.transition = 'background 0.2s';

      item.innerHTML = `
        <div style="width:120px; height:120px; margin:auto; background:#eee; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <img src="${d.url}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
        </div>
        <small style="display:block; margin-top:8px; color:#333;">${d.nombre || 'Sin nombre'}</small>
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
          const scaleToFit = Math.min(maxW / design.width, maxH / design.height);
          design.scale = Math.min(1, scaleToFit);
          designs.push(design);
          selectedDesignId = id;
          updateDesignsList();
          updateControls();
          drawCanvas();
          showMessage(`Diseño "${d.nombre}" cargado desde Sheets`, 'success', 2000);
          galleryOverlay.style.display = 'none';
        };
        img.onerror = () => showMessage('Error al cargar el diseño', 'error');
        img.src = d.url;
      });

      grid.appendChild(item);
    });

    console.log("Diseños cargados:", disenos.length);
  } catch (err) {
    console.error("Error al cargar galería:", err);
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
      Error al cargar diseños: ${err.message}<br>
      Revisa la consola (F12) para más detalles.
    </div>`;
  }
}