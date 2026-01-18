// profile.js - Versión estable para cargar perfil

console.log("profile.js cargado");

window.addEventListener('load', function() {
  const openBtn = document.getElementById('open-profile-btn');
  const closeBtn = document.getElementById('close-profile');
  const overlay = document.getElementById('profile-overlay');
  const form = document.getElementById('profile-form');

  if (openBtn) {
    openBtn.addEventListener('click', function() {
      console.log("Abriendo perfil");
      if (overlay) overlay.style.display = 'flex';

      // Cargar datos
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      document.getElementById('profile-user').textContent = userData.usuario || 'Usuario';
      document.getElementById('profile-name').textContent = userData.nombre || 'No configurado';
      document.getElementById('profile-email').textContent = userData.correo || 'No configurado';
      document.getElementById('profile-edad').textContent = userData.edad || 'No configurado';
      document.getElementById('profile-genero').textContent = userData.genero || 'No configurado';
      document.getElementById('profile-plan').textContent = userData.membresia || 'Básica';
      document.getElementById('profile-inicio').textContent = userData.fechaInicio || 'N/A';
      document.getElementById('profile-fin').textContent = userData.fechaFin || 'N/A';
      document.getElementById('profile-photo').src = userData.fotoPerfil || 'https://via.placeholder.com/120';

      // Llenar formulario
      document.getElementById('edit-name').value = userData.nombre || '';
      document.getElementById('edit-email').value = userData.correo || '';
      document.getElementById('edit-photo').value = userData.fotoPerfil || '';
      document.getElementById('edit-edad').value = userData.edad || '';
      document.getElementById('edit-genero').value = userData.genero || '';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      if (overlay) overlay.style.display = 'none';
    });
  }

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      alert("¡Perfil guardado! (Próximamente se guardará en Google Sheets)");
      if (overlay) overlay.style.display = 'none';
    });
  }
});