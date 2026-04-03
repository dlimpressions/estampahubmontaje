// mesasave.js - Guardado con IndexedDB (soporta imágenes grandes)
console.log("✅ mesasave.js (IndexedDB) cargado");

(function() {
  const DB_NAME = 'DTF_Workbench';
  const DB_VERSION = 1;
  const STORE_NAME = 'workbenches';

  let db = null;

  // Abrir (o crear) la base de datos IndexedDB
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

  // Guardar el estado actual en IndexedDB
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

      // Convertir cada diseño a Blob (formato más eficiente que base64)
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
        if (!silent) showMessage('❌ Error al guardar (quizá el espacio es insuficiente)', 'error', 3000);
      };
    } catch (err) {
      console.error('Error en saveWorkbench', err);
      if (!silent) showMessage('❌ Error al guardar la mesa', 'error', 3000);
    }
  }

  // Cargar el estado desde IndexedDB
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

        showMessage('Cargando mesa...', 'loading', 0);
        const loadingMsg = document.querySelector('.message.loading:last-child');

        // Restaurar lienzo
        if (state.canvasWidthCm) CANVAS_WIDTH_CM = state.canvasWidthCm;
        if (state.canvasHeightCm) {
          CANVAS_HEIGHT_CM = state.canvasHeightCm;
          const newPx = Math.round(CANVAS_HEIGHT_CM * PIXELS_PER_CM);
          canvas.height = newPx;
          canvasWrapper.style.height = newPx + 'px';
          if (canvasSizeLabel) canvasSizeLabel.textContent = `${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm`;
          if (specsLabel) specsLabel.textContent = `Lienzo: ${CANVAS_WIDTH_CM}cm × ${CANVAS_HEIGHT_CM}cm | Formato: PNG/PDF`;
        }
        if (state.backgroundColor) {
          canvasBackgroundColor = state.backgroundColor;
          if (canvasColor) canvasColor.value = state.backgroundColor;
        }

        // Restaurar diseños desde los Blobs
        const loadPromises = state.designs.map(async (designState) => {
          const url = URL.createObjectURL(designState.blob);
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              URL.revokeObjectURL(url);
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
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve(null);
            };
            img.src = url;
          });
        });

        const loadedDesigns = await Promise.all(loadPromises);
        designs.length = 0;
        loadedDesigns.forEach(d => { if (d) designs.push(d); });
        if (designs.length > 0) selectedDesignId = designs[0].id;
        else selectedDesignId = null;

        updateDesignsList();
        updateControls();
        drawCanvas();
        if (loadingMsg) loadingMsg.remove();
        showMessage(`✅ Mesa cargada (${designs.length} diseños)`, 'success', 3000);
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

  // Esperar a que el editor esté listo y crear los botones
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

    // Auto-guardado cada 30 segundos
    setInterval(() => {
      if (designs && designs.length > 0) {
        saveWorkbench(true);
      }
    }, 30000);

    // Guardar antes de cerrar
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