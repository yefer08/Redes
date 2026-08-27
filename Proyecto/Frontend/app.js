const API_URL = 'http://localhost:3000/items';

document.addEventListener('DOMContentLoaded', () => {
    obtenerItems();
});

// --- LEER (READ) ---
async function obtenerItems() {
    const list = document.getElementById('itemsList');
    const counter = document.getElementById('counter');

    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        
        list.innerHTML = '';
        const items = json.data || [];
        counter.textContent = items.length;

        if (items.length === 0) {
            list.innerHTML = `<li class="empty-state">No hay registros almacenados. ¡Crea el primero arriba!</li>`;
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'item-card';
            li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; border-radius: 8px; background: rgba(255,255,255,0.05);';
            
            li.innerHTML = `
                <div class="item-content">
                    <strong style="color: #4f46e5; display: block;">${escapeHTML(item.nombre)}</strong>
                    <span style="color: #9ca3af; font-size: 0.9em;">${escapeHTML(item.descripcion || 'Sin descripción')}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editarItem(${item.id}, '${escapeHTML(item.nombre)}', '${escapeHTML(item.descripcion || '')}')" style="background: #eab308; color: black; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">✏️</button>
                    <button onclick="eliminarItem(${item.id})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">🗑️</button>
                </div>
            `;
            list.appendChild(li);
        });

    } catch (err) {
        console.error('Error al obtener datos:', err);
    }
}

// --- CREAR (CREATE) ---
document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreInput = document.getElementById('nombre');
    const descripcionInput = document.getElementById('descripcion');

    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput.value.trim();

    if (!nombre) return;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion })
        });

        if (res.ok) {
            nombreInput.value = '';
            descripcionInput.value = '';
            await obtenerItems();
        }
    } catch (err) {
        console.error('Error al guardar:', err);
    }
});

// --- ELIMINAR (DELETE) ---
async function eliminarItem(id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await obtenerItems();
        }
    } catch (err) {
        console.error('Error al eliminar:', err);
    }
}

// --- ACTUALIZAR (UPDATE) ---
async function editarItem(id, nombreActual, descripcionActual) {
    const nuevoNombre = prompt('Editar Nombre:', nombreActual);
    if (nuevoNombre === null) return; // Cancelado

    const nuevaDescripcion = prompt('Editar Descripción:', descripcionActual);
    if (nuevaDescripcion === null) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nuevoNombre, descripcion: nuevaDescripcion })
        });

        if (res.ok) {
            await obtenerItems();
        }
    } catch (err) {
        console.error('Error al actualizar:', err);
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}