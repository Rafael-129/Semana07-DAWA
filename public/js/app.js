// Configuración de la API
const API_BASE_URL = '/api';

// Utilidades
const Utils = {
    // Guardar token en localStorage
    saveToken(token) {
        localStorage.setItem('token', token);
    },

    // Obtener token de localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Eliminar token
    removeToken() {
        localStorage.removeItem('token');
    },

    // Decodificar token JWT (básico)
    decodeToken(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (error) {
            return null;
        }
    },

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        
        const decoded = this.decodeToken(token);
        if (!decoded) return false;
        
        // Verificar si el token ha expirado
        const now = Date.now() / 1000;
        return decoded.exp > now;
    },

    // Obtener roles del usuario
    getUserRoles() {
        const token = this.getToken();
        if (!token) return [];
        
        const decoded = this.decodeToken(token);
        return decoded ? decoded.roles : [];
    },

    // Verificar si el usuario es admin
    isAdmin() {
        return this.getUserRoles().includes('admin');
    },

    // Formatear fecha
    formatDate(dateString) {
        if (!dateString) return 'No disponible';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    },

    // Mostrar mensaje de error
    showError(message, containerId = 'errorContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="alert alert-error">${message}</div>`;
            container.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Mostrar mensaje de éxito
    showSuccess(message, containerId = 'successContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="alert alert-success">${message}</div>`;
            container.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Limpiar mensajes
    clearMessages() {
        const errorContainer = document.getElementById('errorContainer');
        const successContainer = document.getElementById('successContainer');
        if (errorContainer) errorContainer.innerHTML = '';
        if (successContainer) successContainer.innerHTML = '';
    }
};

// Servicios API
const API = {
    // Realizar petición con autenticación
    async request(url, options = {}) {
        const token = Utils.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        console.log(`🔗 Petición ${options.method || 'GET'} a ${API_BASE_URL}${url}`);
        console.log('📋 Headers:', headers);

        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers
        });

        console.log(`📊 Respuesta status:`, response.status);

        const data = await response.json();
        console.log('📄 Datos recibidos:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    },

    // Autenticación
    async signIn(email, password) {
        return await this.request('/auth/signIn', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async signUp(userData) {
        return await this.request('/auth/signUp', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    // Usuarios
    async getProfile() {
        return await this.request('/users/me');
    },

    async getAllUsers() {
        console.log('🌐 Haciendo petición a /users');
        const result = await this.request('/users');
        console.log('📥 Respuesta de getAllUsers:', result);
        return result;
    }
};

// Validaciones
const Validators = {
    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    password(password) {
        // Mínimo 8 caracteres, 1 mayúscula, 1 dígito, 1 carácter especial
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[#$%&*@])[A-Za-z\d#$%&*@]{8,}$/;
        return passwordRegex.test(password);
    },

    phone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,}$/;
        return phoneRegex.test(phone);
    },

    age(birthdate) {
        const today = new Date();
        const birth = new Date(birthdate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= 13;
    }
};

// Controlador de autenticación
const AuthController = {
    init() {
        this.checkAuthState();
        this.bindEvents();
    },

    checkAuthState() {
        const currentPage = window.location.pathname;
        
        if (Utils.isAuthenticated()) {
            // Si está autenticado y está en página de auth, redirigir al dashboard
            if (currentPage.includes('signin') || currentPage.includes('signup') || currentPage === '/') {
                this.redirectToDashboard();
            }
        } else {
            // Si no está autenticado y no está en página de auth, redirigir al signin
            if (!currentPage.includes('signin') && !currentPage.includes('signup')) {
                window.location.href = '/signin.html';
            }
        }
    },

    redirectToDashboard() {
        if (Utils.isAdmin()) {
            window.location.href = '/admin-dashboard.html';
        } else {
            window.location.href = '/user-dashboard.html';
        }
    },

    bindEvents() {
        const signinForm = document.getElementById('signinForm');
        const signupForm = document.getElementById('signupForm');
        const logoutBtn = document.getElementById('logoutBtn');

        if (signinForm) {
            signinForm.addEventListener('submit', this.handleSignIn.bind(this));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignUp.bind(this));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    },

    async handleSignIn(event) {
        event.preventDefault();
        Utils.clearMessages();

        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            this.showLoading(true);
            const response = await API.signIn(email, password);
            Utils.saveToken(response.token);
            Utils.showSuccess('¡Inicio de sesión exitoso!');
            
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1000);
        } catch (error) {
            Utils.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    },

    async handleSignUp(event) {
        event.preventDefault();
        Utils.clearMessages();

        const formData = new FormData(event.target);
        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            name: formData.get('name'),
            lastName: formData.get('lastName'),
            phoneNumber: formData.get('phoneNumber'),
            birthdate: formData.get('birthdate'),
            url_profile: formData.get('url_profile'),
            adress: formData.get('adress')
        };

        // Validaciones
        if (!this.validateSignUpForm(userData)) {
            return;
        }

        try {
            this.showLoading(true);
            await API.signUp(userData);
            Utils.showSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
            
            setTimeout(() => {
                window.location.href = '/signin.html';
            }, 2000);
        } catch (error) {
            Utils.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    },

    validateSignUpForm(userData) {
        let isValid = true;

        // Validar email
        if (!Validators.email(userData.email)) {
            Utils.showError('El email no tiene un formato válido');
            isValid = false;
        }

        // Validar contraseña
        if (!Validators.password(userData.password)) {
            Utils.showError('La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 dígito y 1 carácter especial (#$%&*@)');
            isValid = false;
        }

        // Validar teléfono
        if (!Validators.phone(userData.phoneNumber)) {
            Utils.showError('El número de teléfono no es válido');
            isValid = false;
        }

        // Validar edad
        if (!Validators.age(userData.birthdate)) {
            Utils.showError('Debes tener al menos 13 años para registrarte');
            isValid = false;
        }

        return isValid;
    },

    handleLogout() {
        Utils.removeToken();
        window.location.href = '/signin.html';
    },

    showLoading(show) {
        const loadingElement = document.querySelector('.loading');
        const submitBtns = document.querySelectorAll('button[type="submit"]');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        
        submitBtns.forEach(btn => {
            btn.disabled = show;
            btn.textContent = show ? 'Cargando...' : btn.getAttribute('data-original-text') || btn.textContent;
            if (!show && !btn.getAttribute('data-original-text')) {
                btn.setAttribute('data-original-text', btn.textContent);
            }
        });
    }
};

// Controlador del Dashboard
const DashboardController = {
    init() {
        if (!Utils.isAuthenticated()) {
            window.location.href = '/signin.html';
            return;
        }

        this.loadUserData();
        this.bindEvents();
        this.initTabs();
    },

    async loadUserData() {
        try {
            const profile = await API.getProfile();
            this.displayUserProfile(profile);
            
            // Si es admin, cargar también la lista de usuarios cuando se acceda a esa pestaña
            if (Utils.isAdmin()) {
                // No cargar inmediatamente, sino cuando se haga clic en la pestaña
                this.setupAdminTabs();
            }
        } catch (error) {
            Utils.showError('Error al cargar los datos del usuario');
            console.error(error);
        }
    },

    displayUserProfile(user) {
        // Para dashboard de usuario normal
        const profileContainer = document.getElementById('userProfile');
        // Para dashboard de administrador (pestaña perfil)
        const adminProfileContainer = document.getElementById('adminProfile');
        
        const rolesBadges = user.roles.map(role => {
            const roleName = typeof role === 'string' ? role : role.name;
            return `<span class="badge badge-${roleName}">${roleName}</span>`;
        }).join('');

        const profileHTML = `
            <div class="user-card">
                <h3>Mi Perfil ${rolesBadges}</h3>
                <div class="user-info">
                    <div class="info-item">
                        <div class="info-label">Nombre completo:</div>
                        <div class="info-value">${user.name || 'No especificado'} ${user.lastName || ''}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email:</div>
                        <div class="info-value">${user.email || 'No especificado'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Teléfono:</div>
                        <div class="info-value">${user.phoneNumber || 'No especificado'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Fecha de nacimiento:</div>
                        <div class="info-value">${user.birthdate ? Utils.formatDate(user.birthdate) : 'No especificada'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Dirección:</div>
                        <div class="info-value">${user.adress || 'No especificada'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">URL de perfil:</div>
                        <div class="info-value">
                            ${user.url_profile ? `<a href="${user.url_profile}" target="_blank">${user.url_profile}</a>` : 'No especificada'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (profileContainer) {
            profileContainer.innerHTML = profileHTML;
        }
        
        if (adminProfileContainer) {
            adminProfileContainer.innerHTML = profileHTML;
        }
    },

    setupAdminTabs() {
        // Configurar carga lazy de usuarios cuando se acceda a la pestaña de dashboard
        const dashboardTabBtn = document.querySelector('[data-tab="dashboard"]');
        if (dashboardTabBtn) {
            dashboardTabBtn.addEventListener('click', async () => {
                // Cargar usuarios cada vez que se haga clic en la pestaña
                const usersList = document.getElementById('usersList');
                if (usersList) {
                    usersList.innerHTML = '<div class="loading" style="display: block;">Cargando usuarios...</div>';
                    await this.loadAllUsers();
                }
            });
        }
    },

    async loadAllUsers() {
        try {
            console.log('🔍 Cargando lista de usuarios...');
            const loadingContainer = document.getElementById('usersList');
            if (loadingContainer) {
                loadingContainer.innerHTML = '<div class="loading" style="display: block;">Cargando usuarios...</div>';
            }
            
            const users = await API.getAllUsers();
            console.log('✅ Usuarios cargados:', users);
            this.displayUsersList(users);
        } catch (error) {
            console.error('❌ Error al cargar usuarios:', error);
            Utils.showError('Error al cargar la lista de usuarios: ' + error.message);
            const usersContainer = document.getElementById('usersList');
            if (usersContainer) {
                usersContainer.innerHTML = `
                    <div class="alert alert-error">
                        Error al cargar usuarios: ${error.message}
                    </div>
                `;
            }
        }
    },

    displayUsersList(users) {
        const usersContainer = document.getElementById('usersList');
        if (!usersContainer) {
            console.error('❌ Contenedor usersList no encontrado');
            return;
        }

        console.log('📄 Mostrando', users.length, 'usuarios');

        if (!users || users.length === 0) {
            usersContainer.innerHTML = `
                <h3>Lista de Usuarios (0 usuarios registrados)</h3>
                <div class="alert alert-info">
                    No hay usuarios registrados en el sistema todavía.
                </div>
            `;
            return;
        }

        usersContainer.innerHTML = `
            <h3>Lista de Usuarios (${users.length} usuarios registrados)</h3>
            <div class="user-list">
                ${users.map(user => {
                    const rolesBadges = user.roles.map(role => {
                        const roleName = typeof role === 'string' ? role : role.name;
                        return `<span class="badge badge-${roleName}">${roleName}</span>`;
                    }).join('');
                    
                    return `
                        <div class="user-card">
                            <div class="user-info">
                                <div class="info-item">
                                    <div class="info-label">Nombre:</div>
                                    <div class="info-value">${user.name || 'No especificado'} ${user.lastName || ''} ${rolesBadges}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Email:</div>
                                    <div class="info-value">${user.email || 'No especificado'}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Teléfono:</div>
                                    <div class="info-value">${user.phoneNumber || 'No especificado'}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Registrado:</div>
                                    <div class="info-value">${user.createdAt ? Utils.formatDate(user.createdAt) : 'No disponible'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Remover clase active de todos los botones y contenidos
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Agregar clase active al botón clickeado
                btn.classList.add('active');
                
                // Mostrar el contenido correspondiente
                const targetContent = document.getElementById(targetTab + 'Tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    },

    bindEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', AuthController.handleLogout);
        }

        // Botón para cargar usuarios manualmente (debug)
        const loadUsersBtn = document.getElementById('loadUsersBtn');
        if (loadUsersBtn) {
            loadUsersBtn.addEventListener('click', () => {
                console.log('🔄 Carga manual de usuarios solicitada');
                this.loadAllUsers();
            });
        }
    }
};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Determinar qué controlador inicializar según la página actual
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('dashboard')) {
        DashboardController.init();
    } else {
        AuthController.init();
    }
});

// Manejar cambios en el localStorage (para logout en múltiples pestañas)
window.addEventListener('storage', function(event) {
    if (event.key === 'token' && !event.newValue) {
        // Token eliminado en otra pestaña
        window.location.href = '/signin.html';
    }
});