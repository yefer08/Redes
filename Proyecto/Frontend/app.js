// DIRECCIÓN IP DEL SERVIDOR DE TELEMÁTICA
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    obtenerItems();
    iniciarTelemetria();
});

// NAVEGACIÓN POR PESTAÑAS (TAB SWITCHER)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// FUNCIONALIDAD 1: OBTENER NODOS DESDE MYSQL (HTTP GET)
async function obtenerItems() {
    const t0 = performance.now();
    try {
        const res = await fetch(`${API_URL}/items`);
        const t1 = performance.now();
        
        actualizarPing(Math.round(t1 - t0));

        const json = await res.json();
        const list = document.getElementById('itemsList');
        const counter = document.getElementById('counter');
        
        list.innerHTML = '';
        const items = json.data || [];
        counter.textContent = `${items.length} Nodos`;

        if (items.length === 0) {
            list.innerHTML = `<p style="text-align:center; color:var(--text-dark); padding:30px;">Sin registros en la base de datos MySQL.</p>`;
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'node-card';
            card.innerHTML = `
                <div>
                    <h4>${escapeHTML(item.nombre)}</h4>
                    <p>${escapeHTML(item.descripcion || 'Sin parámetros configurados')}</p>
                </div>
                <div class="node-actions">
                    <button class="btn-icon" onclick="openModal(${item.id}, '${escapeHTML(item.nombre)}', '${escapeHTML(item.descripcion || '')}')">✏️ Edit</button>
                    <button class="btn-icon" onclick="eliminarItem(${item.id})" style="border-color: var(--danger); color: var(--danger);">🗑️ Delete</button>
                </div>
            `;
            list.appendChild(card);
        });

    } catch (err) {
        setOffline();
    }
}

// FUNCIONALIDAD 1: GUARDAR NUEVO NODO (HTTP POST)
document.getElementById('itemForm').addEventListener('submit', async (e) => {
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
        alert('Error al procesar la petición HTTP POST');
    }
});

// FUNCIONALIDAD 1: ELIMINAR NODO (HTTP DELETE)
async function eliminarItem(id) {
    if (!confirm('¿Desconectar y eliminar nodo de la base de datos?')) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) obtenerItems();
    } catch (err) {
        alert('Error al eliminar nodo');
    }
}

// MODAL DE EDICIÓN (HTTP PUT)
function openModal(id, nombre, descripcion) {
    document.getElementById('editId').value = id;
    document.getElementById('editNombre').value = nombre;
    document.getElementById('editDescripcion').value = descripcion;
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const nombre = document.getElementById('editNombre').value;
    const descripcion = document.getElementById('editDescripcion').value;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion })
        });

        if (res.ok) {
            closeModal();
            obtenerItems();
        }
    } catch (err) {
        alert('Error en actualización HTTP PUT');
    }
});

// FUNCIONALIDAD 2: TELEMETRÍA Y HEALTH CHECK DE RED
function iniciarTelemetria() {
    setInterval(async () => {
        const t0 = performance.now();
        try {
            const res = await fetch(`${API_URL}/health`);
            const t1 = performance.now();
            if (res.ok) {
                actualizarPing(Math.round(t1 - t0));
                setOnline();
            }
        } catch (e) {
            setOffline();
        }
    }, 4000);
}

function actualizarPing(ms) {
    const latEl = document.getElementById('latencyVal');
    const qEl = document.getElementById('channelQuality');
    latEl.innerHTML = `${ms} <small>ms</small>`;

    if (ms < 30) {
        qEl.textContent = 'Canal Excelente (Baja Latencia)';
        qEl.style.color = '#10b981';
    } else if (ms < 100) {
        qEl.textContent = 'Canal Normal (Red LAN)';
        qEl.style.color = '#38bdf8';
    } else {
        qEl.textContent = 'Canal Congestionado';
        qEl.style.color = '#f43f5e';
    }
}

function setOnline() {
    document.getElementById('statusDot').className = 'status-indicator online';
    document.getElementById('statusTitle').textContent = 'CANAL ACTIVO';
}

function setOffline() {
    document.getElementById('statusDot').className = 'status-indicator';
    document.getElementById('statusTitle').textContent = 'SERVIDOR OFFLINE';
    document.getElementById('latencyVal').innerHTML = `-- <small>ms</small>`;
    document.getElementById('channelQuality').textContent = 'Sin respuesta de socket';
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}