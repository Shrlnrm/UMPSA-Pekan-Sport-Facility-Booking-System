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
    const email     = document.getElementById('registerEmail').value.trim();
    const pass      = document.getElementById('registerPassword').value;
    const confirm   = document.getElementById('registerConfirmPassword').value;
    const role      = document.getElementById('registerRole').value;
    const errorEl   = 'registerError';
    const btnId     = 'registerBtn';

    hideMessage(errorEl);
    hideMessage('registerSuccess');

    const setError = (msg) => {
        setButtonLoading(btnId, false, 'Register');
        return showError(errorEl, msg);
    };

    // ── Validation ──────────────────────────────────────────────────────────
    if (!email || !pass || !confirm || !role) return setError('All fields are required.');

    if (role === 'student') {
        if (!email.endsWith('@adab.umpsa.edu.my'))
            return setError('Student registration requires an @adab.umpsa.edu.my email address.');
    } else if (role === 'staff') {
        if (!email.endsWith('@umpsa.edu.my') || email.endsWith('@adab.umpsa.edu.my'))
            return setError('Staff registration requires an @umpsa.edu.my email address.');
    } else {
        return setError('Invalid role selected.');
    }

    if (pass.length < 8) return setError('Password must be at least 8 characters.');
    if (pass !== confirm) return setError('Passwords do not match.');

    setButtonLoading(btnId, true);

    // ── Check for existing email ─────────────────────────────────────────────
    const { data: existing, error: checkError } = await db
        .from('User')
        .select('user_id, reset_token')
        .eq('email', email)
        .maybeSingle();

    if (checkError) return setError('Error checking email. Please try again.');

    if (existing) {
        // Email exists and is already verified (no VERIFY_ token active)
        if (!existing.reset_token || !existing.reset_token.startsWith('VERIFY_')) {
            return setError('This email is already registered.');
        }
        // Email exists but not yet verified — allow re-registration (update + resend)
    }

    const hashedPass = await hashPassword(pass);
    const token = 'VERIFY_' + crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

    // ── Insert or update the User record ────────────────────────────────────
    let dbError;
    if (existing) {
        // Update the unverified record with fresh credentials and a new token
        const { error } = await db.from('User')
            .update({ password: hashedPass, role, reset_token: token, reset_token_expires: tokenExpires })
            .eq('email', email);
        dbError = error;
    } else {
        const { error } = await db.from('User')
            .insert([{ email, password: hashedPass, role, reset_token: token, reset_token_expires: tokenExpires }]);
        dbError = error;
    }

    if (dbError) return setError('Registration failed. Please try again.');

    // ── Build verification link ──────────────────────────────────────────────
    const currentUrl = window.location.href.split('?')[0];
    const verifyBase = currentUrl.replace('RegisterPage/RegisterPage.html', 'VerifyEmailPage/VerifyEmailPage.html');
    const verifyLink = `${verifyBase}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    // ── Send verification email via Edge Function ────────────────────────────
    const { data: edgeData, error: edgeError } = await db.functions.invoke('send-verification-email', {
        body: { email, verifyLink }
    });

    if (edgeError || !edgeData?.success) {
        return setError('Account created but failed to send verification email. Please try again.');
    }

    // ── Show success panel ───────────────────────────────────────────────────
    setButtonLoading(btnId, false, 'Register');

    // Store for resend use
    window._pendingVerifyEmail = email;

    const emailDisplay = document.getElementById('registered-email-display');
    if (emailDisplay) emailDisplay.textContent = email;

    const formArea = document.getElementById('register-form-area');
    const emailSentPanel = document.getElementById('register-email-sent');
    if (formArea) formArea.classList.add('hidden');
    if (emailSentPanel) {
        emailSentPanel.classList.remove('hidden');
        emailSentPanel.classList.add('flex');
        lucide.createIcons();
    }
}

// ─── RESEND VERIFICATION (from Register success panel) ─────────────────────
async function handleRegisterResend() {
    const email = window._pendingVerifyEmail;
    if (!email) return;

    const btn = document.getElementById('resend-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    const token = 'VERIFY_' + crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await db.from('User')
        .update({ reset_token: token, reset_token_expires: tokenExpires })
        .eq('email', email);

    if (!updateError) {
        const currentUrl = window.location.href.split('?')[0];
        const verifyBase = currentUrl.replace('RegisterPage/RegisterPage.html', 'VerifyEmailPage/VerifyEmailPage.html');
        const verifyLink = `${verifyBase}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
        await db.functions.invoke('send-verification-email', { body: { email, verifyLink } });
    }

    if (btn) {
        btn.textContent = 'Sent! Check your inbox';
        // 30-second cooldown before allowing another resend
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Resend verification email';
        }, 30000);
    }
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
async function handleLogin() {
    const email      = document.getElementById('loginEmail').value.trim();
    const pass       = document.getElementById('loginPassword').value;
    const role       = document.getElementById('roleSelect').value;
    const errorEl    = 'loginError';
    const btnId      = 'loginBtn';
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const store      = rememberMe ? localStorage : sessionStorage;

    hideMessage(errorEl);

    const setError = (msg) => {
        setButtonLoading(btnId, false, 'Login');
        return showError(errorEl, msg);
    };

    if (!email || !pass || !role) return setError('All fields are required.');

    setButtonLoading(btnId, true);

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

        if (error || !admin) return setError('Invalid admin credentials.');

        store.setItem('admin_id',    admin.admin_id);
        store.setItem('admin_email', admin.email);
        store.setItem('admin_role',  admin.role);

        setButtonLoading(btnId, false, 'Redirecting...');
        window.location.href = '../AdminDashboard/AdminDashboard.html';
        return;
    }

    // ── Student / Staff Login ───────────────────────────────────────────────
    const { data: user, error } = await db
        .from('User')
        .select('user_id, email, role, reset_token, reset_token_expires')
        .eq('email', email)
        .eq('password', hashedPass)
        .eq('role', role)
        .maybeSingle();

    if (error || !user) return setError('Invalid email, password, or role.');

    // ── Email Verification Check ────────────────────────────────────────────
    // Block login if a VERIFY_ token exists (regardless of expiry)
    if (user.reset_token && user.reset_token.startsWith('VERIFY_')) {
        setButtonLoading(btnId, false, 'Login');

        // Store verified credentials for the resend action
        window._loginVerifyEmail      = email;
        window._loginVerifyHashedPass = hashedPass;

        const isExpired = new Date(user.reset_token_expires) < new Date();
        const errorDiv  = document.getElementById(errorEl);
        if (errorDiv) {
            const msg = isExpired
                ? 'Your verification link has expired.'
                : 'Please verify your email before logging in.';
            errorDiv.innerHTML = `${msg} <button onclick="handleLoginResendVerification()"
                class="underline font-semibold text-primary-teal hover:text-primary-teal-hover ml-1">
                Resend verification email</button>`;
            errorDiv.classList.remove('hidden');
        }
        return;
    }

    // ── Login success ───────────────────────────────────────────────────────
    store.setItem('user_id',    user.user_id);
    store.setItem('user_email', user.email);
    store.setItem('user_role',  user.role);

    setButtonLoading(btnId, false, 'Redirecting...');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectFacility = urlParams.get('redirect_facility');
    if (redirectFacility) {
        window.location.href = `../UserDashboard/UserDashboard.html?open_booking=${redirectFacility}`;
    } else {
        window.location.href = '../UserDashboard/UserDashboard.html';
    }
}

// ─── RESEND VERIFICATION (from Login page) ──────────────────────────────────
async function handleLoginResendVerification() {
    const email      = window._loginVerifyEmail;
    const hashedPass = window._loginVerifyHashedPass;
    if (!email || !hashedPass) return;

    const token        = 'VERIFY_' + crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // Use the hashed password as a safety gate — only updates the right account
    const { error: updateError } = await db.from('User')
        .update({ reset_token: token, reset_token_expires: tokenExpires })
        .eq('email', email)
        .eq('password', hashedPass);

    const errorDiv = document.getElementById('loginError');

    if (updateError) {
        if (errorDiv) {
            errorDiv.textContent = 'Failed to resend verification email. Please try again.';
            errorDiv.classList.remove('hidden');
        }
        return;
    }

    const currentUrl = window.location.href.split('?')[0];
    const verifyBase = currentUrl.replace('LogInPage/LogInPage.html', 'VerifyEmailPage/VerifyEmailPage.html');
    const verifyLink = `${verifyBase}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const { data: edgeData, error: edgeError } = await db.functions.invoke('send-verification-email', {
        body: { email, verifyLink }
    });

    if (errorDiv) {
        if (edgeError || !edgeData?.success) {
            errorDiv.textContent = 'Failed to send email. Please try again.';
        } else {
            errorDiv.textContent = `Verification email sent to ${email}. Please check your inbox.`;
        }
        errorDiv.classList.remove('hidden');
    }
}

// ─── VERIFY EMAIL (called from VerifyEmailPage on load) ─────────────────────
async function handleVerifyEmail() {
    const urlParams = new URLSearchParams(window.location.search);
    const token     = urlParams.get('token');  // URLSearchParams auto-decodes
    const email     = urlParams.get('email');  // URLSearchParams auto-decodes

    if (!token || !email) {
        showState('state-error');
        document.getElementById('error-message').textContent =
            'Invalid verification link. Please register again.';
        return;
    }

    // Fetch the user record
    const { data: userData, error: fetchError } = await db
        .from('User')
        .select('reset_token, reset_token_expires')
        .eq('email', email)
        .maybeSingle();

    if (fetchError || !userData) {
        showState('state-error');
        document.getElementById('error-message').textContent =
            'Account not found. Please register again.';
        return;
    }

    // Already verified (no VERIFY_ token present)
    if (!userData.reset_token || !userData.reset_token.startsWith('VERIFY_')) {
        showState('state-already-verified');
        return;
    }

    // Token mismatch (old link after a resend)
    if (userData.reset_token !== token) {
        showState('state-error');
        document.getElementById('error-message').textContent =
            'This link is no longer valid. A newer verification link may have been sent.';
        return;
    }

    // Token expired
    if (new Date(userData.reset_token_expires) < new Date()) {
        showState('state-error');
        document.getElementById('error-message').textContent =
            'Verification link has expired. Please log in and use "Resend verification email".';
        return;
    }

    // ── All checks passed — clear token to mark as verified ─────────────────
    const { error: updateError } = await db.from('User')
        .update({ reset_token: null, reset_token_expires: null })
        .eq('email', email);

    if (updateError) {
        showState('state-error');
        document.getElementById('error-message').textContent =
            'Verification failed. Please try again.';
        return;
    }

    // Show success and animate redirect bar
    showState('state-success');
    setTimeout(() => {
        const bar = document.getElementById('redirect-bar');
        if (bar) bar.style.width = '100%';
    }, 100);
    setTimeout(() => {
        window.location.href = '../LogInPage/LogInPage.html';
    }, 2200);
}

// ─── FORGOT PASSWORD (send reset link) ───────────────────────────────────────
async function handleForgotPassword() {
    const email     = document.getElementById('forgotEmail').value.trim();
    const errorEl   = 'forgotError';
    const successEl = 'forgotSuccess';
    const btnId     = 'forgotBtn';

    hideMessage(errorEl);
    hideMessage(successEl);

    const setError = (msg) => {
        setButtonLoading(btnId, false, 'Send Reset Link');
        return showError(errorEl, msg);
    };

    if (!email) return setError('Please enter your email address.');

    setButtonLoading(btnId, true);

    // 1. Check User table first (includes reset_token for verification check)
    let table = 'User';
    let { data: account, error } = await db
        .from('User')
        .select('user_id, reset_token')
        .eq('email', email)
        .maybeSingle();

    if (error || !account) {
        // Try Admin table
        table = 'Admin';
        const { data: admin, error: adminError } = await db
            .from('Admin')
            .select('admin_id')
            .eq('email', email)
            .maybeSingle();
        if (adminError || !admin) return setError('No account found with that email address.');
        account = admin;
    }

    // 2. Block password reset for unverified User accounts
    if (table === 'User' && account.reset_token && account.reset_token.startsWith('VERIFY_')) {
        return setError('Please verify your email address before resetting your password. Check your inbox for the activation link.');
    }

    // 3. Generate secure token & 15-min expiry
    const token     = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

    // 4. Save token to database
    const { error: updateError } = await db.from(table)
        .update({ reset_token: token, reset_token_expires: expiresAt })
        .eq('email', email);

    if (updateError) return setError('System error. Please try again.');

    // 5. Build reset link
    const baseUrl   = window.location.href.split('?')[0].replace(/NewPasswordPage/g, 'ResetPasswordPage');
    const resetLink = `${baseUrl}?token=${token}&email=${encodeURIComponent(email)}&type=${table}`;

    // 6. Send email via Edge Function
    const { data: edgeData, error: edgeError } = await db.functions.invoke('send-reset-email', {
        body: { email, resetLink }
    });

    if (edgeError || !edgeData?.success) {
        const detailedError = edgeData?.details?.message || edgeData?.error ||
            (edgeError && edgeError.message) || 'Unknown error';
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

    if (!email || !token || !table)          return setError('Invalid or broken reset link. Please request a new one.');
    if (table !== 'User' && table !== 'Admin') return setError('Invalid account type.');
    if (!newPass || !confirmPass)             return setError('All fields are required.');
    if (newPass.length < 8)                  return setError('Password must be at least 8 characters.');
    if (newPass !== confirmPass)             return setError('Passwords do not match.');

    setButtonLoading(btnId, true);

    // 1. Fetch token from database
    const { data: userData, error: fetchError } = await db.from(table)
        .select('reset_token, reset_token_expires')
        .eq('email', email)
        .maybeSingle();

    if (fetchError || !userData) return setError('Account not found.');

    // 2. Guard: reject if a verification token is present (not a reset token)
    if (userData.reset_token && userData.reset_token.startsWith('VERIFY_')) {
        return setError('Invalid reset token. Please request a new password reset link.');
    }

    // 3. Validate token match and expiry
    if (userData.reset_token !== token)                        return setError('Invalid reset token. Please request a new link.');
    if (new Date(userData.reset_token_expires) < new Date())   return setError('Reset link has expired. Please request a new one.');

    // 4. Hash and update password, clear token
    const hashedPass = await hashPassword(newPass);

    const { error: updateError } = await db.from(table)
        .update({ password: hashedPass, reset_token: null, reset_token_expires: null })
        .eq('email', email);

    if (updateError) return setError('Failed to reset password. Please try again.');

    showSuccess(successEl, 'Password reset successfully!');
    setButtonLoading(btnId, false, 'Redirecting...');
    setTimeout(() => { window.location.href = '../LogInPage/LogInPage.html'; }, 2000);
}
