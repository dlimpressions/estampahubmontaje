// profile.js - Solo muestra datos (modo lectura)

window.addEventListener('load', function() {
  const openBtn = document.getElementById('open-profile-btn');
  const closeBtn = document.getElementById('close-profile');
  const overlay = document.getElementById('profile-overlay');

  if (openBtn) {
    openBtn.addEventListener('click', function() {
      overlay.style.display = 'flex';

      // Cargar datos del login
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      document.getElementById('profile-user').textContent = userData.usuario || 'Usuario';
      document.getElementById('profile-name').textContent = userData.nombre || 'No disponible';
      document.getElementById('profile-email').textContent = userData.correo || 'No disponible';
      document.getElementById('profile-edad').textContent = userData.edad || 'No disponible';
      document.getElementById('profile-genero').textContent = userData.genero || 'No disponible';
      document.getElementById('profile-plan').textContent = userData.membresia || 'Básica';
      document.getElementById('profile-inicio').textContent = userData.fechaInicio || 'N/A';
      document.getElementById('profile-fin').textContent = userData.fechaFin || 'N/A';
      document.getElementById('profile-photo').src = userData.fotoPerfil || 'https://via.placeholder.com/120';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      overlay.style.display = 'none';
    });
  }
});