import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- DEFINISI ELEMEN ---
const userStatusContainer = document.getElementById("user-status-container");
const beritaListContainer = document.getElementById("berita-list");
const categoryNav = document.getElementById("category-nav");

// --- LOGIKA HEADER BARU ---
async function setupHeader() {
    // 1. Ambil kategori yang ditandai untuk tampil di header
    const { data: categories, error: catError } = await supabase
        .from('kategori')
        .select('id, nama_kategori')
        .eq('tampil_di_header', true)
        .limit(7);

    if (categories) {
        // Dapatkan ID kategori dari URL untuk menandai link yang aktif
        const urlParams = new URLSearchParams(window.location.search);
        const activeCategoryId = urlParams.get('kategori');

        categoryNav.innerHTML = categories.map(cat => `
            <a href="index.html?kategori=${cat.id}" class="${cat.id == activeCategoryId ? 'active' : ''}">
                ${cat.nama_kategori.toUpperCase()}
            </a>
        `).join('');
    }

    // 2. Setup status login (logika profile dropdown tetap sama)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // ... (logika profile dropdown yang sudah ada) ...
        const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', session.user.id).single();
        let username = profile ? profile.username.split('@')[0] : 'User';
        let avatarUrl = profile && profile.avatar_url ? profile.avatar_url : 'placeholder.png';
        userStatusContainer.innerHTML = `<div class="profile-dropdown"><div class="profile-trigger"><img src="${avatarUrl}" alt="Avatar"><span>Halo, <strong>${username}</strong>!</span></div><div class="dropdown-content"><a href="profile.html">Profil</a><a href="#" id="logout-btn" class="logout-link">Log Out</a></div></div>`;
        document.getElementById('logout-btn').addEventListener('click', async () => { await supabase.auth.signOut(); window.location.reload(); });
    } else {
        userStatusContainer.innerHTML = `<a href="login-user.html" style="color: white; text-decoration: none;">Login</a>`;
    }
}

// --- FUNGSI TAMPIL BERITA (Diperbarui untuk filter via URL) ---
async function muatBerita() {
    beritaListContainer.innerHTML = "<p>Memuat berita...</p>";
    
    const urlParams = new URLSearchParams(window.location.search);
    const filterKategoriId = urlParams.get('kategori');

    let query = supabase.from("berita").select(`id, judul, isi_berita, banner_url, kategori(nama_kategori)`);

    if (filterKategoriId) {
        query = query.eq('id_kategori', filterKategoriId);
    }
    
    query = query.order("created_at", { ascending: false });
    const { data, error } = await query;

    // ... (Sisa logika untuk menampilkan kartu berita tetap sama seperti sebelumnya) ...
    if (error) { /* ... */ }
    if (data.length === 0) { /* ... */ }
    beritaListContainer.innerHTML = "";
    data.forEach(berita => {
        let preview = '...';
        if (berita.isi_berita && Array.isArray(berita.isi_berita)) {
            const firstParagraph = berita.isi_berita.find(block => block.type === 'paragraph');
            if (firstParagraph) { preview = firstParagraph.content.substring(0, 100) + "..."; }
        }
        const bannerUrl = berita.banner_url || 'placeholder.png';
        const card = document.createElement("div");
        card.className = "berita-card";
        card.innerHTML = `<img src="${bannerUrl}" ...><div style="padding: 15px;"><h3>${berita.judul}</h3><p><strong>Kategori:</strong> ${berita.kategori.nama_kategori}</p><p ...>${preview}</p></div>`;
        card.addEventListener('click', () => { window.location.href = `detail.html?id=${berita.id}`; });
        beritaListContainer.appendChild(card);
    });
}

// --- INISIALISASI HALAMAN ---
async function initPage() {
    await setupHeader();
    await muatBerita();
}

initPage();