// mesasave.js - Guardado con IndexedDB (soporta imágenes grandes) - VERSIÓN CORREGIDA (sin reasignar constantes)
console.log("✅ mesasave.js (IndexedDB) cargado");

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
        canvasWidthCm: CANVAS_WIDTH_CM,   // constante, solo lectura
        canvasHeightCm: CANVAS_HEIGHT_CM, // constante, solo lectura
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

        // Restaurar lienzo (alto) usando el método existente si es necesario
        if (state.canvasHeightCm && state.canvasHeightCm !== CANVAS_HEIGHT_CM) {
          // Simular el cambio de alto usando el input y botón existentes
          if (canvasHeightInput) {
            canvasHeightInput.value = state.canvasHeightCm;
            if (applyCanvasHeightBtn) applyCanvasHeightBtn.click();
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
          showMessage('❌ No se pudo cargar ningún diseño', 'error', 3000);
          if (loadingMsg) loadingMsg.remove();
          return;
        }

        // Reemplazar array global
        designs.length = 0;
        validDesigns.forEach(d => designs.push(d));
        selectedDesignId = designs[0] ? designs[0].id : null;

        // Actualizar UI
        if (typeof updateDesignsList === 'function') updateDesignsList();
        if (typeof updateControls === 'function') updateControls();
        if (typeof drawCanvas === 'function') drawCanvas();

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
      gap: 10px;
      background: rgba(11,13,23,0.85);
      backdrop-filter: blur(8px);
      padding: 8px 12px;
      border-radius: 40px;
      border: 1px solid rgba(14,165,233,0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: 'DM Mono', monospace;
    `;
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Guardar Mesa';
    saveBtn.style.cssText = `
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: white;
      padding: 6px 14px;
      border-radius: 30px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: inherit;
      transition: 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    `;
    saveBtn.onmouseenter = () => saveBtn.style.transform = 'scale(1.02)';
    saveBtn.onmouseleave = () => saveBtn.style.transform = 'scale(1)';
    saveBtn.onclick = () => saveWorkbench(false);

    const loadBtn = document.createElement('button');
    loadBtn.textContent = '📂 Cargar Mesa';
    loadBtn.style.cssText = `
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      border: none;
      color: white;
      padding: 6px 14px;
      border-radius: 30px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: inherit;
      transition: 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    `;
    loadBtn.onmouseenter = () => loadBtn.style.transform = 'scale(1.02)';
    loadBtn.onmouseleave = () => loadBtn.style.transform = 'scale(1)';
    loadBtn.onclick = () => loadWorkbench();

    container.appendChild(saveBtn);
    container.appendChild(loadBtn);
    document.body.appendChild(container);

    setInterval(() => {
      if (designs && designs.length > 0) {
        saveWorkbench(true);
      }
    }, 30000);

    window.addEventListener('beforeunload', () => {
      if (designs && designs.length > 0) {
        saveWorkbench(true);
      }
    });

    console.log('✅ Botones de guardado/carga con IndexedDB añadidos');
  }

  window.saveWorkbench = saveWorkbench;
  window.loadWorkbench = loadWorkbench;
  waitForEditor();
})();