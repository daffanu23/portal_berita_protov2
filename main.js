import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- ELEMEN & LOGIKA OTENTIKASI (Tetap sama) ---
const userStatusContainer = document.getElementById("user-status-container");

// GANTI FUNGSI LAMA DENGAN VERSI BARU INI DI main.js
async function setupUserStatus() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // --- JIKA PENGGUNA LOGIN ---
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .single();

        let username = profile ? profile.username.split('@')[0] : 'User';
        let avatarUrl = profile && profile.avatar_url ? profile.avatar_url : 'placeholder.png';

        // Buat struktur HTML baru untuk dropdown
        userStatusContainer.innerHTML = `
            <div class="profile-dropdown">
                <div class="profile-trigger">
                    <img src="${avatarUrl}" alt="Avatar">
                    <span>Halo, <strong>${username}</strong>!</span>
                </div>

                <div class="dropdown-content">
                    <a href="profile.html">Profil</a>
                    <a href="#" id="logout-btn" class="logout-link">Log Out</a>
                </div>
            </div>
        `;

        // Tambahkan fungsi untuk tombol logout (logika ini tetap sama)
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });

    } else {
        // --- JIKA PENGGUNA TIDAK LOGIN ---
        userStatusContainer.innerHTML = `
            <a href="login-user.html">Login</a> | <a href="registrasi.html">Registrasi</a>
        `;
    }
}

// --- FUNGSI TAMPIL BERITA (Bagian yang Diperbarui) ---
const beritaListContainer = document.getElementById("berita-list");

async function muatSemuaBerita() {
    beritaListContainer.innerHTML = "<p>Memuat berita...</p>";

    // Kita juga mengambil 'banner_url'
    const { data, error } = await supabase
        .from("berita")
        .select(`id, judul, isi_berita, banner_url, kategori(nama_kategori)`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gagal memuat berita:", error);
        beritaListContainer.innerHTML = "<p>Gagal memuat berita.</p>";
        return;
    }
    if (data.length === 0) {
        beritaListContainer.innerHTML = "<p>Belum ada berita yang dipublikasikan.</p>";
        return;
    }

    beritaListContainer.innerHTML = "";
    data.forEach(berita => {
        // --- LOGIKA BARU UNTUK MEMBACA JSON ---
        let preview = 'Klik untuk membaca lebih lanjut...';
        // Pastikan isi_berita ada dan merupakan array
        if (berita.isi_berita && Array.isArray(berita.isi_berita)) {
            // Cari blok pertama yang merupakan paragraf
            const firstParagraph = berita.isi_berita.find(block => block.type === 'paragraph');
            if (firstParagraph && firstParagraph.content) {
                preview = firstParagraph.content.substring(0, 100) + "...";
            }
        }
        // Gunakan banner sebagai gambar kartu, atau gambar placeholder jika tidak ada
        const bannerUrl = berita.banner_url || 'placeholder.png';

        // Buat kartu berita dengan struktur baru
        const card = document.createElement("div");
        card.className = "berita-card";
        card.innerHTML = `
            <img src="${bannerUrl}" alt="${berita.judul}" style="width:100%; height:150px; object-fit:cover; border-radius: 5px 5px 0 0;">
            <div style="padding: 15px;">
                <h3>${berita.judul}</h3>
                <p><strong>Kategori:</strong> ${berita.kategori.nama_kategori}</p>
                <p style="font-size: 0.9em; color: #555;">${preview}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `detail.html?id=${berita.id}`;
        });
        beritaListContainer.appendChild(card);
    });
}

// Panggil semua fungsi
setupUserStatus();
muatSemuaBerita();