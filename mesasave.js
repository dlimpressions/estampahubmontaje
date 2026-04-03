// mesasave.js - Guardado con IndexedDB y exportación/importación a archivo .estampahub (botones mejorados)
console.log("✅ mesasave.js (unificado) cargado");

(function() {
  const DB_NAME = 'DTF_Workbench';
  const DB_VERSION = 1;
  const STORE_NAME = 'workbenches';
  let db = null;

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
      request.onerror = (event) => {
        console.error('Error abriendo IndexedDB', event);
        reject(event.target.error);
      };
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
      const putRequest = store.put(state);
      putRequest.onsuccess = () => {
        if (!silent) showMessage('✅ Mesa guardada en IndexedDB', 'success', 2000);
      };
      putRequest.onerror = (err) => {
        console.error('Error al guardar en IndexedDB', err);
        if (!silent) showMessage('❌ Error al guardar', 'error', 3000);
      };
    } catch (err) {
      console.error('Error en saveWorkbench', err);
      if (!silent) showMessage('❌ Error al guardar la mesa', 'error', 3000);
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
        console.log('Cargando mesa con', state.designs.length, 'diseños');

        // Restaurar lienzo (solo alto, el ancho es fijo)
        if (state.canvasHeightCm) {
          let newHeightCm = Math.min(100, Math.max(10, state.canvasHeightCm));
          if (newHeightCm !== CANVAS_HEIGHT_CM) {
            CANVAS_HEIGHT_CM = newHeightCm;
            const newPx = Math.round(CANVAS_HEIGHT_CM * PIXELS_PER_CM);
            canvas.height = newPx;
            canvasWrapper.style.height = newPx + 'px';
            if (canvasSizeLabel) canvasSizeLabel.textContent = `${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm`;
            if (specsLabel) specsLabel.textContent = `Lienzo: ${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm | Formato: PNG/PDF`;
            if (canvasHeightInput) canvasHeightInput.value = CANVAS_HEIGHT_CM;
            const tbCanvasHeight = document.getElementById('tb-canvas-height-cm');
            if (tbCanvasHeight) tbCanvasHeight.value = CANVAS_HEIGHT_CM;
          }
        }
        if (state.backgroundColor) {
          canvasBackgroundColor = state.backgroundColor;
          if (canvasColor) canvasColor.value = state.backgroundColor;
        }

        // Restaurar diseños
        const loadPromises = state.designs.map((designState, idx) => {
          return new Promise((resolve) => {
            const url = URL.createObjectURL(designState.blob);
            const img = new Image();
            let resolved = false;
            const timeoutId = setTimeout(() => {
              if (!resolved) {
                console.warn(`Timeout cargando diseño ${idx}`);
                URL.revokeObjectURL(url);
                resolve(null);
              }
            }, 10000);
            img.onload = () => {
              clearTimeout(timeoutId);
              resolved = true;
              URL.revokeObjectURL(url);
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
              URL.revokeObjectURL(url);
              console.error(`Error cargando imagen ${idx}:`, err);
              resolve(null);
            };
            img.src = url;
          });
        });

        const loadedDesigns = await Promise.all(loadPromises);
        const validDesigns = loadedDesigns.filter(d => d !== null);
        console.log(`Diseños cargados: ${validDesigns.length} de ${state.designs.length}`);

        if (validDesigns.length === 0) {
          showMessage('❌ No se pudo cargar ningún diseño (posiblemente corruptos)', 'error', 3000);
          if (loadingMsg) loadingMsg.remove();
          return;
        }

        designs.length = 0;
        validDesigns.forEach(d => designs.push(d));
        selectedDesignId = designs[0] ? designs[0].id : null;

        if (typeof updateDesignsList === 'function') updateDesignsList();
        if (typeof updateControls === 'function') updateControls();
        if (typeof drawCanvas === 'function') drawCanvas();
        if (typeof calcularPrecioMontaje === 'function') calcularPrecioMontaje();

        if (loadingMsg) loadingMsg.remove();
        showMessage(`✅ Mesa cargada (${validDesigns.length} diseños)`, 'success', 3000);
      };
      getRequest.onerror = (err) => {
        console.error('Error al cargar de IndexedDB', err);
        showMessage('❌ Error al leer la mesa guardada', 'error', 3000);
      };
    } catch (err) {
      console.error('Error en loadWorkbench', err);
      showMessage('❌ Error al cargar la mesa', 'error', 3000);
    }
  }

  // Exportar a archivo .estampahub
  async function exportToFile() {
    if (!designs || designs.length === 0) {
      showMessage('No hay diseños para exportar', 'warning', 2000);
      return;
    }
    try {
      const state = {
        version: 2,
        timestamp: Date.now(),
        canvasHeightCm: CANVAS_HEIGHT_CM,
        backgroundColor: canvasBackgroundColor,
        designs: []
      };
      for (const d of designs) {
        const canvasImg = document.createElement('canvas');
        canvasImg.width = d.image.width;
        canvasImg.height = d.image.height;
        const ctx = canvasImg.getContext('2d');
        ctx.drawImage(d.image, 0, 0);
        const imageDataURL = canvasImg.toDataURL('image/png');
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
      a.download = `mesa_estampahub_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.estampahub`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage(`✅ Mesa exportada (${designs.length} diseños)`, 'success', 3000);
    } catch (err) {
      console.error(err);
      showMessage('❌ Error al exportar', 'error', 3000);
    }
  }

  // Importar desde archivo .estampahub
  async function importFromFile(file) {
    if (!file) return;
    const loadingMsg = showMessage('⏳ Cargando archivo...', 'loading', 0);
    try {
      const text = await file.text();
      const state = JSON.parse(text);
      if (state.version !== 2) throw new Error('Versión de archivo no soportada');

      // Restaurar alto del lienzo (el ancho es fijo, no se modifica)
      let newHeightCm = Math.min(100, Math.max(10, state.canvasHeightCm));
      if (newHeightCm !== CANVAS_HEIGHT_CM) {
        CANVAS_HEIGHT_CM = newHeightCm;
        const newPx = Math.round(CANVAS_HEIGHT_CM * PIXELS_PER_CM);
        canvas.height = newPx;
        canvasWrapper.style.height = newPx + 'px';
        if (canvasSizeLabel) canvasSizeLabel.textContent = `${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm`;
        if (specsLabel) specsLabel.textContent = `Lienzo: ${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm | Formato: PNG/PDF`;
        if (canvasHeightInput) canvasHeightInput.value = CANVAS_HEIGHT_CM;
        const tbCanvasHeight = document.getElementById('tb-canvas-height-cm');
        if (tbCanvasHeight) tbCanvasHeight.value = CANVAS_HEIGHT_CM;
      }
      if (state.backgroundColor) {
        canvasBackgroundColor = state.backgroundColor;
        if (canvasColor) canvasColor.value = state.backgroundColor;
      }

      const loadPromises = state.designs.map((ds, idx) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const newDesign = new Design(ds.id, img);
          newDesign.x = ds.x;
          newDesign.y = ds.y;
          newDesign.scale = ds.scale;
          newDesign.rotation = ds.rotation;
          newDesign.opacity = ds.opacity;
          newDesign.width = ds.width;
          newDesign.height = ds.height;
          newDesign.originalWidth = ds.originalWidth;
          newDesign.originalHeight = ds.originalHeight;
          newDesign.aspectRatio = ds.aspectRatio;
          resolve(newDesign);
        };
        img.onerror = () => { console.warn(`Error imagen ${idx}`); resolve(null); };
        img.src = ds.imageDataURL;
      }));

      const loaded = await Promise.all(loadPromises);
      const valid = loaded.filter(d => d !== null);
      if (valid.length === 0) throw new Error('No se pudo cargar ningún diseño');

      designs.length = 0;
      valid.forEach(d => designs.push(d));
      selectedDesignId = valid[0] ? valid[0].id : null;

      if (typeof updateDesignsList === 'function') updateDesignsList();
      if (typeof updateControls === 'function') updateControls();
      if (typeof drawCanvas === 'function') drawCanvas();
      if (typeof calcularPrecioMontaje === 'function') calcularPrecioMontaje();

      loadingMsg.remove();
      showMessage(`✅ Mesa importada (${valid.length} diseños)`, 'success', 3000);
    } catch (err) {
      console.error(err);
      loadingMsg.remove();
      showMessage(`❌ Error al importar: ${err.message}`, 'error', 5000);
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
      gap: 10px;
      background: rgba(11,13,23,0.85);
      backdrop-filter: blur(8px);
      padding: 8px 12px;
      border-radius: 40px;
      border: 1px solid rgba(14,165,233,0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: 'DM Mono', monospace;
    `;

    // Botón Guardar (verde sólido)
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Guardar Mesa';
    saveBtn.style.cssText = `background: #10b981; border: none; color: white; padding: 6px 14px; border-radius: 30px; cursor: pointer; font-size: 0.8rem; font-weight: 700; font-family: inherit; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3); text-shadow: 0 0 1px rgba(0,0,0,0.3);`;
    saveBtn.onclick = () => saveWorkbench(false);

    // Botón Cargar (azul sólido)
    const loadBtn = document.createElement('button');
    loadBtn.textContent = '📂 Cargar Mesa';
    loadBtn.style.cssText = `background: #0ea5e9; border: none; color: white; padding: 6px 14px; border-radius: 30px; cursor: pointer; font-size: 0.8rem; font-weight: 700; font-family: inherit; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3); text-shadow: 0 0 1px rgba(0,0,0,0.3);`;
    loadBtn.onclick = () => loadWorkbench();

    // Botón Exportar (morado sólido)
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📤 Exportar';
    exportBtn.style.cssText = `background: #8b5cf6; border: none; color: white; padding: 6px 14px; border-radius: 30px; cursor: pointer; font-size: 0.8rem; font-weight: 700; font-family: inherit; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3); text-shadow: 0 0 1px rgba(0,0,0,0.3);`;
    exportBtn.onclick = () => exportToFile();

    // Botón Importar (naranja sólido)
    const importBtn = document.createElement('button');
    importBtn.textContent = '📂 Importar';
    importBtn.style.cssText = `background: #f59e0b; border: none; color: white; padding: 6px 14px; border-radius: 30px; cursor: pointer; font-size: 0.8rem; font-weight: 700; font-family: inherit; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3); text-shadow: 0 0 1px rgba(0,0,0,0.3);`;
    importBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.estampahub';
      input.onchange = (e) => importFromFile(e.target.files[0]);
      input.click();
    };

    container.appendChild(saveBtn);
    container.appendChild(loadBtn);
    container.appendChild(exportBtn);
    container.appendChild(importBtn);
    document.body.appendChild(container);

    // Auto-guardado cada 30 segundos
    setInterval(() => {
      if (designs && designs.length > 0) saveWorkbench(true);
    }, 30000);

    window.addEventListener('beforeunload', () => {
      if (designs && designs.length > 0) saveWorkbench(true);
    });

    console.log('✅ Botones de guardado/carga/exportación añadidos (estilo mejorado)');
  }

  function waitForEditor() {
    if (typeof designs !== 'undefined' && typeof drawCanvas === 'function') {
      initSaveButtons();
    } else {
      setTimeout(waitForEditor, 200);
    }
  }

  window.saveWorkbench = saveWorkbench;
  window.loadWorkbench = loadWorkbench;
  waitForEditor();
})();