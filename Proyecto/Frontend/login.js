const API_URL = '';
const DEMO_USER = 'admin';
const DEMO_PASSWORD = 'admin123';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    togglePassword.addEventListener('click', () => { const showing = password.type === 'text'; password.type = showing ? 'password' : 'text'; togglePassword.textContent = showing ? 'Mostrar' : 'Ocultar'; togglePassword.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña'); togglePassword.setAttribute('aria-pressed', String(!showing)); });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        usernameError.textContent = username.validity.valueMissing ? 'Ingresá tu usuario.' : username.validity.tooShort ? 'Usá al menos 3 caracteres.' : '';
        passwordError.textContent = password.validity.valueMissing ? 'Ingresá tu contraseña.' : password.validity.tooShort ? 'Usá al menos 6 caracteres.' : '';
        loginError.textContent = '';
        if (!form.checkValidity()) return;
        loginButton.disabled = true; loginButton.classList.add('is-loading');
        window.setTimeout(() => {
            // En producción, reemplazar esta comparación por una petición a `${API_URL}/login`.
            if (username.value.trim() === DEMO_USER && password.value === DEMO_PASSWORD) { window.location.href = 'index.html'; return; }
            loginError.textContent = 'Usuario o contraseña incorrectos.'; loginButton.disabled = false; loginButton.classList.remove('is-loading');
        }, 650);
    });
});