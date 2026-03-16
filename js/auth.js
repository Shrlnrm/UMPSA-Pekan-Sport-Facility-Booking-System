// ─── Password Hashing (SHA-256) ────────────────────────────────────────────
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

// ─── REGISTER ──────────────────────────────────────────────────────────────
async function handleRegister() {
    const email    = document.getElementById('registerEmail').value.trim();
    const pass     = document.getElementById('registerPassword').value;
    const confirm  = document.getElementById('registerConfirmPassword').value;
    const errorEl  = 'registerError';
    const successEl = 'registerSuccess';

    hideMessage(errorEl);
    hideMessage(successEl);

    if (!email || !pass || !confirm) {
        return showError(errorEl, 'All fields are required.');
    }
    if (!email.endsWith('@adab.umpsa.edu.my') && !email.endsWith('@umpsa.edu.my')) {
        return showError(errorEl, 'Please use a valid UMPSA email address (@adab.umpsa.edu.my or @umpsa.edu.my).');
    }
    if (pass.length < 8) {
        return showError(errorEl, 'Password must be at least 8 characters.');
    }
    if (pass !== confirm) {
        return showError(errorEl, 'Passwords do not match.');
    }

    // Check if email already registered
    const { data: existing, error: checkError } = await db
        .from('User')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

    if (checkError) return showError(errorEl, 'Error checking email. Please try again.');
    if (existing)  return showError(errorEl, 'This email is already registered.');

    const hashedPass = await hashPassword(pass);
    const role = email.endsWith('@adab.umpsa.edu.my') ? 'student' : 'staff';

    const { error: insertError } = await db
        .from('User')
        .insert([{ email, password: hashedPass, role }]);

    if (insertError) return showError(errorEl, 'Registration failed. Please try again.');

    showSuccess(successEl, 'Account created successfully! Redirecting to login...');
    setTimeout(() => { window.location.href = '../LogInPage/LogInPage.html'; }, 2000);
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
async function handleLogin() {
    const email   = document.getElementById('loginEmail').value.trim();
    const pass    = document.getElementById('loginPassword').value;
    const role    = document.getElementById('roleSelect').value;
    const errorEl = 'loginError';

    hideMessage(errorEl);

    if (!email || !pass || !role) {
        return showError(errorEl, 'All fields are required.');
    }

    const hashedPass = await hashPassword(pass);

    // ── Admin Login ─────────────────────────────────────────────────────────
    if (role === 'superadmin') {
        const { data: admin, error } = await db
            .from('Admin')
            .select('admin_id, email, role')
            .eq('email', email)
            .eq('password', hashedPass)
            .eq('role', 'superadmin')
            .maybeSingle();

        if (error || !admin) {
            return showError(errorEl, 'Invalid admin credentials.');
        }

        sessionStorage.setItem('admin_id',    admin.admin_id);
        sessionStorage.setItem('admin_email', admin.email);
        sessionStorage.setItem('admin_role',  admin.role);

        // Redirect to admin dashboard (to be built)
        window.location.href = '../AdminDashboard/AdminDashboard.html';
        return;
    }

    // ── Student / Staff Login ───────────────────────────────────────────────
    const { data: user, error } = await db
        .from('User')
        .select('user_id, email, role')
        .eq('email', email)
        .eq('password', hashedPass)
        .eq('role', role)
        .maybeSingle();

    if (error || !user) {
        return showError(errorEl, 'Invalid email, password, or role.');
    }

    sessionStorage.setItem('user_id',    user.user_id);
    sessionStorage.setItem('user_email', user.email);
    sessionStorage.setItem('user_role',  user.role);

    window.location.href = '../index.html';
}

// ─── FORGOT PASSWORD (check email exists) ──────────────────────────────────
async function handleForgotPassword() {
    const email   = document.getElementById('forgotEmail').value.trim();
    const errorEl = 'forgotError';
    const successEl = 'forgotSuccess';

    hideMessage(errorEl);
    hideMessage(successEl);

    if (!email) return showError(errorEl, 'Please enter your email address.');

    const { data: user, error } = await db
        .from('User')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

    if (error || !user) {
        return showError(errorEl, 'No account found with that email address.');
    }

    // Save email temporarily to use on reset page
    sessionStorage.setItem('reset_email', email);
    showSuccess(successEl, 'Email verified! Redirecting to reset password...');
    setTimeout(() => { window.location.href = '../ResetPasswordPage/ResetPasswordPage.html'; }, 2000);
}

// ─── RESET PASSWORD ────────────────────────────────────────────────────────
async function handleResetPassword() {
    const newPass     = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;
    const errorEl     = 'resetError';
    const successEl   = 'resetSuccess';
    const email       = sessionStorage.getItem('reset_email');

    hideMessage(errorEl);
    hideMessage(successEl);

    if (!email) {
        return showError(errorEl, 'Session expired. Please go back and re-enter your email.');
    }
    if (!newPass || !confirmPass) {
        return showError(errorEl, 'All fields are required.');
    }
    if (newPass.length < 8) {
        return showError(errorEl, 'Password must be at least 8 characters.');
    }
    if (newPass !== confirmPass) {
        return showError(errorEl, 'Passwords do not match.');
    }

    const hashedPass = await hashPassword(newPass);

    const { error } = await db
        .from('User')
        .update({ password: hashedPass })
        .eq('email', email);

    if (error) return showError(errorEl, 'Failed to reset password. Please try again.');

    sessionStorage.removeItem('reset_email');
    showSuccess(successEl, 'Password reset successfully! Redirecting to login...');
    setTimeout(() => { window.location.href = '../LogInPage/LogInPage.html'; }, 2000);
}
