import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// Fungsi baru untuk menampilkan notifikasi (kita buat di kedua file agar mandiri)
function displayNotification(message, type) {
    const notificationElement = document.getElementById('notification-message');
    if (notificationElement) {
        notificationElement.textContent = message;
        notificationElement.style.color = type === 'success' ? 'green' : 'red';
    }
}

// Logika untuk Form Registrasi
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = document.getElementById('username').value;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username: username } }
        });

        if (error) {
            displayNotification("Error saat registrasi: " + error.message, 'error');
        } else {
            displayNotification("Registrasi berhasil! Anda akan diarahkan ke halaman login.", 'success');
            setTimeout(() => {
                window.location.href = "login-user.html";
            }, 1500);
        }
    });
}

// Logika untuk Form Login Fleksibel
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;
        let emailToLogin = identifier;

        if (!identifier.includes('@')) {
            const { data: profile, error: profileError } = await supabase.from('profiles').select('email').eq('username', identifier).single();
            if (profileError || !profile) {
                displayNotification("Login Gagal: Username tidak ditemukan.", 'error');
                return;
            }
            emailToLogin = profile.email;
        }
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: emailToLogin,
            password: password
        });

        if (signInError) {
            displayNotification("Login Gagal: " + signInError.message, 'error');
        } else {
            displayNotification("Login berhasil!", 'success');
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        }
    });
}