// ─── XSS Prevention: HTML Escape Utility ──────────────────────────────────
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ─── Password Hashing (SHA-256) ────────────────────────────────────────────
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Password Strength Validation ─────────────────────────────────────────
function validatePassword(pass) {
    if (pass.length < 10) return 'Password must be at least 10 characters.';
    if (!/[a-z]/.test(pass)) return 'Password must include a lowercase letter.';
    if (!/[A-Z]/.test(pass)) return 'Password must include an uppercase letter.';
    if (!/[0-9]/.test(pass)) return 'Password must include a number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return 'Password must include a special character (!@#$%^&* etc.).';
    return null;
}

// ─── Safe Redirect Parameter ──────────────────────────────────────────────
function getSafeRedirectFacility() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('redirect_facility');
    // Only allow alphanumeric, hyphens, underscores (facility IDs/names)
    if (val && /^[a-zA-Z0-9_-]+$/.test(val)) return val;
    return null;
}

// ─── hCaptcha Verification ────────────────────────────────────────────────
function getHcaptchaToken() {
    if (typeof hcaptcha === 'undefined') return null;
    try {
        return hcaptcha.getResponse();
    } catch (e) {
        return null;
    }
}

function resetHcaptcha() {
    if (typeof hcaptcha !== 'undefined') {
        try { hcaptcha.reset(); } catch (e) { /* ignore */ }
    }
}

// ─── Show / Hide Alert Helpers ─────────────────────────────────────────────
function showError(msgId, text) {
    const el = document.getElementById(msgId);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
}

function hideMessage(msgId) {
    const el = document.getElementById(msgId);
    if (el) el.classList.add('hidden');
}

function showSuccess(msgId, text) {
    const el = document.getElementById(msgId);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
}

// ─── UI Helpers ────────────────────────────────────────────────────────────
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

function setButtonLoading(btnId, isLoading, defaultText = '') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
        btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline-block mr-2"></i> Processing...`;
        lucide.createIcons();
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        btn.innerHTML = defaultText;
    }
}

// ─── REGISTER ──────────────────────────────────────────────────────────────
async function handleRegister() {
    const email    = document.getElementById('registerEmail').value.trim();
    const pass     = document.getElementById('registerPassword').value;
    const confirm  = document.getElementById('registerConfirmPassword').value;
    const role     = document.getElementById('registerRole').value;
    const errorEl  = 'registerError';
    const successEl = 'registerSuccess';
    const btnId    = 'registerBtn';

    hideMessage(errorEl);
    hideMessage(successEl);
    
    const setError = (msg) => {
        setButtonLoading(btnId, false, 'Register');
        resetHcaptcha();
        return showError(errorEl, msg);
    };

    if (!email || !pass || !confirm || !role) {
        return setError('All fields are required.');
    }
    if (role === 'student') {
        if (!email.endsWith('@adab.umpsa.edu.my')) {
            return setError('Student registration requires an @adab.umpsa.edu.my email address.');
        }
    } else if (role === 'staff') {
        if (!email.endsWith('@umpsa.edu.my') || email.endsWith('@adab.umpsa.edu.my')) {
            return setError('Staff registration requires an @umpsa.edu.my email address.');
        }
    } else {
        return setError('Invalid role selected.');
    }

    // Strong password validation
    const passError = validatePassword(pass);
    if (passError) {
        return setError(passError);
    }

    if (pass !== confirm) {
        return setError('Passwords do not match.');
    }

    // hCaptcha verification
    const captchaToken = getHcaptchaToken();
    if (!captchaToken) {
        return setError('Please complete the CAPTCHA verification.');
    }

    setButtonLoading(btnId, true);

    const hashedPass = await hashPassword(pass);

    // Use RPC function (never exposes User table directly)
    const { data: result, error: rpcError } = await db.rpc('rpc_register_user', {
        p_email: email,
        p_password: hashedPass,
        p_role: role
    });

    if (rpcError) return setError('Registration failed. Please try again.');
    if (!result?.success) return setError(result?.error || 'Registration failed.');

    showSuccess(successEl, 'Account created successfully!');
    setButtonLoading(btnId, false, 'Redirecting...');
    setTimeout(() => { 
        const redirectFacility = getSafeRedirectFacility();
        if (redirectFacility) {
            window.location.href = `../LogInPage/LogInPage.html?redirect_facility=${redirectFacility}`;
        } else {
            window.location.href = '../LogInPage/LogInPage.html'; 
        }
    }, 2000);
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
async function handleLogin() {
    const email   = document.getElementById('loginEmail').value.trim();
    const pass    = document.getElementById('loginPassword').value;
    const role    = document.getElementById('roleSelect').value;
    const errorEl = 'loginError';
    const btnId   = 'loginBtn';
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const store = rememberMe ? localStorage : sessionStorage;

    hideMessage(errorEl);

    const setError = (msg) => {
        setButtonLoading(btnId, false, 'Login');
        resetHcaptcha();
        return showError(errorEl, msg);
    };

    if (!email || !pass || !role) {
        return setError('All fields are required.');
    }

    // hCaptcha verification
    const captchaToken = getHcaptchaToken();
    if (!captchaToken) {
        return setError('Please complete the CAPTCHA verification.');
    }

    setButtonLoading(btnId, true);

    const hashedPass = await hashPassword(pass);

    // ── Admin Login (via RPC — never exposes Admin table) ────────────────────
    if (role === 'superadmin') {
        const { data: result, error } = await db.rpc('rpc_login_admin', {
            p_email: email,
            p_password: hashedPass
        });

        if (error || !result?.success) {
            return setError('Invalid admin credentials.');
        }

        store.setItem('admin_id',    result.admin_id);
        store.setItem('admin_email', result.email);
        store.setItem('admin_role',  result.role);

        setButtonLoading(btnId, false, 'Redirecting...');
        window.location.href = '../AdminDashboard/AdminDashboard.html';
        return;
    }

    // ── Student / Staff Login (via RPC) ─────────────────────────────────────
    const { data: result, error } = await db.rpc('rpc_login_user', {
        p_email: email,
        p_password: hashedPass,
        p_role: role
    });

    if (error || !result?.success) {
        return setError('Invalid email, password, or role.');
    }

    store.setItem('user_id',    result.user_id);
    store.setItem('user_email', result.email);
    store.setItem('user_role',  result.role);

    setButtonLoading(btnId, false, 'Redirecting...');
    
    // Check if there's a safe redirect_facility in the URL
    const redirectFacility = getSafeRedirectFacility();
    
    if (redirectFacility) {
        window.location.href = `../UserDashboard/UserDashboard.html?open_booking=${redirectFacility}`;
    } else {
        window.location.href = '../UserDashboard/UserDashboard.html';
    }
}

// ─── FORGOT PASSWORD (send email link) ───────────────────────────────────────
async function handleForgotPassword() {
    const email   = document.getElementById('forgotEmail').value.trim();
    const errorEl = 'forgotError';
    const successEl = 'forgotSuccess';
    const btnId   = 'forgotBtn';

    hideMessage(errorEl);
    hideMessage(successEl);

    const setError = (msg) => {
        setButtonLoading(btnId, false, 'Send Reset Link');
        resetHcaptcha();
        return showError(errorEl, msg);
    };

    if (!email) return setError('Please enter your email address.');

    // hCaptcha verification
    const captchaToken = getHcaptchaToken();
    if (!captchaToken) {
        return setError('Please complete the CAPTCHA verification.');
    }

    setButtonLoading(btnId, true);

    // 1. Generate secure token & expiry (15 mins)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

    // 2. Set reset token via RPC (never exposes User/Admin table)
    const { data: result, error: rpcError } = await db.rpc('rpc_set_reset_token', {
        p_email: email,
        p_token: token,
        p_expires_at: expiresAt
    });

    if (rpcError || !result?.success) {
        return setError(result?.error || 'No account found with that email address.');
    }

    const table = result.table;

    // 3. Generate the reset link
    const baseUrl = window.location.href.split('?')[0].replace(/NewPasswordPage/g, 'ResetPasswordPage');
    const resetLink = `${baseUrl}?token=${token}&email=${encodeURIComponent(email)}&type=${table}`;

    // 5. Send Email via Edge Function
    const { data: edgeData, error: edgeError } = await db.functions.invoke('send-reset-email', {
        body: { email, resetLink }
    });

    if (edgeError || !edgeData?.success) {
        console.error('Edge Function Error:', edgeError || edgeData);
        const detailedError = edgeData?.details?.message || edgeData?.error || (edgeError && edgeError.message) || 'Unknown error';
        return setError(`Failed to send email: ${detailedError}`);
    }

    setButtonLoading(btnId, false, 'Send Reset Link');
    showSuccess(successEl, 'Reset link sent successfully!');
}

// ─── RESET PASSWORD ────────────────────────────────────────────────────────
async function handleResetPassword() {
    const newPass     = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;
    const errorEl     = 'resetError';
    const successEl   = 'resetSuccess';
    const btnId       = 'resetBtn';
    
    // Read from URL params (validated)
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    const table = urlParams.get('type'); // 'User' or 'Admin'

    hideMessage(errorEl);
    hideMessage(successEl);

    const setError = (msg) => {
        setButtonLoading(btnId, false, 'Reset Password');
        return showError(errorEl, msg);
    };

    if (!email || !token || !table) {
        return setError('Invalid or broken reset link. Please request a new one.');
    }
    if (table !== 'User' && table !== 'Admin') {
        return setError('Invalid account type.');
    }
    if (!newPass || !confirmPass) {
        return setError('All fields are required.');
    }

    // Strong password validation
    const passError = validatePassword(newPass);
    if (passError) {
        return setError(passError);
    }

    if (newPass !== confirmPass) {
        return setError('Passwords do not match.');
    }

    setButtonLoading(btnId, true);

    // Hash new password & reset via RPC (never exposes User/Admin table)
    const hashedPass = await hashPassword(newPass);

    const { data: result, error: rpcError } = await db.rpc('rpc_reset_password', {
        p_email: email,
        p_token: token,
        p_new_password: hashedPass,
        p_table: table
    });

    if (rpcError) return setError('Failed to reset password. Please try again.');
    if (!result?.success) return setError(result?.error || 'Failed to reset password.');

    showSuccess(successEl, 'Password reset successfully!');
    setButtonLoading(btnId, false, 'Redirecting...');
    setTimeout(() => { window.location.href = '../LogInPage/LogInPage.html'; }, 2000);
}
