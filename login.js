import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

const loginForm = document.getElementById("login-form");
const notificationElement = document.getElementById('notification-message');

// Fungsi baru untuk menampilkan notifikasi
function displayNotification(message, type) {
    notificationElement.textContent = message;
    notificationElement.style.color = type === 'success' ? 'green' : 'red';
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value;
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
        displayNotification("Login Admin Berhasil!", 'success');
        // Beri jeda 1 detik agar user bisa membaca pesan sukses sebelum pindah halaman
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 1000);
    }
});