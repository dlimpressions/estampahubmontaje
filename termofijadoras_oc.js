/* ============================================================
   termofijadoras_oc.js
   Orden de compra de termofijadoras + ruleta de bono cashback.
   IMPORTANTE: no cambiar SHEET_URL; es el enlace que guarda datos.
   ============================================================ */

console.log('[OC Termofijadoras] cargado');

(function () {
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

  const FIXED_CASHBACK = 20000;
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyg5T9tQG4NeQYydRAYSPHFgDiUHDtR8HnT9P84yNHW1G4eGLa3Z_niQxDlKVo_Keitdg/exec';

  if (!ocOverlay || !openOCBtn || !ocForm || !ocFormCard || !ocResultCard || !ocCanvas || !ctx) {
    return;
  }

  function currency(value) {
    return `$${Number(value).toLocaleString('es-CO')}`;
  }

  function showForm() {
    ocOverlay.style.display = 'flex';
    ocFormCard.style.display = 'block';
    ocResultCard.style.display = 'none';
  }

  function hideForm() {
    ocOverlay.style.display = 'none';
    ocForm.reset();
  }

  function getOrderData() {
    return {
      name: document.getElementById('oc-name').value.trim(),
      email: document.getElementById('oc-email').value.trim(),
      phone: document.getElementById('oc-phone').value.trim(),
      city: document.getElementById('oc-city').value.trim(),
      product: document.getElementById('oc-product').value.trim(),
      qty: parseInt(document.getElementById('oc-qty').value, 10) || 1,
      cashback: FIXED_CASHBACK
    };
  }

  function validateOrder(order) {
    return order.name && order.email && order.phone && order.city && order.product && order.qty > 0;
  }

  async function saveOrder(order) {
    const payload = new URLSearchParams({
      name: order.name,
      email: order.email,
      phone: order.phone,
      city: order.city,
      product: order.product,
      qty: order.qty,
      cashback: order.cashback
    });

    const response = await fetch(SHEET_URL, {
      method: 'POST',
      body: payload
    });

    return response;
  }

  function buildRouletteOverlay() {
    const prizes = [5000, 10000, 20000, 15000];
    const roulette = document.createElement('div');
    roulette.style.position = 'fixed';
    roulette.style.inset = '0';
    roulette.style.zIndex = '4000';
    roulette.style.display = 'flex';
    roulette.style.alignItems = 'center';
    roulette.style.justifyContent = 'center';
    roulette.style.padding = '18px';
    roulette.style.background = 'rgba(0,0,0,0.82)';
    roulette.style.backdropFilter = 'blur(10px)';
    roulette.innerHTML = `
      <div style="width:min(430px,100%);padding:24px;border:1px solid rgba(0,212,255,.28);border-radius:28px;background:linear-gradient(160deg,#071125,#0b1935);color:#eef7ff;text-align:center;box-shadow:0 24px 90px rgba(0,0,0,.55)">
        <span style="display:inline-flex;margin-bottom:12px;padding:7px 12px;border-radius:999px;background:rgba(0,255,159,.1);color:#baffdf;font:700 12px 'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase">Bono especial</span>
        <h2 style="margin:0 0 14px;color:#ff3b30;font:900 30px 'Exo 2',sans-serif">Gira y reclama tu premio</h2>
        <div style="position:relative;width:280px;height:280px;margin:0 auto 18px;border:8px solid #d9f4ff;border-radius:50%;background:#061226;box-shadow:0 0 42px rgba(0,212,255,.22)">
          <canvas id="wheelCanvas" width="260" height="260" style="position:absolute;top:50%;left:50%;border-radius:50%;transform:translate(-50%,-50%)"></canvas>
          <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:38px;filter:drop-shadow(0 4px 4px rgba(0,0,0,.45))">🎁</div>
        </div>
        <button id="spinBtn" style="min-height:46px;padding:0 24px;border:0;border-radius:999px;background:linear-gradient(135deg,#d80f16,#ff6b00);color:#fff;font:900 16px 'Exo 2',sans-serif;cursor:pointer">Girar ruleta</button>
      </div>
    `;
    document.body.appendChild(roulette);

    const wheelCanvas = roulette.querySelector('#wheelCanvas');
    const wctx = wheelCanvas.getContext('2d');
    const segAngle = (2 * Math.PI) / prizes.length;
    const colors = ['#d80f16', '#ff9f1c', '#00a86b', '#08265c'];

    prizes.forEach((prize, index) => {
      wctx.beginPath();
      wctx.moveTo(130, 130);
      wctx.arc(130, 130, 130, index * segAngle, (index + 1) * segAngle);
      wctx.fillStyle = colors[index];
      wctx.fill();
      wctx.save();
      wctx.translate(130, 130);
      wctx.rotate(index * segAngle + segAngle / 2);
      wctx.fillStyle = '#fff';
      wctx.font = '900 19px Exo 2, Segoe UI, sans-serif';
      wctx.textAlign = 'right';
      wctx.fillText(currency(prize), 114, 8);
      wctx.restore();
    });

    wctx.beginPath();
    wctx.arc(130, 130, 34, 0, Math.PI * 2);
    wctx.fillStyle = '#071125';
    wctx.fill();
    wctx.fillStyle = '#00ff9f';
    wctx.font = '900 18px Exo 2, Segoe UI, sans-serif';
    wctx.textAlign = 'center';
    wctx.fillText('DTF', 130, 137);

    return { roulette, wheelCanvas, prizes };
  }

  function startRouletteAnimation(callback) {
    const { roulette, wheelCanvas, prizes } = buildRouletteOverlay();
    const spinBtn = roulette.querySelector('#spinBtn');

    spinBtn.addEventListener('click', () => {
      spinBtn.disabled = true;
      spinBtn.textContent = 'Girando...';
      const segIndex20k = prizes.indexOf(FIXED_CASHBACK);
      const segSize = 360 / prizes.length;
      const centerDeg = segIndex20k * segSize + segSize / 2;
      const targetDeg = 1440 + (270 - centerDeg);
      const duration = 4600;
      const start = performance.now();
      const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

      function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const angle = targetDeg * easeOutCubic(progress);
        wheelCanvas.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
        if (progress < 1) {
          requestAnimationFrame(animate);
          return;
        }
        setTimeout(() => {
          roulette.innerHTML = `
            <div style="width:min(420px,100%);padding:28px;border-radius:28px;background:linear-gradient(160deg,#071125,#102454);color:#eef7ff;text-align:center;border:1px solid rgba(0,255,159,.28);box-shadow:0 24px 90px rgba(0,0,0,.55)">
              <div style="font-size:52px">🎉</div>
              <h2 style="margin:8px 0;color:#00ff9f;font:900 32px 'Exo 2',sans-serif">¡Ganaste!</h2>
              <p style="font-size:18px;margin:0">Cashback para impresión DTF</p>
              <strong style="display:block;margin:10px 0 18px;color:#ffbc42;font:900 48px 'Exo 2',sans-serif">${currency(FIXED_CASHBACK)}</strong>
              <button id="continueBtn" style="min-height:46px;padding:0 24px;border:0;border-radius:999px;background:linear-gradient(135deg,#00d4ff,#7b2fff);color:#fff;font:900 16px 'Exo 2',sans-serif;cursor:pointer">Ver bono</button>
            </div>
          `;
          roulette.querySelector('#continueBtn').addEventListener('click', () => {
            roulette.remove();
            callback();
          });
        }, 600);
      }
      requestAnimationFrame(animate);
    });
  }

  function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  function drawBono({ name, email, city, product, qty, cashback }) {
  const w = ocCanvas.width;
  const h = ocCanvas.height;
  ctx.clearRect(0, 0, w, h);

  // === FONDO CON GRADIENTE MODERNO ===
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#0a0e27');
  gradient.addColorStop(0.3, '#121a4a');
  gradient.addColorStop(0.7, '#1a0a2e');
  gradient.addColorStop(1, '#0d0d2b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // === BORDE DECORATIVO CON DEGRADADO ===
  const borderGrad = ctx.createLinearGradient(0, 0, w, h);
  borderGrad.addColorStop(0, '#00d4ff');
  borderGrad.addColorStop(0.5, '#7b2fff');
  borderGrad.addColorStop(1, '#00ff9f');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 6;
  roundRect(ctx, 20, 20, w - 40, h - 40, 30);
  ctx.stroke();

  // === BORDE INTERIOR SUTIL ===
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, 35, 35, w - 70, h - 70, 22);
  ctx.stroke();

  // === TÍTULO PRINCIPAL CON GLOW ===
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 30;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 38px Exo 2, Segoe UI, sans-serif';
  ctx.fillText('🎁 BONO CASHBACK DTF', w / 2, 72);
  ctx.shadowBlur = 0;

  // === LÍNEA DECORATIVA ===
  const gradLine = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
  gradLine.addColorStop(0, 'transparent');
  gradLine.addColorStop(0.3, '#00d4ff');
  gradLine.addColorStop(0.7, '#7b2fff');
  gradLine.addColorStop(1, 'transparent');
  ctx.strokeStyle = gradLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, 90);
  ctx.lineTo(w * 0.8, 90);
  ctx.stroke();

  // === MONTO DEL CASHBACK ===
  ctx.shadowColor = '#ffbc42';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffbc42';
  ctx.font = '900 86px Exo 2, Segoe UI, sans-serif';
  ctx.fillText(currency(cashback), w / 2, 180);
  ctx.shadowBlur = 0;

  // === SUBTÍTULO ===
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 20px Exo 2, Segoe UI, sans-serif';
  ctx.fillText('Por la compra de una termofijadora plana profesional', w / 2, 218);

  // === TARJETA DE DATOS DEL CLIENTE ===
  const cardX = 60;
  const cardY = 248;
  const cardW = w - 120;
  const cardH = 160;

  // Fondo de la tarjeta
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 20;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Borde sutil
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.stroke();

  // === DATOS DEL CLIENTE ===
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 14px DM Mono, monospace';
  ctx.fillText('CLIENTE', cardX + 20, cardY + 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 20px Exo 2, Segoe UI, sans-serif';
  ctx.fillText(name, cardX + 20, cardY + 64);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 14px DM Mono, monospace';
  ctx.fillText('CORREO', cardX + 20, cardY + 96);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 18px Exo 2, Segoe UI, sans-serif';
  ctx.fillText(email, cardX + 20, cardY + 124);

  // === LADO DERECHO DE LA TARJETA (CIUDAD + PRODUCTO) ===
  const rightX = cardX + cardW / 2 + 20;

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 14px DM Mono, monospace';
  ctx.fillText('CIUDAD', rightX, cardY + 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 20px Exo 2, Segoe UI, sans-serif';
  ctx.fillText(city, rightX, cardY + 64);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 14px DM Mono, monospace';
  ctx.fillText('PRODUCTO', rightX, cardY + 96);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 18px Exo 2, Segoe UI, sans-serif';
  ctx.fillText(`${product} · ${qty} unidad(es)`, rightX, cardY + 124);

  // === LÍNEA DIVISORIA EN LA TARJETA ===
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(cardX + cardW / 2, cardY + 18);
  ctx.lineTo(cardX + cardW / 2, cardY + cardH - 18);
  ctx.stroke();
  ctx.setLineDash([]);

  // === MENSAJE FINAL ===
  const msgY = cardY + cardH + 48;
  ctx.shadowColor = 'rgba(0,212,255,0.2)';
  ctx.shadowBlur = 15;

  // Fondo del mensaje
  ctx.fillStyle = 'rgba(0,212,255,0.08)';
  roundRect(ctx, 80, msgY - 6, w - 160, 48, 24);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '600 18px Exo 2, Segoe UI, sans-serif';
  ctx.fillText('🎯 Redímelo en tu próxima compra de impresión DTF', w / 2, msgY + 28);

  // === FOOTER ===
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '400 13px Exo 2, Segoe UI, sans-serif';
  ctx.fillText('*Aplican términos y condiciones · Bono personal e intransferible', w / 2, h - 28);

  // === ESQUINAS DECORATIVAS ===
  const cornerSize = 28;
  const cornerOffset = 34;
  const corners = [
    [cornerOffset, cornerOffset, 1, 1],
    [w - cornerOffset, cornerOffset, -1, 1],
    [cornerOffset, h - cornerOffset, 1, -1],
    [w - cornerOffset, h - cornerOffset, -1, -1]
  ];

  ctx.strokeStyle = 'rgba(0,212,255,0.25)';
  ctx.lineWidth = 2;
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * cornerSize, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cornerSize);
    ctx.stroke();
  });
}
