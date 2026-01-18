// profile.js - Manejo del modal de perfil (versión corregida y segura)

console.log("profile.js cargado correctamente");

// Esperamos a que la página esté 100% cargada antes de agregar eventos
window.addEventListener('load', function() {
  console.log("Página completamente cargada - inicializando perfil");

  const openBtn = document.getElementById('open-profile-btn');
  const closeBtn = document.getElementById('close-profile');
  const form = document.getElementById('profile-form');
  const overlay = document.getElementById('profile-overlay');

  // Verificamos que existan los elementos
  if (!openBtn) console.error("No se encontró el botón #open-profile-btn");
  if (!closeBtn) console.error("No se encontró el botón #close-profile");
  if (!form) console.error("No se encontró el formulario #profile-form");
  if (!overlay) console.error("No se encontró el overlay #profile-overlay");

  // Abrir modal
  if (openBtn) {
    openBtn.addEventListener('click', function() {
      console.log("Botón Mi Perfil clicado");
      if (overlay) {
        overlay.style.display = 'flex';
      }
    });
  }

  // Cerrar modal
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      console.log("Cerrando modal de perfil");
      if (overlay) {
        overlay.style.display = 'none';
      }
    });
  }

  // Guardar cambios (sin fetch por ahora, para evitar errores)
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Intentando guardar perfil");

      // Solo actualizamos visualmente (para probar que el modal funciona)
      alert("¡Perfil guardado! (Por ahora solo visual - pronto conectaremos con Sheets)");

      // Cerramos el modal después de guardar
      if (overlay) overlay.style.display = 'none';
    });
  }
});