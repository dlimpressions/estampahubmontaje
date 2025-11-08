/* ============================================================
   termofijadoras_oc.js
   Módulo para generar y descargar bonos de cashback
   por compra de termofijadoras.
   ============================================================ */

console.log('[OC Termofijadoras] cargado');

(function() {
  const ocOverlay = document.getElementById('oc-overlay');
  const openOCBtn = document.getElementById('open-oc-btn');
  const ocForm = document.getElementById('oc-form');
  const ocCancel = document.getElementById('oc-cancel');
  const ocResultCard = document.getElementById('oc-result-card');
  const ocFormCard = document.getElementById('oc-form-card');
  const ocCanvas = document.getElementById('oc-bono-canvas');
  const ocDownload = document.getElementById('oc-download');
  const ocNew = document.getElementById('oc-new');
  const ctx = ocCanvas?.getContext('2d');

  // ========== Mostrar / ocultar formulario ==========
  function showForm() {
    ocOverlay.style.display = 'flex';
    ocFormCard.style.display = 'block';
    ocResultCard.style.display = 'none';
  }
  function hideForm() {
    ocOverlay.style.display = 'none';
    ocForm.reset();
  }

  if (openOCBtn) openOCBtn.addEventListener('click', showForm);
  if (ocCancel) ocCancel.addEventListener('click', hideForm);

  // ========== Generar Bono ==========
  if (ocForm) {
    ocForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('oc-name').value.trim();
      const email = document.getElementById('oc-email').value.trim();
      const phone = document.getElementById('oc-phone').value.trim();
      const city = document.getElementById('oc-city').value.trim();
      const product = document.getElementById('oc-product').value.trim();
      const qty = parseInt(document.getElementById('oc-qty').value) || 1;

      if (!name || !email || !phone || !city || !product) {
        alert('Por favor completa todos los campos obligatorios.');
        return;
      }

      drawBono({ name, email, city, product, qty });
      ocFormCard.style.display = 'none';
      ocResultCard.style.display = 'block';
    });
  }

  // ========== Dibujo del bono en canvas ==========
  function drawBono({ name, email, city, product, qty }) {
    const w = ocCanvas.width;
    const h = ocCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#4299e1');
    grad.addColorStop(1, '#2b6cb0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Marco
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 8;
    ctx.strokeRect(15, 15, w - 30, h - 30);

    // Texto principal
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Segoe UI';
    ctx.fillText('🎁 BONO CASHBACK DTF', w / 2, 60);

    ctx.font = '22px Segoe UI';
    ctx.fillText('Por la compra de una Termofijadora', w / 2, 100);

    // Datos
    ctx.textAlign = 'left';
    ctx.font = '18px Segoe UI';
    const startY = 150;
    const line = 32;
    ctx.fillText(`👤 Nombre: ${name}`, 60, startY);
    ctx.fillText(`📧 Correo: ${email}`, 60, startY + line);
    ctx.fillText(`📍 Ciudad: ${city}`, 60, startY + 2 * line);
    ctx.fillText(`🛠️ Producto: ${product}`, 60, startY + 3 * line);
    ctx.fillText(`🔢 Cantidad: ${qty}`, 60, startY + 4 * line);

    // Valor y pie
    ctx.font = 'bold 28px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Valor cashback: $20.000', w / 2, h - 80);
    ctx.font = 'italic 16px Segoe UI';
    ctx.fillText('Redímelo en tu próxima compra DTF', w / 2, h - 40);
  }

  // ========== Descargar Bono ==========
  if (ocDownload) {
    ocDownload.addEventListener('click', () => {
      ocCanvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bono_cashback_dtf.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
      }, 'image/png');
    });
  }

  // ========== Nueva orden ==========
  if (ocNew) {
    ocNew.addEventListener('click', () => {
      ocResultCard.style.display = 'none';
      ocFormCard.style.display = 'block';
      ocForm.reset();
    });
  }

})();
