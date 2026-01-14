// gallery.js - Contenedor de diseños desde Google Sheets

const imgbbGalleryOverlay = document.getElementById('imgbb-gallery-overlay');
const imgbbDesignsGrid = document.getElementById('imgbb-designs-grid');
const openImgbbGalleryBtn = document.getElementById('open-imgbb-gallery');
const closeImgbbGalleryBtn = document.getElementById('close-imgbb-gallery');

if (openImgbbGalleryBtn) {
  openImgbbGalleryBtn.addEventListener('click', () => {
    imgbbGalleryOverlay.style.display = 'flex';
    cargarGaleriaDesdeSheets(); // Carga los diseños
  });
}

if (closeImgbbGalleryBtn) {
  closeImgbbGalleryBtn.addEventListener('click', () => {
    imgbbGalleryOverlay.style.display = 'none';
  });
}

// Función para cargar desde Apps Script (reemplaza con tu URL)
async function cargarGaleriaDesdeSheets() {
  if (!imgbbDesignsGrid) return;

  imgbbDesignsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:30px;">Cargando...</div>';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJHoQbMyAyI8_kQ6-bSig_9QlSJL828ENWhx8O7kcXQoQsFlZ7GiKJAk87qlkopltI_g/exec'); // ← Pega la URL del web app de Paso 2
    const disenos = await response.json();

    imgbbDesignsGrid.innerHTML = '';

    if (disenos.length === 0) {
      imgbbDesignsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:30px;">No hay diseños en la sheet</div>';
      return;
    }

    disenos.forEach(d => {
      const item = document.createElement('div');
      item.style.cursor = 'pointer';
      item.style.textAlign = 'center';
      item.style.padding = '8px';
      item.style.borderRadius = '8px';
      item.style.transition = 'background 0.2s';
      item.style.background = '#f8f9fa';
      item.innerHTML = `
        <div style="width:120px; height:120px; margin:auto; background:#eee; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <img src="${d.url}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/120?text=Error';">
        </div>
        <small style="display:block; margin-top:6px; color:#333; font-weight:500;">${d.nombre}</small>
      `;

      item.addEventListener('mouseover', () => item.style.background = '#e2e8f0');
      item.addEventListener('mouseout', () => item.style.background = '#f8f9fa');

      item.addEventListener('click', () => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const id = 'imgbb-' + Date.now();
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
          showMessage(`Diseño "${d.nombre}" cargado`, 'success', 2000);
          imgbbGalleryOverlay.style.display = 'none'; // Cierra al cargar
        };
        img.onerror = () => showMessage('Error al cargar diseño', 'error');
        img.src = d.url;
      });

      imgbbDesignsGrid.appendChild(item);
    });
  } catch (err) {
    imgbbDesignsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#e53e3e; padding:30px;">Error al cargar diseños: ' + err.message + '</div>';
  }
}