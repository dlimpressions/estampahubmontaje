(function () {
    const state = {
        activeRequests: 0,
        autoRefreshTimer: null,
        lastStatus: 'Listo',
        role: 'Crowdsourcing'
    };

    function ensureShell() {
        if (!document.getElementById('eh-livebar')) {
            const container = document.querySelector('.container') || document.body;
            const bar = document.createElement('div');
            bar.id = 'eh-livebar';
            bar.className = 'eh-livebar';
            bar.innerHTML = `
                <div class="eh-live-left">
                    <span class="eh-live-dot" id="eh-live-dot"></span>
                    <strong id="eh-live-role">${state.role}</strong>
                    <span id="eh-live-status">Listo para sincronizar</span>
                </div>
                <div class="eh-live-right">
                    <span class="eh-live-pill" id="eh-live-sync">Actualización en vivo</span>
                    <span id="eh-live-updated">Aún sin actualizar</span>
                </div>`;
            container.insertBefore(bar, container.firstChild);
        }
        if (!document.getElementById('eh-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'eh-overlay';
            overlay.className = 'eh-overlay';
            overlay.innerHTML = `
                <div class="eh-loader-card">
                    <div class="eh-loader-spinner"></div>
                    <div class="eh-loader-title" id="eh-loader-title">Procesando...</div>
                    <div class="eh-loader-subtitle" id="eh-loader-subtitle">Por favor espera mientras se ejecuta la acción.</div>
                </div>`;
            document.body.appendChild(overlay);
        }
        if (!document.getElementById('eh-toasts')) {
            const toasts = document.createElement('div');
            toasts.id = 'eh-toasts';
            toasts.className = 'eh-toasts';
            document.body.appendChild(toasts);
        }
    }

    function init(options = {}) {
        state.role = options.role || state.role;
        ensureShell();
        const role = document.getElementById('eh-live-role');
        if (role) role.textContent = state.role;
        setStatus('Listo · sincronización automática activa', 'ok');
    }

    function setStatus(message, type = 'ok') {
        ensureShell();
        state.lastStatus = message;
        const status = document.getElementById('eh-live-status');
        const dot = document.getElementById('eh-live-dot');
        if (status) status.textContent = message;
        if (dot) {
            dot.className = 'eh-live-dot';
            if (type === 'busy') dot.classList.add('busy');
            if (type === 'error') dot.classList.add('error');
        }
    }

    function setUpdated(label = 'Sincronizado') {
        ensureShell();
        const el = document.getElementById('eh-live-updated');
        if (el) el.textContent = `${label}: ${new Date().toLocaleTimeString()}`;
    }

    function showOverlay(title = 'Procesando...', subtitle = 'Por favor espera mientras se ejecuta la acción.') {
        ensureShell();
        document.getElementById('eh-loader-title').textContent = title;
        document.getElementById('eh-loader-subtitle').textContent = subtitle;
        document.getElementById('eh-overlay').classList.add('visible');
        setStatus(title, 'busy');
    }

    function hideOverlay() {
        const overlay = document.getElementById('eh-overlay');
        if (overlay) overlay.classList.remove('visible');
        if (state.activeRequests === 0) setStatus('Listo · esperando cambios', 'ok');
    }

    function toast(message, type = 'success', detail = '') {
        ensureShell();
        const wrap = document.getElementById('eh-toasts');
        const item = document.createElement('div');
        item.className = `eh-toast ${type}`;
        item.innerHTML = `${message}${detail ? `<small>${detail}</small>` : ''}`;
        wrap.appendChild(item);
        setTimeout(() => item.remove(), 4200);
    }

    async function withAction(title, callback, options = {}) {
        showOverlay(title, options.subtitle || 'Estamos guardando y sincronizando los datos.');
        try {
            const result = await callback();
            if (options.successMessage && (!result || result.success !== false)) toast(options.successMessage, 'success');
            setUpdated(options.updatedLabel || 'Actualizado');
            return result;
        } catch (error) {
            toast(options.errorMessage || 'No se pudo completar la acción', 'error', error.message || 'Intenta nuevamente.');
            setStatus('Error en la última acción', 'error');
            throw error;
        } finally {
            hideOverlay();
        }
    }

    async function withButton(button, label, callback) {
        if (!button) return callback();
        const original = button.innerHTML;
        button.disabled = true;
        button.classList.add('is-busy');
        button.innerHTML = label;
        try {
            return await callback();
        } finally {
            button.disabled = false;
            button.classList.remove('is-busy');
            button.innerHTML = original;
        }
    }

    function networkStart(action) {
        state.activeRequests += 1;
        setStatus(`Sincronizando ${action}...`, 'busy');
    }

    function networkEnd(ok = true) {
        state.activeRequests = Math.max(0, state.activeRequests - 1);
        if (state.activeRequests === 0) {
            setStatus(ok ? 'Datos sincronizados' : 'Error al sincronizar', ok ? 'ok' : 'error');
            if (ok) setUpdated('Última sincronización');
        }
    }

    function startAutoRefresh(tasks, interval = 30000) {
        stopAutoRefresh();
        let running = false;
        state.autoRefreshTimer = setInterval(async () => {
            if (running || document.hidden) return;
            running = true;
            try {
                setStatus('Buscando cambios en tiempo real...', 'busy');
                for (const task of tasks) {
                    if (!task || typeof task.run !== 'function') continue;
                    await task.run();
                }
                setUpdated('Auto-refresco');
                setStatus('Panel actualizado automáticamente', 'ok');
            } catch (error) {
                console.error('Auto refresh error:', error);
                setStatus('No se pudo auto-actualizar', 'error');
            } finally {
                running = false;
            }
        }, interval);
    }


    function projectFlowHtml(project = {}) {
        const hasWinner = Boolean(project.ganador_id || project.seleccionada);
        const paid = project.pagado === true || project.pagado === 'TRUE' || project.pagado === 'true';
        const delivered = Boolean(project.enlace_entrega);
        const closed = project.estado === 'cerrado' || hasWinner || paid || delivered;
        const steps = [
            { label: 'Publicado', hint: 'Proyecto visible', done: true, active: project.estado === 'abierto' && !hasWinner },
            { label: 'En propuestas', hint: 'Recibiendo ofertas', done: hasWinner || closed, active: project.estado === 'abierto' && !hasWinner },
            { label: 'Selección / pago', hint: 'Ganador y confirmación', done: paid || delivered, active: hasWinner && !paid },
            { label: 'Entrega final', hint: 'Archivo disponible', done: delivered, active: paid && !delivered }
        ];
        return `<div class="eh-project-flow" aria-label="Estado del proyecto">${steps.map(step => `<div class="eh-flow-step ${step.done ? 'done' : ''} ${step.active ? 'active' : ''}">${step.done ? '✓ ' : step.active ? '● ' : '○ '}${step.label}<span>${step.hint}</span></div>`).join('')}</div>`;
    }

    function stopAutoRefresh() {
        if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
        state.autoRefreshTimer = null;
    }

    window.CrowdUI = {
        init,
        setStatus,
        setUpdated,
        showOverlay,
        hideOverlay,
        toast,
        withAction,
        withButton,
        networkStart,
        networkEnd,
        startAutoRefresh,
        stopAutoRefresh,
        projectFlowHtml
    };
})();
