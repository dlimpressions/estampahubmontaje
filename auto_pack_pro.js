/* ============================================================
   Auto-Pack PRO para Editor DTF
   - Botón "🧠 Ordenar diseños (Pro)"
   - Empaquetado tipo "guillotine" (más compacto que estanterías)
   - Respeta tamaño y rotación del usuario. Opción de rotación auto 90° por diseño.
   - Usa el borde "apretado" (ignora transparencia) para calcular espacios.
   - Espaciado configurable en cm.
   Requisitos del editor:
     - window.designs (array de objetos con: image, x, y, scale, rotation, width, height, opacity)
     - window.canvas (HTMLCanvasElement)
     - window.drawCanvas() (función para repintar)
     - window.PIXELS_PER_CM (número; si no existe, se usa 10)
   ============================================================ */
(function(){
  // ========= Helpers UI =========
  function msg(text, type, ms){
    if (typeof window.showMessage === 'function'){
      return window.showMessage(text, type || 'info', ms == null ? 2500 : ms);
    } else {
      console.log(`[${type||'info'}]`, text);
    }
  }
  function ensureEnv(){
    if (!window.canvas || !window.designs || !Array.isArray(window.designs)){
      throw new Error('No encuentro el lienzo o la lista de diseños (window.canvas / window.designs).');
    }
    if (typeof window.drawCanvas !== 'function'){
      throw new Error('No encuentro drawCanvas() para refrescar.');
    }
    if (typeof window.PIXELS_PER_CM !== 'number'){
      window.PIXELS_PER_CM = 10; // fallback
    }
  }

  // ========= BBox apretado (ignorando transparencia) =========
  // Cache por imagen y umbral de alpha
  const tightCache = new WeakMap();
  function getTightBBox(img, alphaThr){
    alphaThr = alphaThr == null ? 10 : alphaThr; // 0..255
    const cKey = tightCache.get(img);
    if (cKey && cKey._thr === alphaThr) return cKey;

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    const data = x.getImageData(0,0,w,h).data;

    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y=0; y<h; y++){
      for (let i=y*w, dx=0; dx<w; dx++, i++){
        const k = i*4;
        const a = data[k+3];
        if (a > alphaThr){
          if (dx < minX) minX = dx;
          if (dx > maxX) maxX = dx;
          if (y  < minY) minY = y;
          if (y  > maxY) maxY = y;
        }
      }
    }
    // Si todo es transparente, usa toda el área para no romper cálculos
    if (maxX < 0 || maxY < 0){
      minX = 0; minY = 0; maxX = w-1; maxY = h-1;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const out = {minX, minY, maxX, maxY, cx, cy, _thr: alphaThr, imgW: w, imgH: h};
    tightCache.set(img, out);
    return out;
  }

  // ========= AABB (eje-alineado) tras escalar y rotar =========
  function getAABBAfterTransform(design){
    const img = design.image;
    const t = getTightBBox(img, 10);
    const scale = design.scale || 1;
    const theta = (design.rotation || 0) * Math.PI/180;

    // tamaño del rectángulo "apretado" antes de transform
    const w0 = (t.maxX - t.minX + 1) * scale;
    const h0 = (t.maxY - t.minY + 1) * scale;

    const cos = Math.cos(theta), sin = Math.sin(theta);
    const wAABB = Math.abs(w0 * cos) + Math.abs(h0 * sin);
    const hAABB = Math.abs(w0 * sin) + Math.abs(h0 * cos);

    // Diferencia entre centro del contenido y centro de la imagen
    const imgCx = (design.width || img.width) / 2;
    const imgCy = (design.height|| img.height) / 2;
    const dx_img = (imgCx - t.cx) * scale;
    const dy_img = (imgCy - t.cy) * scale;

    // Rotar ese delta a coordenadas del lienzo
    const dx = dx_img * cos - dy_img * sin;
    const dy = dx_img * sin + dy_img * cos;

    return { wAABB, hAABB, dx, dy };
  }

  // ========= Variante con posible rotación 90° (opcional) =========
  function getBestAABBWithOptionalQuarterTurn(design, allowAutoRotate90){
    const base = getAABBAfterTransform(design);
    if (!allowAutoRotate90) return { best: base, rotated: false };

    // Probar sumar 90° temporariamente
    const originalRot = design.rotation || 0;
    design.rotation = (originalRot + 90) % 360;
    const alt = getAABBAfterTransform(design);
    design.rotation = originalRot; // revertimos

    const areaBase = base.wAABB * base.hAABB;
    const areaAlt  = alt.wAABB  * alt.hAABB;

    // Elegir la que ocupe menos área (mejor apilado)
    if (areaAlt + 1e-3 < areaBase) {
      return { best: alt, rotated: true };
    }
    return { best: base, rotated: false };
  }

  // ========= Empaquetado "Guillotine" (bin packing 2D) =========
  // Representa un rectángulo libre disponible
  function rect(x, y, w, h){ return {x, y, w, h}; }

  // Busca un espacio libre donde quepa (w,h). Estrategia: mejor área sobrante (best area fit)
  function findFreeRect(freeRects, w, h){
    let bestIdx = -1, bestArea = Infinity;
    for (let i=0; i<freeRects.length; i++){
      const fr = freeRects[i];
      if (w <= fr.w && h <= fr.h){
        const waste = (fr.w * fr.h) - (w * h);
        if (waste < bestArea){
          bestArea = waste;
          bestIdx = i;
        }
      }
    }
    return bestIdx;
  }

  // Corta el rectángulo libre usado en dos rects (guillotine split) y elimina el original
  function splitFreeRectangles(freeRects, idx, used){
    const fr = freeRects[idx];
    freeRects.splice(idx, 1); // quitar rect original

    const wR = fr.w - used.w;
    const hB = fr.h - used.h;

    // Heurística: dividir según mayor espacio
    const splitHorizontalFirst = (used.w * fr.h) > (fr.w * used.h);

    if (splitHorizontalFirst){
      // Columna derecha + fila inferior
      if (wR > 0) freeRects.push(rect(fr.x + used.w, fr.y, wR, used.h));
      if (hB > 0) freeRects.push(rect(fr.x, fr.y + used.h, fr.w, hB));
    } else {
      // Fila inferior + columna derecha
      if (hB > 0) freeRects.push(rect(fr.x, fr.y + used.h, used.w, hB));
      if (wR > 0) freeRects.push(rect(fr.x + used.w, fr.y, wR, fr.h));
    }

    // Opcional: merge simple (limpieza de rectángulos adyacentes)
    mergeFreeRects(freeRects);
  }

  // Une rectángulos libres contiguos si comparten borde y dimensión compatible
  function mergeFreeRects(freeRects){
    let merged = true;
    while (merged){
      merged = false;
      outer: for (let i=0; i<freeRects.length; i++){
        for (let j=i+1; j<freeRects.length; j++){
          const a = freeRects[i], b = freeRects[j];
          // Mismo X y ancho, verticalmente adyacentes
          if (a.x === b.x && a.w === b.w && (a.y + a.h === b.y || b.y + b.h === a.y)) {
            const ny = Math.min(a.y, b.y);
            const nh = a.h + b.h;
            freeRects.splice(j,1); freeRects.splice(i,1);
            freeRects.push(rect(a.x, ny, a.w, nh));
            merged = true; break outer;
          }
          // Mismo Y y alto, horizontalmente adyacentes
          if (a.y === b.y && a.h === b.h && (a.x + a.w === b.x || b.x + b.w === a.x)) {
            const nx = Math.min(a.x, b.x);
            const nw = a.w + b.w;
            freeRects.splice(j,1); freeRects.splice(i,1);
            freeRects.push(rect(nx, a.y, nw, a.h));
            merged = true; break outer;
          }
        }
      }
    }
  }

  // ========= Ordenación PRO =========
  function autoPackDesignsPRO(spacingPx, allowAutoRotate90){
    ensureEnv();
    const W = window.canvas.width;
    const H = window.canvas.height;
    const margin = Math.max(0, Math.round(spacingPx || 0));

    if (!window.designs.length){
      msg('No hay diseños para ordenar.', 'warning', 2000);
      return;
    }

    // Construimos lista de items con sus AABB y posible rotación 90° si conviene.
    // Ordenamos por lado mayor descendente (mejora la calidad del packing).
    const items = window.designs.map(d => {
      const probe = getBestAABBWithOptionalQuarterTurn(d, !!allowAutoRotate90);
      // guardamos también el AABB base sin la rotación para poder aplicar luego (si se decide)
      return {
        design: d,
        aabb: probe.best,
        wouldRotate90: probe.rotated
      };
    }).sort((A, B) => {
      const aMax = Math.max(A.aabb.wAABB, A.aabb.hAABB);
      const bMax = Math.max(B.aabb.wAABB, B.aabb.hAABB);
      return bMax - aMax;
    });

    // Rectángulos libres iniciales: todo el lienzo menos el margen externo (si quisieras).
    const freeRects = [ rect(0 + margin, 0 + margin, W - 2*margin, H - 2*margin) ];

    let placed = 0;
    let overflow = 0;

    for (const it of items){
      const d = it.design;
      // Ancho/alto a colocar: AABB + espaciado
      const w = Math.ceil(it.aabb.wAABB) + margin;
      const h = Math.ceil(it.aabb.hAABB) + margin;

      // Buscar hueco (sin rotar AABB)
      let idx = findFreeRect(freeRects, w, h);
      let rotatedUsed = false;

      // Si no cabe y permitimos auto 90°, intentamos con AABB volteado
      if (idx < 0 && allowAutoRotate90){
        const idxR = findFreeRect(freeRects, h, w);
        if (idxR >= 0) { idx = idxR; rotatedUsed = true; }
      }

      if (idx < 0){
        overflow++;
        continue; // no cabe
      }

      // Usaremos el tamaño que cupo (posiblemente rotado AABB)
      const used = rotatedUsed ? { w: h, h: w } : { w, h };
      const fr = freeRects[idx];

      // Colocamos "usado" en la esquina superior izquierda del rect libre
      const placeX = fr.x;
      const placeY = fr.y;

      // Ahora posicionamos el diseño de modo que el centro del AABB quede centrado dentro del bloque "sin margen"
      const usableW = used.w - margin; // ancho real del AABB (sin el padding lateral)
      const usableH = used.h - margin;

      const cx = placeX + usableW/2 + margin/2;
      const cy = placeY + usableH/2 + margin/2;

      // Si el AABB "ganador" requería sumar 90° para ser mejor, aplícalo al diseño real (si user lo permitió).
      if (allowAutoRotate90 && (it.wouldRotate90 ^ rotatedUsed)) {
        // Si "mejor" decía 90° pero el hueco cupo en sin rotar, no forzamos. Solo giramos si realmente usamos la orientación rotada
        // o si explícitamente "mejor" y hueco en esa orientación.
        // Para simplificar, si el rectángulo usado es el volteado, sumamos 90°.
        d.rotation = ((d.rotation || 0) + 90) % 360;
        // Recalcular los deltas con la rotación aplicada
        it.aabb = getAABBAfterTransform(d);
      } else if (allowAutoRotate90 && it.wouldRotate90 && rotatedUsed) {
        d.rotation = ((d.rotation || 0) + 90) % 360;
        it.aabb = getAABBAfterTransform(d);
      }

      // Posicionar el diseño en el centro deseado ajustando el offset dx,dy de su AABB
      d.x = cx - it.aabb.dx;
      d.y = cy - it.aabb.dy;

      // Split del rectángulo libre usado
      splitFreeRectangles(freeRects, idx, used);

      placed++;
    }

    if (typeof window.updateDesignsList === 'function'){
      window.updateDesignsList();
    }
    window.drawCanvas();

    if (overflow > 0){
      msg(`Ordenado PRO. ${overflow} diseño(s) no cupieron en el lienzo.`, 'warning', 4500);
    } else {
      msg('Ordenado PRO completado ✅', 'success', 2500);
    }
  }

  // ========= Inyectar botón en UI =========
  function placeButton(){
    // Buscar sección "Controles de Diseño"
    const toolsSection = Array.from(document.querySelectorAll('.controls .tool-section, .tool-section'))
      .find(sec => /Controles de Diseño/i.test(sec.textContent || ''));

    // Si no existe, lo ponemos en la última .controls o .toolbar
    const parent = toolsSection || document.querySelector('.controls') || document.querySelector('.toolbar');
    if (!parent) return;
    if (document.getElementById('auto-pack-pro-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.id = 'auto-pack-pro-btn';
    btn.textContent = '🧠 Ordenar diseños (Pro)';
    parent.appendChild(btn);

    btn.addEventListener('click', ()=>{
      try {
        ensureEnv();
        const defCm = 0.8; // espaciado por defecto en cm
        let val = prompt('Espacio entre diseños (en cm):', String(defCm));
        if (val === null) return;
        let cm = parseFloat(val);
        if (!isFinite(cm) || cm < 0) cm = defCm;

        const rotateAns = prompt('¿Permitir rotación automática de 90° si ayuda? (si/no)', 'si');
        const allowAutoRotate90 = (rotateAns || '').trim().toLowerCase().startsWith('s');

        const spacingPx = cm * (window.PIXELS_PER_CM || 10);
        msg('Empaquetando (Pro)…', 'loading', 0);
        setTimeout(()=> {
          autoPackDesignsPRO(spacingPx, allowAutoRotate90);
        }, 50);
      } catch(err){
        msg('Error al ordenar PRO: ' + (err && err.message ? err.message : err), 'error', 5000);
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', placeButton);
  } else {
    placeButton();
  }
})();
