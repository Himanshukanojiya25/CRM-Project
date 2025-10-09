// ✅ EMERGENCY DEBUG - CHECK IF SCRIPT LOADS
console.log('🚨 DEBUG: auth.js loaded successfully');

// ✅ CLEAN AUTH MANAGER - GUARANTEED WORKING
class AuthManager {
    constructor() {
        console.log('🟢 Auth Manager Constructor Called');
        this.init();
    }

    init() {
        console.log('🟢 Auth Manager Init Started');
        this.bindEvents();
        console.log('✅ Auth Manager Initialized');
    }

    bindEvents() {
        console.log('🟢 Binding Events...');
        
        // EMERGENCY: Prevent ALL form submissions
        document.addEventListener('submit', (e) => {
            console.log('🛑 GLOBAL FORM SUBMIT BLOCKED');
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('✅ Login form found, attaching listener');
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        } else {
            console.log('❌ Login form NOT found');
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            console.log('✅ Register form found, attaching listener');
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        } else {
            console.log('❌ Register form NOT found');
        }

        // View switching
        this.bindViewSwitching();
    }

    bindViewSwitching() {
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const loginSection = document.getElementById('loginSection');
        const registerSection = document.getElementById('registerSection');

        if (showRegister && showLogin) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Switching to Register view');
                if (loginSection) loginSection.style.display = 'none';
                if (registerSection) registerSection.style.display = 'block';
            });

            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Switching to Login view');
                if (registerSection) registerSection.style.display = 'none';
                if (loginSection) loginSection.style.display = 'block';
            });
        }
    }

    // ✅ FIXED REGISTER - GUARANTEED REDIRECT
    async handleRegister(e) {
        console.log('🟢🟢🟢 REGISTER FORM SUBMITTED 🟢🟢🟢');
        e.preventDefault();
        e.stopPropagation();
        
        const submitBtn = document.querySelector('#registerForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Creating Account...';

            const formData = {
                name: document.getElementById('regName').value.trim(),
                email: document.getElementById('regEmail').value.trim().toLowerCase(),
                password: document.getElementById('regPassword').value,
                confirmPassword: document.getElementById('regConfirmPassword').value,
                phone: document.getElementById('regPhone')?.value || '',
                role: 'user'
            };

            console.log('📤 Register Data:', formData);

            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('📥 Register Response:', result);

            if (result.success) {
                console.log('✅ Registration successful - Redirecting to login');
                alert('✅ Registration successful! Redirecting to login...');
                
                // ✅ FORCE REDIRECT TO LOGIN PAGE
                window.location.href = result.redirectUrl || '/auth';
            } else {
                alert('❌ ' + result.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }

        } catch (error) {
            console.error('❌ Register Error:', error);
            alert('❌ Registration failed! Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // ✅ FIXED LOGIN - GUARANTEED REDIRECT
    async handleLogin(e) {
        console.log('🟢🟢🟢 LOGIN FORM SUBMITTED 🟢🟢🟢');
        e.preventDefault();
        e.stopPropagation();
        
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Signing In...';

            const formData = {
                email: document.getElementById('loginEmail').value.trim().toLowerCase(),
                password: document.getElementById('loginPassword').value
            };

            console.log('📤 Login Data:', formData);

            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // ✅ IMPORTANT: Include cookies
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('📥 Login Response:', result);

            if (result.success) {
                console.log('✅ Login successful - Redirecting to dashboard');
                alert('✅ Login successful! Redirecting...');
                
                // ✅ FORCE REDIRECT TO DASHBOARD
                window.location.href = result.redirectUrl || '/dashboard';
            } else {
                alert('❌ ' + result.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }

        } catch (error) {
            console.error('❌ Login Error:', error);
            alert('❌ Login failed! Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// ✅ EMERGENCY: Global form prevention
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Loaded - Initializing Auth System...');
    
    // Prevent any default form behavior
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            console.log('🛑 Additional form prevention');
            e.preventDefault();
        });
    });
    
    // Initialize Auth Manager
    new AuthManager();
});