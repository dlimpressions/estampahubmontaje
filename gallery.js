// gallery.js - Galería de diseños (carga después de que la página esté lista)

console.log("gallery.js se cargó correctamente"); // Esto aparecerá en la consola para verificar

// Esperamos a que todo el HTML esté cargado
window.addEventListener('load', function() {
  console.log("Página completamente cargada - inicializando galería");

  const galleryOverlay = document.getElementById('imgbb-gallery-overlay');
  const designsGrid = document.getElementById('imgbb-designs-grid');
  const openGalleryBtn = document.getElementById('open-imgbb-gallery');
  const closeGalleryBtn = document.getElementById('close-imgbb-gallery');

  // Verificamos que encontramos los elementos
  if (!openGalleryBtn) {
    console.log("ERROR: No se encontró el botón #open-imgbb-gallery");
  }
  if (!galleryOverlay) {
    console.log("ERROR: No se encontró el modal #imgbb-gallery-overlay");
  }
  if (!designsGrid) {
    console.log("ERROR: No se encontró el grid #imgbb-designs-grid");
  }

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      console.log("Botón 'Mis Diseños ImgBB' clicado");
      if (galleryOverlay) {
        galleryOverlay.style.display = 'flex';
        cargarGaleriaPrueba(); // Función de prueba
      }
    });
  }

  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      console.log("Botón Cerrar clicado");
      if (galleryOverlay) {
        galleryOverlay.style.display = 'none';
      }
    });
  }
});

// Función de prueba simple (muestra un mensaje verde cuando abre)
function cargarGaleriaPrueba() {
  const grid = document.getElementById('imgbb-designs-grid');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; color:#48bb78; font-size:1.3rem; padding:50px;">
        ¡Funciona! La galería se abrió correctamente.<br>
        <small>(Pronto mostrará tus diseños de ImgBB)</small>
      </div>
    `;
  }
}