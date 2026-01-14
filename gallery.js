// gallery.js - Galería REAL desde Google Sheets + carga en canvas

console.log("gallery.js cargado - versión FINAL con carga en canvas");

window.addEventListener('load', function() {
  console.log("Página lista - inicializando galería");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const designsGrid = document.getElementById('imgbb-designs-grid');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      console.log("Botón clicado - cargando diseños desde Sheets");
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

// Esta función carga los diseños desde tu Google Sheet
async function cargarGaleriaDesdeSheets() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (!grid) {
    console.log("ERROR: No se encontró el grid");
    return;
  }

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">Cargando tus diseños desde Google Sheets...</div>';

  try {
    // ← REEMPLAZA ESTA LÍNEA con la URL REAL de tu Apps Script (la que termina en /exec)
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec');

    if (!response.ok) {
      throw new Error('No se pudo conectar con Google Sheets. Revisa la URL o permisos.');
    }

    const disenos = await response.json();

    grid.innerHTML = '';

    if (!disenos || disenos.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">No hay diseños en tu hoja de Google Sheets</div>';
      return;
    }

    // Mostramos cada diseño como miniatura
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

      // ¡Aquí está la magia! Al clic, carga el diseño en el canvas
      item.addEventListener('click', () => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Necesario para evitar errores de CORS
        img.onload = () => {
          // Creamos un nuevo diseño usando la clase Design que ya tienes
          const id = 'sheet-' + Date.now();
          const design = new Design(id, img);
          
          // Ajustamos tamaño para que quepa bien en el canvas
          const maxW = canvas.width - 20;
          const maxH = canvas.height - 20;
          const scaleToFit = Math.min(maxW / design.width, maxH / design.height);
          design.scale = Math.min(1, scaleToFit);
          
          // Agregamos al array de diseños
          designs.push(design);
          selectedDesignId = id;
          
          // Actualizamos todo
          updateDesignsList();
          updateControls();
          drawCanvas();
          
          showMessage(`¡Diseño "${d.nombre}" cargado en el canvas!`, 'success', 3000);
          
          // Cerramos el modal automáticamente
          galleryOverlay.style.display = 'none';
        };

        img.onerror = () => {
          showMessage('Error al cargar el diseño (revisa que la URL sea pública y directa)', 'error');
        };

        img.src = d.url;
      });

      grid.appendChild(item);
    });

    console.log("Se cargaron", disenos.length, "diseños desde Sheets");
  } catch (err) {
    console.error("Error al cargar galería:", err);
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:40px;">
      Error al cargar: ${err.message}<br>
      <small>Verifica la URL del Apps Script y que la sheet esté compartida como "Cualquiera".</small>
    </div>`;
  }
}