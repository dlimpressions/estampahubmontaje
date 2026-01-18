// Perfil y sesión única
let userData = null;

function openProfile() {
  const overlay = document.getElementById('profile-overlay');
  overlay.style.display = 'flex';

  // Cargar datos del usuario
  userData = JSON.parse(localStorage.getItem('userData') || '{}');
  document.getElementById('profile-user').textContent = userData.usuario || 'Usuario';
  document.getElementById('profile-name').textContent = userData.nombre || 'Cargando...';
  document.getElementById('profile-email').textContent = userData.correo || 'Cargando...';
  document.getElementById('profile-edad').textContent = userData.edad || 'Cargando...';
  document.getElementById('profile-genero').textContent = userData.genero || 'Cargando...';
  document.getElementById('profile-plan').textContent = userData.membresia || 'Básica';
  document.getElementById('profile-inicio').textContent = userData.fechaInicio || 'N/A';
  document.getElementById('profile-fin').textContent = userData.fechaFin || 'N/A';
  document.getElementById('profile-photo').src = userData.fotoPerfil || 'https://via.placeholder.com/120';

  document.getElementById('edit-name').value = userData.nombre || '';
  document.getElementById('edit-email').value = userData.correo || '';
  document.getElementById('edit-photo').value = userData.fotoPerfil || '';
  document.getElementById('edit-edad').value = userData.edad || '';
  document.getElementById('edit-genero').value = userData.genero || '';
}

function saveProfile() {
  const nombre = document.getElementById('edit-name').value;
  const correo = document.getElementById('edit-email').value;
  const foto = document.getElementById('edit-photo').value;
  const edad = document.getElementById('edit-edad').value;
  const genero = document.getElementById('edit-genero').value;

  // Actualizar localStorage
  userData.nombre = nombre;
  userData.correo = correo;
  userData.fotoPerfil = foto;
  userData.edad = edad;
  userData.genero = genero;
  localStorage.setItem('userData', JSON.stringify(userData));

  // Actualizar en Sheets
  fetch('https://script.google.com/macros/s/AKfycbz2PEEGbuX_jHPqye8a4qaheFUyfdxsyj8j5DZB-2St_7pi47RM1wPG_P-TvJGzsiT4XQ/exec', {
    method: 'POST',
    body: JSON.stringify({
      action: 'updateProfile',
      usuario: userData.usuario,
      token: userData.token,
      nombre: nombre,
      correo: correo,
      fotoPerfil: foto,
      edad: edad,
      genero: genero
    })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      showMessage('Perfil actualizado correctamente', 'success');
      openProfile(); // Recargar visual
    } else {
      showMessage('Error al guardar en servidor', 'error');
    }
  });
}

document.getElementById('profile-form').addEventListener('submit', e => {
  e.preventDefault();
  saveProfile();
});

// Botón para abrir perfil
document.getElementById('open-profile-btn').addEventListener('click', openProfile);

// Cerrar modal perfil
document.getElementById('close-profile').addEventListener('click', () => {
  document.getElementById('profile-overlay').style.display = 'none';
});