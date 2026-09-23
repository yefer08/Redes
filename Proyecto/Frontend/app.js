// CONFIGURACIÓN DE ENDPOINT
const API_URL = 'http://localhost:3000'; // Usa tu IP IPv4 si vas a probar desde el celular en la LAN

document.addEventListener('DOMContentLoaded', () => {
    // --- 0. CONTROL DE SESIÓN Y AUTENTICACIÓN ---
    verificarSesion();

    // Formulario de Login
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUser').value;
        const password = document.getElementById('loginPass').value;
        const errorEl = document.getElementById('loginError');

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('usuario_redes', JSON.stringify(data.user));
                document.getElementById('loginOverlay').style.display = 'none';
                if (errorEl) errorEl.style.display = 'none';
                obtenerItems();
            } else {
                if (errorEl) {
                    errorEl.textContent = data.error || 'Credenciales incorrectas';
                    errorEl.style.display = 'block';
                }
            }
        } catch (err) {
            if (errorEl) {
                errorEl.textContent = 'Error de conexión con el servidor';
                errorEl.style.display = 'block';
            }
        }
    });

    // --- 1. INICIALIZAR SISTEMA Y TELEMETRÍA ---
    obtenerItems();
    medirLatencia();

    // --- 2. LÓGICA DEL SIMULADOR DE FIREWALL Y PUERTOS ---
    const portToggles = document.querySelectorAll('.port-toggle');
    const summaryTitle = document.getElementById('summaryTitle');
    const openPortsCount = document.getElementById('openPortsCount');
    const externalAccess = document.getElementById('externalAccess');
    const policyStatus = document.getElementById('policyStatus');

    const updateFirewallSummary = () => {
        if (!summaryTitle || !openPortsCount) return;
        const activePorts = [...portToggles].filter((toggle) => toggle.classList.contains('active')).length;
        const isOpen = activePorts >= 3;

        summaryTitle.textContent = isOpen ? 'Conexión de red estable' : 'Acceso restringido';
        openPortsCount.textContent = String(activePorts);
        if (externalAccess) externalAccess.textContent = isOpen ? 'Permitido (0.0.0.0)' : 'Bloqueado';
        if (policyStatus) {
            policyStatus.textContent = isOpen ? 'Sockets TCP Activos' : 'Filtro Estricto';
            policyStatus.style.color = isOpen ? '#10b981' : '#fbbf24';
        }
    };

    portToggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            toggle.classList.toggle('inactive');
            updateFirewallSummary();
        });
    });

    updateFirewallSummary();

    // Scroll suave a la sección de diagnóstico
    document.querySelector('.secondary-btn')?.addEventListener('click', () => {
        document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' });
    });
});

// FUNCIÓN PARA VERIFICAR SESIÓN
function verificarSesion() {
    const sesion = localStorage.getItem('usuario_redes');
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        if (sesion) {
            overlay.style.display = 'none';
        } else {
            overlay.style.display = 'flex';
        }
    }
}

// FUNCIÓN PARA CERRAR SESIÓN
function cerrarSesion() {
    localStorage.removeItem('usuario_redes');
    location.reload();
}

// --- 3. FUNCIONALIDAD CRUD (CONEXIÓN BACKEND & MYSQL) ---

// OBTENER REGISTROS (HTTP GET)
async function obtenerItems() {
    const t0 = performance.now();
    try {
        const res = await fetch(`${API_URL}/items`);
        const t1 = performance.now();
        
        actualizarEstado('ONLINE', Math.round(t1 - t0));

        const json = await res.json();
        const list = document.getElementById('itemsList');
        const counter = document.getElementById('counter');
        
        if (!list) return;
        list.innerHTML = '';
        const items = json.data || [];
        if (counter) counter.textContent = items.length;

        if (items.length === 0) {
            list.innerHTML = `<div style="text-align:center; color: #94a3b8; padding: 15px;">No hay nodos registrados en MySQL.</div>`;
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);";
            div.innerHTML = `
                <div>
                    <strong style="color: #f8fafc; display: block;">${escapeHTML(item.nombre)}</strong>
                    <small style="color: #94a3b8;">${escapeHTML(item.descripcion || 'Sin configuración')}</small>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button onclick="openModal(${item.id}, '${escapeHTML(item.nombre)}', '${escapeHTML(item.descripcion || '')}')" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✏️</button>
                    <button onclick="eliminarItem(${item.id})" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑️</button>
                </div>
            `;
            list.appendChild(div);
        });

    } catch (err) {
        actualizarEstado('OFFLINE', 0);
    }
}

// CREAR NODO (HTTP POST)
document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const descripcion = document.getElementById('descripcion').value;

    try {
        const res = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion })
        });

        if (res.ok) {
            document.getElementById('nombre').value = '';
            document.getElementById('descripcion').value = '';
            obtenerItems();
        }
    } catch (err) {
        alert('Error al guardar en el servidor');
    }
});

// ELIMINAR NODO (HTTP DELETE)
async function eliminarItem(id) {
    if (!confirm('¿Eliminar este nodo de la base de datos?')) return;
    try {
        const res = await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
        if (res.ok) obtenerItems();
    } catch (err) {
        alert('Error al eliminar');
    }
}

// MODAL Y EDICIÓN (HTTP PUT)
function openModal(id, nombre, descripcion) {
    document.getElementById('editId').value = id;
    document.getElementById('editNombre').value = nombre;
    document.getElementById('editDescripcion').value = descripcion;
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

document.getElementById('editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const nombre = document.getElementById('editNombre').value;
    const descripcion = document.getElementById('editDescripcion').value;

    try {
        const res = await fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion })
        });

        if (res.ok) {
            closeModal();
            obtenerItems();
        }
    } catch (err) {
        alert('Error al actualizar');
    }
});

// --- 4. TELEMETRÍA Y MONITOR DE LATENCIA RTT ---
function medirLatencia() {
    setInterval(async () => {
        const t0 = performance.now();
        try {
            const res = await fetch(`${API_URL}/health`);
            const t1 = performance.now();
            if (res.ok) {
                actualizarEstado('ONLINE', Math.round(t1 - t0));
            }
        } catch (e) {
            actualizarEstado('OFFLINE', 0);
        }
    }, 4000);
}

function actualizarEstado(estado, ms) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const latencyVal = document.getElementById('latencyVal');

    if (estado === 'ONLINE') {
        if (statusText) statusText.textContent = 'TCP:3000 ONLINE';
        if (statusText) statusText.style.color = '#10b981';
        if (statusDot) statusDot.style.background = '#10b981';
        if (latencyVal) latencyVal.textContent = `${ms} ms`;
    } else {
        if (statusText) statusText.textContent = 'OFFLINE';
        if (statusText) statusText.style.color = '#ef4444';
        if (statusDot) statusDot.style.background = '#ef4444';
        if (latencyVal) latencyVal.textContent = `-- ms`;
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}