// profile.js - Manejo del modal de perfil y sesión
console.log("profile.js cargado - Perfil de usuario");

let userData = null;

// Función para abrir el modal de perfil
function openProfile() {
  const overlay = document.getElementById('profile-overlay');
  if (!overlay) {
    console.error("No se encontró el overlay de perfil");
    return;
  }

  overlay.style.display = 'flex';

  // Cargar datos del usuario desde localStorage (después del login)
  userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Mostrar datos
  document.getElementById('profile-user').textContent = userData.usuario || 'Usuario';
  document.getElementById('profile-name').textContent = userData.nombre || 'No configurado';
  document.getElementById('profile-email').textContent = userData.correo || 'No configurado';
  document.getElementById('profile-edad').textContent = userData.edad || 'No configurado';
  document.getElementById('profile-genero').textContent = userData.genero || 'No configurado';
  document.getElementById('profile-plan').textContent = userData.membresia || 'Básica';
  document.getElementById('profile-inicio').textContent = userData.fechaInicio || 'N/A';
  document.getElementById('profile-fin').textContent = userData.fechaFin || 'N/A';
  document.getElementById('profile-photo').src = userData.fotoPerfil || 'https://via.placeholder.com/120';

  // Llenar formulario de edición
  document.getElementById('edit-name').value = userData.nombre || '';
  document.getElementById('edit-email').value = userData.correo || '';
  document.getElementById('edit-photo').value = userData.fotoPerfil || '';
  document.getElementById('edit-edad').value = userData.edad || '';
  document.getElementById('edit-genero').value = userData.genero || '';
}

// Guardar cambios del perfil
function saveProfile() {
  const nombre = document.getElementById('edit-name').value.trim();
  const correo = document.getElementById('edit-email').value.trim();
  const foto = document.getElementById('edit-photo').value.trim();
  const edad = document.getElementById('edit-edad').value.trim();
  const genero = document.getElementById('edit-genero').value.trim();

  if (!nombre || !correo) {
    alert('Nombre y correo son obligatorios');
    return;
  }

  // Actualizar datos locales
  userData.nombre = nombre;
  userData.correo = correo;
  userData.fotoPerfil = foto;
  userData.edad = edad;
  userData.genero = genero;
  localStorage.setItem('userData', JSON.stringify(userData));

  // Actualizar visualmente
  openProfile();

  // Guardar en Sheets con URLSearchParams (mismo método que login, sin CORS)
fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec', {
  method: 'POST',
  body: new URLSearchParams({
    action: 'updateProfile',
    usuario: userData.usuario,
    token: userData.token,
    nombre: nombre,
    correo: correo,
    fotoPerfil: foto,
    edad: edad,
    genero: genero
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    showMessage('Perfil actualizado correctamente', 'success');
    openProfile(); // Recargar visual
  } else {
    showMessage('Error al guardar en servidor: ' + (data.message || 'Desconocido'), 'error');
  }
})
.catch(err => {
  console.error('Error fetch:', err);
  showMessage('Error de conexión al guardar. Verifica tu conexión.', 'error');
});

// Inicializar eventos del perfil
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-profile-btn');
  if (openBtn) {
    openBtn.addEventListener('click', openProfile);
  }

  const closeBtn = document.getElementById('close-profile');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('profile-overlay').style.display = 'none';
    });
  }

  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProfile();
    });
  }
});