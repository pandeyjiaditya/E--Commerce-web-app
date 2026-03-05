document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // ─── Login ───
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('login-error');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            btn.disabled = true;
            btn.textContent = 'Signing in...';
            errorEl.textContent = '';

            try {
                const data = await apiFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                setAuth(data.token, data.user);
                showToast(`Welcome back, ${data.user.name}!`, 'success');
                setTimeout(() => window.location.href = '/', 500);
            } catch (err) {
                errorEl.textContent = err.message;
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });
    }

    // ─── Register ───
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('register-error');

            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm').value;

            if (password !== confirmPassword) {
                errorEl.textContent = 'Passwords do not match.';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Creating account...';
            errorEl.textContent = '';

            try {
                const data = await apiFetch('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password })
                });

                setAuth(data.token, data.user);
                showToast('Account created successfully!', 'success');
                setTimeout(() => window.location.href = '/', 500);
            } catch (err) {
                errorEl.textContent = err.message;
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });
    }
});
