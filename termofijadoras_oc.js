/* ============================================================ 
   termofijadoras_oc.js
   Ruleta con 🎁 centrado arriba. Premios 5k / 10k / 20k / 15k.
   Siempre cae EXACTO en $20k (sector verde).
   Envío automático a Google Sheets.
   ============================================================ */

console.log('[OC Termofijadoras] cargado');

(function() {
  const ocOverlay   = document.getElementById('oc-overlay');
  const openOCBtn   = document.getElementById('open-oc-btn');
  const ocForm      = document.getElementById('oc-form');
  const ocCancel    = document.getElementById('oc-cancel');
  const ocResultCard= document.getElementById('oc-result-card');
  const ocFormCard  = document.getElementById('oc-form-card');
  const ocCanvas    = document.getElementById('oc-bono-canvas');
  const ocDownload  = document.getElementById('oc-download');
  const ocNew       = document.getElementById('oc-new');
  const ctx         = ocCanvas?.getContext('2d');

  const FIXED_CASHBACK = 20000;
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyg5T9tQG4NeQYydRAYSPHFgDiUHDtR8HnT9P84yNHW1G4eGLa3Z_niQxDlKVo_Keitdg/exec';

  // ===== Mostrar / ocultar formulario =====
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
  if (ocCancel)  ocCancel.addEventListener('click', hideForm);

  // ===== Generar Bono (con animación de ruleta) =====
  if (ocForm) {
    ocForm.addEventListener('submit', e => {
      e.preventDefault();

      const name    = document.getElementById('oc-name').value.trim();
      const email   = document.getElementById('oc-email').value.trim();
      const phone   = document.getElementById('oc-phone').value.trim();
      const city    = document.getElementById('oc-city').value.trim();
      const product = document.getElementById('oc-product').value.trim();
      const qty     = parseInt(document.getElementById('oc-qty').value) || 1;

      if (!name || !email || !phone || !city || !product) {
        alert('Por favor completa todos los campos obligatorios.');
        return;
      }

      // === Enviar datos a Google Sheets ===
      fetch(SHEET_URL, {
        method: 'POST',
        body: new URLSearchParams({
          name,
          email,
          phone,
          city,
          product,
          qty,
          cashback: FIXED_CASHBACK
        })
      })
      .then(() => {
        console.log('✅ Datos enviados a Google Sheets');
      })
      .catch(err => {
        console.error('❌ Error al enviar datos', err);
        alert('❌ Error al registrar tu orden. Intenta nuevamente.');
      });

      // Mostrar ruleta y luego el bono
      startRouletteAnimation(() => {
        drawBono({ name, email, city, product, qty, cashback: FIXED_CASHBACK });
        ocFormCard.style.display = 'none';
        ocResultCard.style.display = 'block';
      });
    });
  }

  // ===== Animación de ruleta =====
  function startRouletteAnimation(callback) {
    const prizes = [5000, 10000, 20000, 15000];
    const roulette = document.createElement('div');
    roulette.style.position = 'fixed';
    roulette.style.inset = '0';
    roulette.style.background = 'rgba(0,0,0,0.8)';
    roulette.style.display = 'flex';
    roulette.style.flexDirection = 'column';
    roulette.style.alignItems = 'center';
    roulette.style.justifyContent = 'center';
    roulette.style.zIndex = '4000';
    roulette.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:2rem;text-align:center;max-width:350px;box-shadow:0 0 20px rgba(0,0,0,0.5)">
        <h2 style="color:#2b6cb0;margin-bottom:1rem;">🎡 ¡Gira para conocer tu premio!</h2>
        <div style="position:relative;width:232px;height:232px;margin:auto;border:6px solid #2b6cb0;border-radius:50%;box-sizing:border-box;">
          <canvas id="wheelCanvas" width="220" height="220"
            style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                   border-radius:50%;">
          </canvas>
          <div style="position:absolute;top:0;left:50%;transform:translate(-50%,-55%);
                      font-size:28px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.35));">🎁</div>
        </div>
        <button id="spinBtn" style="margin-top:1.5rem;padding:.8rem 1.2rem;border:none;border-radius:8px;background:#48bb78;color:#fff;font-weight:600;cursor:pointer;">Girar</button>
      </div>
    `;
    document.body.appendChild(roulette);

    const wheelCanvas = roulette.querySelector('#wheelCanvas');
    const wctx = wheelCanvas.getContext('2d');
    const segs = prizes.length;
    const segAngle = (2 * Math.PI) / segs;
    const colors = ['#F56565', '#ED8936', '#48BB78', '#4299E1'];

    for (let i = 0; i < segs; i++) {
      wctx.beginPath();
      wctx.moveTo(110, 110);
      wctx.arc(110, 110, 110, i * segAngle, (i + 1) * segAngle);
      wctx.fillStyle = colors[i];
      wctx.fill();
      wctx.save();
      wctx.translate(110, 110);
      wctx.rotate(i * segAngle + segAngle / 2);
      wctx.fillStyle = '#fff';
      wctx.font = 'bold 16px Segoe UI';
      wctx.textAlign = 'right';
      wctx.fillText(`$${(prizes[i] / 1000)}k`, 90, 5);
      wctx.restore();
    }

    const spinBtn = roulette.querySelector('#spinBtn');
    spinBtn.addEventListener('click', () => {
      spinBtn.disabled = true;

      const segIndex20k = prizes.indexOf(20000);
      const segSize = 360 / segs;
      const centerDeg = segIndex20k * segSize + segSize / 2;
      const targetDeg = 1080 + (270 - centerDeg);

      const duration = 5000;
      const start = performance.now();
      function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

      function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const angle = targetDeg * eased;
        wheelCanvas.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
        if (progress < 1) requestAnimationFrame(animate);
        else {
          setTimeout(() => {
            roulette.innerHTML = `
              <div style="background:#fff;border-radius:12px;padding:2rem;text-align:center;max-width:350px;">
                <h2 style="color:#2b6cb0;">🎉 ¡Felicidades!</h2>
                <p style="font-size:20px;margin:.5rem 0;">Ganaste un Cashback de:</p>
                <h1 style="color:#48bb78;font-size:32px;">$${FIXED_CASHBACK.toLocaleString()}</h1>
                <button id="continueBtn" style="margin-top:1rem;padding:.8rem 1.2rem;border:none;border-radius:8px;background:#4299E1;color:#fff;font-weight:600;cursor:pointer;">Continuar</button>
              </div>
            `;
            roulette.querySelector('#continueBtn').addEventListener('click', () => {
              roulette.remove();
              callback();
            });
          }, 600);
        }
      }
      requestAnimationFrame(animate);
    });
  }

  // ===== Dibujo del bono =====
  function drawBono({ name, email, city, product, qty, cashback }) {
    const w = ocCanvas.width;
    const h = ocCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => {
      const aspect = bgImg.width / bgImg.height;
      const canvasAspect = w / h;
      let drawWidth, drawHeight;
      if (aspect > canvasAspect) {
        drawHeight = h;
        drawWidth = h * aspect;
      } else {
        drawWidth = w;
        drawHeight = w / aspect;
      }
      ctx.drawImage(bgImg, (w - drawWidth)/2, (h - drawHeight)/2, drawWidth, drawHeight);

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const logoW = 300;
        const logoH = 300;
        const logoX = (w / 2) - (logoW / 2);
        const logoY = (h / 2) - (logoH / 2);
        ctx.globalAlpha = 0.15;
        ctx.drawImage(logo, logoX, logoY, logoW, logoH);
        ctx.globalAlpha = 1;
        drawBonoContent(ctx, w, h, { name, email, city, product, qty, cashback });
      };
      logo.src = 'https://i.ibb.co/2wp1vDb/logo.jpg';
    };
    bgImg.src = 'https://i.ibb.co/LhbcjVGh/stylish-black-wavy-background-for-business-cards-presentations-banners-etc-vector.jpg';
  }

  function drawBonoContent(ctx, w, h, { name, email, city, product, qty, cashback }) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, w - 30, h - 30);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Segoe UI';
    ctx.fillText('🎁 BONO CASHBACK DTF', w / 2, 60);
    ctx.font = '22px Segoe UI';
    ctx.fillText('Por la compra de una Termofijadora', w / 2, 100);

    ctx.textAlign = 'left';
    ctx.font = '18px Segoe UI';
    const startY = 150;
    const line = 32;
    ctx.fillText(`👤 Nombre: ${name}`, 60, startY);
    ctx.fillText(`📧 Correo: ${email}`, 60, startY + line);
    ctx.fillText(`📍 Ciudad: ${city}`, 60, startY + 2 * line);
    ctx.fillText(`🛠️ Producto: ${product}`, 60, startY + 3 * line);
    ctx.fillText(`🔢 Cantidad: ${qty}`, 60, startY + 4 * line + 5);

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Segoe UI';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(`Valor Cashback: $${cashback.toLocaleString()}`, w / 2, h - 80);

    ctx.font = 'italic 16px Segoe UI';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 3;
    ctx.fillText('Redímelo en tu próxima compra DTF', w / 2, h - 40);
  }

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

  if (ocNew) {
    ocNew.addEventListener('click', () => {
      ocResultCard.style.display = 'none';
      ocFormCard.style.display = 'block';
      ocForm.reset();
    });
  }

})();
