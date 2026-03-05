// ─── Shared Utilities ───

const API_BASE = '';

// ─── Auth Helpers ───
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function isLoggedIn() {
    return !!getToken();
}

function requireAuth() {
    if (!isLoggedIn()) {
        showToast('⚠ Please login or sign up to add items to your cart', 'error');
        setTimeout(() => window.location.href = '/login.html', 2000);
        return false;
    }
    return true;
}

// ─── API Fetch Helpers ───
async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        clearAuth();
        window.location.href = '/login.html';
        throw new Error('Session expired');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.errors?.[0]?.msg || 'Something went wrong');
    }

    return data;
}

// ─── Toast Notifications ───
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── Cart Badge ───
async function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;

    if (!isLoggedIn()) {
        badge.classList.remove('show');
        return;
    }

    try {
        const data = await apiFetch('/api/cart');
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    } catch (e) {
        // silently fail
    }
}

// ─── Navbar Auth State ───
function updateNavAuth() {
    const authContainer = document.querySelector('.navbar-auth');
    if (!authContainer) return;

    if (isLoggedIn()) {
        const user = getUser();
        authContainer.innerHTML = `
      <span style="color: var(--text-secondary); font-size: 0.875rem;">Hi, <strong>${user?.name || 'User'}</strong></span>
      <button class="btn btn-sm btn-secondary" id="logout-btn">Logout</button>
    `;
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            clearAuth();
            showToast('Logged out successfully', 'success');
            setTimeout(() => window.location.href = '/', 500);
        });
    } else {
        authContainer.innerHTML = `
      <a href="/login.html" class="btn btn-sm btn-secondary">Login</a>
      <a href="/register.html" class="btn btn-sm btn-primary">Sign Up</a>
    `;
    }
}

// ─── Format Price ───
function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

// ─── Init Navbar ───
document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
    updateCartBadge();

    // Mobile menu toggle
    const toggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.navbar-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('show');
        });
    }
});
