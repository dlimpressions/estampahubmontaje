// profile.js - Modo solo lectura con diagnóstico
window.addEventListener('load', function() {
  const openBtn  = document.getElementById('open-profile-btn');
  const closeBtn = document.getElementById('close-profile');
  const overlay  = document.getElementById('profile-overlay');

  if (openBtn) {
    openBtn.addEventListener('click', function() {
      overlay.style.display = 'flex';
      cargarPerfil();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      overlay.style.display = 'none';
    });
  }
});

function cargarPerfil() {
  let userData = {};
  try {
    userData = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch(e) {
    console.error('Error leyendo userData:', e);
  }

  console.log('Cargando perfil con datos:', userData);

  // Helper: asignar texto al elemento si existe
  function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || 'No disponible';
  }

  set('profile-user',    userData.usuario);
  set('profile-name',    userData.nombre);
  set('profile-email',   userData.correo);
  set('profile-edad',    userData.edad);
  set('profile-genero',  userData.genero);
  set('profile-plan',    userData.membresia || 'Básica');
  set('profile-inicio',  userData.fechaInicio);
  set('profile-fin',     userData.fechaFin);

  // Foto de perfil
  const foto = document.getElementById('profile-photo');
  if (foto) {
    foto.src = userData.fotoPerfil || 'https://via.placeholder.com/120';
    foto.onerror = () => { foto.src = 'https://via.placeholder.com/120'; };
  }

  // Si no hay datos, mostrar advertencia
  if (!userData.usuario) {
    console.warn('userData vacío — el login no guardó datos correctamente');
    const el = document.getElementById('profile-user');
    if (el) el.textContent = '⚠️ Inicia sesión de nuevo';
  }
}