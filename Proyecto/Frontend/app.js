const API_URL = 'http://localhost:3000/items';

document.addEventListener('DOMContentLoaded', () => {
    obtenerItems();
});

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
            li.innerHTML = `
                <i data-lucide="check-circle-2" class="item-icon"></i>
                <div class="item-content">
                    <span class="item-title">${escapeHTML(item.nombre)}</span>
                    <span class="item-desc">${escapeHTML(item.descripcion || 'Sin descripción adicional')}</span>
                </div>
            `;
            list.appendChild(li);
        });

        // Renderiza íconos de los elementos insertados dinámicamente
        if (window.lucide) lucide.createIcons();

    } catch (err) {
        console.error('Error al obtener datos:', err);
        list.innerHTML = `<li class="empty-state" style="color: #ef4444;">Error conectando con el servidor backend.</li>`;
    }
}

document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const nombreInput = document.getElementById('nombre');
    const descripcionInput = document.getElementById('descripcion');

    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput.value.trim();

    if (!nombre) return;

    // Feedback visual en el botón
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';

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
        } else {
            alert('Error al guardar el registro en la base de datos.');
        }
    } catch (err) {
        console.error('Error al enviar formulario:', err);
        alert('Error de conexión al guardar.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});

// Prevención básica de XSS al renderizar texto del usuario
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}