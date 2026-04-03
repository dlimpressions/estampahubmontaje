// mesasave.js - Guardado local (IndexedDB) + Exportar/Importar archivo .estampahub
console.log("✅ mesasave.js v2 - con exportar/importar archivo");

(function() {
  const DB_NAME = 'DTF_Workbench';
  const DB_VERSION = 1;
  const STORE_NAME = 'workbenches';
  let db = null;

  // ---------- IndexedDB (guardado automático) ----------
  function openDB() {
    return new Promise((resolve, reject) => {
      if (db && db.name === DB_NAME) {
        resolve(db);
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const dbRef = event.target.result;
        if (!dbRef.objectStoreNames.contains(STORE_NAME)) {
          dbRef.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async function saveWorkbench(silent = false) {
    if (!designs || designs.length === 0) {
      if (!silent) showMessage('No hay diseños para guardar', 'warning', 2000);
      return;
    }
    try {
      await openDB();
      const state = {
        id: 'current',
        timestamp: Date.now(),
        canvasWidthCm: CANVAS_WIDTH_CM,
        canvasHeightCm: CANVAS_HEIGHT_CM,
        backgroundColor: canvasBackgroundColor,
        designs: []
      };
      const designPromises = designs.map(async (d) => {
        const blob = await new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = d.image.width;
          canvas.height = d.image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(d.image, 0, 0);
          canvas.toBlob(resolve, 'image/png');
        });
        return {
          id: d.id,
          x: d.x,
          y: d.y,
          scale: d.scale,
          rotation: d.rotation,
          opacity: d.opacity,
          width: d.width,
          height: d.height,
          originalWidth: d.originalWidth,
          originalHeight: d.originalHeight,
          aspectRatio: d.aspectRatio,
          blob: blob
        };
      });
      state.designs = await Promise.all(designPromises);
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(state);
      if (!silent) showMessage('✅ Mesa guardada en IndexedDB', 'success', 2000);
    } catch (err) {
      console.error('Error en saveWorkbench', err);
      if (!silent) showMessage('❌ Error al guardar', 'error', 3000);
    }
  }

  async function loadWorkbench() {
    try {
      await openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get('current');
      getRequest.onsuccess = async (event) => {
        const state = event.target.result;
        if (!state || !state.designs || !state.designs.length) {
          showMessage('No hay ninguna mesa guardada', 'warning', 2000);
          return;
        }
        const loadingMsg = showMessage('⏳ Cargando mesa...', 'loading', 0);
        await restoreFromState(state);
        if (loadingMsg) loadingMsg.remove();
        showMessage(`✅ Mesa cargada (${designs.length} diseños)`, 'success', 3000);
      };
      getRequest.onerror = () => showMessage('❌ Error al leer la mesa guardada', 'error', 3000);
    } catch (err) {
      showMessage('❌ Error al cargar la mesa', 'error', 3000);
    }
  }

  // ---------- Exportar a archivo .estampahub ----------
  async function exportToFile() {
    if (!designs || designs.length === 0) {
      showMessage('No hay diseños para exportar', 'warning', 2000);
      return;
    }
    const loadingMsg = showMessage('📦 Preparando archivo...', 'loading', 0);
    try {
      const state = {
        version: 1,
        createdAt: new Date().toISOString(),
        canvasWidthCm: CANVAS_WIDTH_CM,
        canvasHeightCm: CANVAS_HEIGHT_CM,
        backgroundColor: canvasBackgroundColor,
        designs: []
      };
      for (const d of designs) {
        const canvas = document.createElement('canvas');
        canvas.width = d.image.width;
        canvas.height = d.image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(d.image, 0, 0);
        const imageDataURL = canvas.toDataURL('image/png');
        state.designs.push({
          id: d.id,
          x: d.x,
          y: d.y,
          scale: d.scale,
          rotation: d.rotation,
          opacity: d.opacity,
          width: d.width,
          height: d.height,
          originalWidth: d.originalWidth,
          originalHeight: d.originalHeight,
          aspectRatio: d.aspectRatio,
          imageDataURL: imageDataURL
        });
      }
      const jsonStr = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `montaje_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.estampahub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (loadingMsg) loadingMsg.remove();
      showMessage('✅ Mesa exportada correctamente', 'success', 3000);
    } catch (err) {
      if (loadingMsg) loadingMsg.remove();
      showMessage('❌ Error al exportar: ' + err.message, 'error', 4000);
    }
  }

  // ---------- Importar desde archivo .estampahub ----------
  function importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.estampahub,.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const loadingMsg = showMessage('📂 Importando archivo...', 'loading', 0);
      try {
        const text = await file.text();
        const state = JSON.parse(text);
        if (!state.version || !state.designs || !state.designs.length) {
          throw new Error('El archivo no tiene un formato válido');
        }
        // Convertir las imageDataURL de vuelta a objetos imagen
        for (const d of state.designs) {
          if (!d.imageDataURL) throw new Error('Faltan datos de imagen');
        }
        await restoreFromState(state);
        if (loadingMsg) loadingMsg.remove();
        showMessage(`✅ Mesa importada (${designs.length} diseños)`, 'success', 3000);
      } catch (err) {
        if (loadingMsg) loadingMsg.remove();
        showMessage('❌ Error al importar: ' + err.message, 'error', 4000);
      }
    };
    input.click();
  }

  // Función común para restaurar el estado (desde IndexedDB o desde archivo)
  async function restoreFromState(state) {
    // Restaurar lienzo
    if (state.canvasWidthCm) CANVAS_WIDTH_CM = state.canvasWidthCm;
    if (state.canvasHeightCm) {
      CANVAS_HEIGHT_CM = state.canvasHeightCm;
      const newPx = Math.round(CANVAS_HEIGHT_CM * PIXELS_PER_CM);
      canvas.height = newPx;
      canvasWrapper.style.height = newPx + 'px';
      if (canvasSizeLabel) canvasSizeLabel.textContent = `${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm`;
      if (specsLabel) specsLabel.textContent = `Lienzo: ${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm | Formato: PNG/PDF`;
      if (canvasHeightInput) canvasHeightInput.value = CANVAS_HEIGHT_CM;
      const tbCanvasHeight = document.getElementById('tb-canvas-height-cm');
      if (tbCanvasHeight) tbCanvasHeight.value = CANVAS_HEIGHT_CM;
      calcularPrecioMontaje();
    }
    if (state.backgroundColor) {
      canvasBackgroundColor = state.backgroundColor;
      if (canvasColor) canvasColor.value = state.backgroundColor;
    }

    // Cargar imágenes
    const loadPromises = state.designs.map((designState, idx) => {
      return new Promise((resolve) => {
        const img = new Image();
        const url = designState.imageDataURL || (designState.blob ? URL.createObjectURL(designState.blob) : null);
        if (!url) {
          console.warn(`Diseño ${idx} sin datos de imagen`);
          resolve(null);
          return;
        }
        let resolved = false;
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            console.warn(`Timeout cargando diseño ${idx}`);
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
            resolve(null);
          }
        }, 10000);
        img.onload = () => {
          clearTimeout(timeoutId);
          resolved = true;
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          try {
            const newDesign = new Design(designState.id, img);
            newDesign.x = designState.x;
            newDesign.y = designState.y;
            newDesign.scale = designState.scale;
            newDesign.rotation = designState.rotation;
            newDesign.opacity = designState.opacity;
            newDesign.width = designState.width;
            newDesign.height = designState.height;
            newDesign.originalWidth = designState.originalWidth;
            newDesign.originalHeight = designState.originalHeight;
            newDesign.aspectRatio = designState.aspectRatio;
            resolve(newDesign);
          } catch (err) {
            console.error(`Error creando diseño ${idx}:`, err);
            resolve(null);
          }
        };
        img.onerror = (err) => {
          clearTimeout(timeoutId);
          resolved = true;
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          console.error(`Error cargando imagen ${idx}:`, err);
          resolve(null);
        };
        img.src = url;
      });
    });
    const loadedDesigns = await Promise.all(loadPromises);
    const validDesigns = loadedDesigns.filter(d => d !== null);
    if (validDesigns.length === 0) throw new Error('No se pudo cargar ningún diseño');
    designs.length = 0;
    validDesigns.forEach(d => designs.push(d));
    selectedDesignId = designs[0] ? designs[0].id : null;
    if (typeof updateDesignsList === 'function') updateDesignsList();
    if (typeof updateControls === 'function') updateControls();
    if (typeof drawCanvas === 'function') drawCanvas();
  }

  // ---------- Botones ----------
  function waitForEditor() {
    if (typeof designs !== 'undefined' && typeof drawCanvas === 'function') {
      initSaveButtons();
    } else {
      setTimeout(waitForEditor, 200);
    }
  }

  function initSaveButtons() {
    const container = document.createElement('div');
    container.id = 'mesa-save-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 9999;
      display: flex;
      gap: 8px;
      background: rgba(11,13,23,0.85);
      backdrop-filter: blur(8px);
      padding: 8px 12px;
      border-radius: 40px;
      border: 1px solid rgba(14,165,233,0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: 'DM Mono', monospace;
      flex-wrap: wrap;
    `;

    const saveLocalBtn = document.createElement('button');
    saveLocalBtn.textContent = '💾 Guardar (local)';
    saveLocalBtn.style.cssText = `background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; padding: 6px 12px; border-radius: 30px; cursor: pointer; font-size: 0.75rem; font-weight: 600;`;
    saveLocalBtn.onclick = () => saveWorkbench(false);

    const loadLocalBtn = document.createElement('button');
    loadLocalBtn.textContent = '📂 Cargar (local)';
    loadLocalBtn.style.cssText = `background: linear-gradient(135deg, #0ea5e9, #0284c7); border: none; color: white; padding: 6px 12px; border-radius: 30px; cursor: pointer; font-size: 0.75rem; font-weight: 600;`;
    loadLocalBtn.onclick = () => loadWorkbench();

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📤 Exportar (.estampahub)';
    exportBtn.style.cssText = `background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; color: white; padding: 6px 12px; border-radius: 30px; cursor: pointer; font-size: 0.75rem; font-weight: 600;`;
    exportBtn.onclick = () => exportToFile();

    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 Importar (.estampahub)';
    importBtn.style.cssText = `background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: white; padding: 6px 12px; border-radius: 30px; cursor: pointer; font-size: 0.75rem; font-weight: 600;`;
    importBtn.onclick = () => importFromFile();

    container.appendChild(saveLocalBtn);
    container.appendChild(loadLocalBtn);
    container.appendChild(exportBtn);
    container.appendChild(importBtn);
    document.body.appendChild(container);

    // Auto-guardado cada 30 segundos (solo local)
    setInterval(() => {
      if (designs && designs.length > 0) saveWorkbench(true);
    }, 30000);
    window.addEventListener('beforeunload', () => {
      if (designs && designs.length > 0) saveWorkbench(true);
    });
    console.log('✅ Botones de guardado/carga/exportar/importar añadidos');
  }

  window.saveWorkbench = saveWorkbench;
  window.loadWorkbench = loadWorkbench;
  window.exportToFile = exportToFile;
  window.importFromFile = importFromFile;
  waitForEditor();
})();