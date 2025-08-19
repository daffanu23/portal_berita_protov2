import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- DEFINISI ELEMEN ---
const userStatusContainer = document.getElementById("user-status-container");
const beritaListContainer = document.getElementById("berita-list");
const kategoriFilter = document.getElementById("kategori-filter"); // ELEMEN BARU

// --- LOGIKA OTENTIKASI (Tetap sama) ---
async function setupUserStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', session.user.id).single();
        let username = profile ? profile.username.split('@')[0] : 'User';
        let avatarUrl = profile && profile.avatar_url ? profile.avatar_url : 'placeholder.png';
        userStatusContainer.innerHTML = `<div class="profile-dropdown"><div class="profile-trigger"><img src="${avatarUrl}" alt="Avatar"><span>Halo, <strong>${username}</strong>!</span></div><div class="dropdown-content"><a href="profile.html">Profil</a><a href="#" id="logout-btn" class="logout-link">Log Out</a></div></div>`;
        document.getElementById('logout-btn').addEventListener('click', async () => { await supabase.auth.signOut(); window.location.reload(); });
    } else {
        userStatusContainer.innerHTML = `<a href="login-user.html">Login</a> | <a href="registrasi.html">Registrasi</a>`;
    }
}

// --- FUNGSI BARU: ISI DROPDOWN FILTER ---
async function muatKategoriFilter() {
    const { data, error } = await supabase
        .from('kategori')
        .select('id, nama_kategori');

    if (error) {
        console.error('Gagal memuat kategori untuk filter:', error);
        return;
    }

    data.forEach(kategori => {
        const option = document.createElement('option');
        option.value = kategori.id;
        option.textContent = kategori.nama_kategori;
        kategoriFilter.appendChild(option);
    });
}

// --- FUNGSI TAMPIL BERITA (Diperbarui untuk bisa menerima filter) ---
async function muatBerita(filterKategoriId = 'semua') {
    beritaListContainer.innerHTML = "<p>Memuat berita...</p>";

    // Buat query dasar
    let query = supabase
        .from("berita")
        .select(`id, judul, isi_berita, banner_url, kategori(nama_kategori)`);

    // Jika ada filter yang dipilih (bukan 'semua'), tambahkan filter .eq()
    if (filterKategoriId !== 'semua') {
        query = query.eq('id_kategori', filterKategoriId);
    }
    
    // Selalu urutkan berdasarkan yang terbaru
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error("Gagal memuat berita:", error);
        beritaListContainer.innerHTML = "<p>Gagal memuat berita.</p>";
        return;
    }
    if (data.length === 0) {
        beritaListContainer.innerHTML = "<p>Tidak ada berita yang ditemukan untuk kategori ini.</p>";
        return;
    }

    beritaListContainer.innerHTML = "";
    data.forEach(berita => {
        let preview = 'Klik untuk membaca lebih lanjut...';
        if (berita.isi_berita && Array.isArray(berita.isi_berita)) {
            const firstParagraph = berita.isi_berita.find(block => block.type === 'paragraph');
            if (firstParagraph && firstParagraph.content) {
                preview = firstParagraph.content.substring(0, 100) + "...";
            }
        }
        const bannerUrl = berita.banner_url || 'placeholder.png';

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

// --- EVENT LISTENER BARU UNTUK FILTER ---
kategoriFilter.addEventListener('change', (event) => {
    const kategoriId = event.target.value;
    muatBerita(kategoriId); // Panggil fungsi muatBerita dengan ID kategori yang dipilih
});


// --- INISIALISASI HALAMAN ---
async function initPage() {
    await setupUserStatus();
    await muatKategoriFilter(); // Panggil fungsi baru untuk mengisi filter
    await muatBerita(); // Panggil muatBerita tanpa argumen untuk menampilkan semua berita di awal
}

initPage();