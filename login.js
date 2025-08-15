import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Gunakan URL dan Anon Key Supabase Anda
const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Mencegah form reload halaman

    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value;
    let emailToLogin = identifier;

    // Cek apakah input BUKAN email (maka kita anggap itu username)
    if (!identifier.includes('@')) {
        // Cari email di tabel 'profiles' berdasarkan username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email') // Langsung ambil email dari profil
            .eq('username', identifier)
            .single();

        if (profileError || !profile) {
            alert("Login Gagal: Username tidak ditemukan.");
            return;
        }
        emailToLogin = profile.email; // Gunakan email yang ditemukan
    }
    
    // Lanjutkan proses login menggunakan email
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password: password
    });

    if (signInError) {
        alert("Login Gagal: " + signInError.message);
    } else {
        alert("Login Admin Berhasil!");
        // Arahkan ke halaman dashboard admin setelah login sukses
        window.location.href = "admin.html";
    }
});