// Claves para guardar usuarios y la sesión actual.
const STORAGE_KEY = 'famClanUsers';
const SESSION_KEY = 'famClanSession';

// Elementos del DOM que se usan en el login y registro.
const userBadge = document.getElementById('userBadge');
const logoutButton = document.getElementById('logoutButton');
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTabs = document.querySelectorAll('[data-auth-tab]');
const authForms = document.querySelectorAll('.auth-form');

// Lee los usuarios guardados en el navegador.
function getUsers() {
    const users = localStorage.getItem(STORAGE_KEY);
    return users ? JSON.parse(users) : [];
}

// Guarda la lista de usuarios en localStorage.
function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Guarda la sesión del usuario activo.
function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    renderUserState();
    const modal = bootstrap.Modal.getInstance(authModal);
    if (modal) modal.hide();
}

// Cierra la sesión actual.
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    renderUserState();
}

// Muestra el nombre del usuario si está logueado.
function renderUserState() {
    const session = localStorage.getItem(SESSION_KEY);
    const user = session ? JSON.parse(session) : null;

    if (user && user.name) {
        userBadge.textContent = `Hola, ${user.name}`;
        userBadge.classList.remove('d-none');
        logoutButton.classList.remove('d-none');
    } else {
        userBadge.textContent = '';
        userBadge.classList.add('d-none');
        logoutButton.classList.add('d-none');
    }
}

// Cambia entre la pestaña de login y registro.
function setAuthTab(tab) {
    authTabs.forEach((button) => {
        const isActive = button.dataset.authTab === tab;
        button.classList.toggle('active', isActive);
    });

    authForms.forEach((form) => {
        form.classList.toggle('active', form.id === `${tab}Form`);
    });
}

// Muestra mensajes de error o éxito en el formulario.
function showMessage(target, type, message) {
    const el = document.querySelector(`[data-message-for="${target}"]`);
    if (!el) return;
    el.textContent = message;
    el.classList.remove('success', 'error');
    el.classList.add(type === 'success' ? 'success' : 'error');
}

// Crea un usuario nuevo si no existe.
function createUser(name, email, password) {
    const users = getUsers();
    const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

    if (exists) {
        return { ok: false, message: 'Este correo ya está registrado.' };
    }

    users.push({
        id: Date.now(),
        name,
        email: email.toLowerCase(),
        password
    });

    saveUsers(users);
    return { ok: true, message: 'Cuenta creada correctamente.' };
}

// Busca si el usuario existe y valida la contraseña.
function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password
    );

    if (!user) {
        return { ok: false, message: 'Correo o contraseña incorrectos.' };
    }

    return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
}

// Al hacer click en la pestaña, cambia el formulario visible.
authTabs.forEach((button) => {
    button.addEventListener('click', () => {
        setAuthTab(button.dataset.authTab);
    });
});

// Cuando envían el registro, valida y guarda el usuario.
registerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();

    if (!name || !email || !password || !confirmPassword) {
        showMessage('register', 'error', 'Completa todos los campos.');
        return;
    }

    if (password.length < 6) {
        showMessage('register', 'error', 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('register', 'error', 'Las contraseñas no coinciden.');
        return;
    }

    const result = createUser(name, email, password);

    if (!result.ok) {
        showMessage('register', 'error', result.message);
        return;
    }

    showMessage('register', 'success', result.message);
    registerForm.reset();
    setAuthTab('login');
});

// Cuando envían el login, valida credenciales y entra a la sesión.
loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        showMessage('login', 'error', 'Ingresa correo y contraseña.');
        return;
    }

    const result = loginUser(email, password);

    if (!result.ok) {
        showMessage('login', 'error', result.message);
        return;
    }

    setSession(result.user);
    loginForm.reset();
    showMessage('login', 'success', 'Sesión iniciada correctamente.');
});

// Cierra sesión al presionar el botón.
logoutButton.addEventListener('click', () => {
    clearSession();
});

// Ejecuta la vista inicial del usuario al cargar la página.
renderUserState();
