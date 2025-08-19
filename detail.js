import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- DEFINISI ELEMEN ---
const detailContainer = document.getElementById("detail-berita-container");
const authStatusContainer = document.getElementById("auth-status");
const komentarForm = document.getElementById("komentar-form");
const loginPrompt = document.getElementById("login-prompt");
const komentarList = document.getElementById("komentar-list");
let currentUser = null;

// --- FUNGSI-FUNGSI ---
function getBeritaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function buatTombolShare(url, title) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const container = document.getElementById('share-buttons-container');
    if (!container) return;
    container.innerHTML = `<div class="share-buttons"><span>Bagikan:</span><a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" class="sb-facebook" title="Bagikan ke Facebook"><i class="fab fa-facebook-f"></i></a><a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" class="sb-x" title="Bagikan ke X"><i class="fab fa-twitter"></i></a><a href="https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}" target="_blank" class="sb-whatsapp" title="Bagikan ke WhatsApp"><i class="fab fa-whatsapp"></i></a><a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" target="_blank" class="sb-telegram" title="Bagikan ke Telegram"><i class="fab fa-telegram"></i></a><button id="copy-link-btn" class="sb-copy" title="Salin Tautan"><i class="fas fa-link"></i></button></div>`;
    document.getElementById('copy-link-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(url).then(() => { alert('Tautan berita berhasil disalin!'); }, () => { alert('Gagal menyalin tautan.'); });
    });
}

async function muatBeritaLain(currentArticleId) {
    const gridContainer = document.getElementById('berita-lain-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '<p>Memuat berita lain...</p>';
    const { data, error } = await supabase.from('berita').select('id, judul, banner_url').neq('id', currentArticleId).order('created_at', { ascending: false }).limit(3);
    if (error || !data || data.length === 0) { gridContainer.innerHTML = ''; return; }
    gridContainer.innerHTML = '';
    data.forEach(berita => {
        const banner = berita.banner_url || 'placeholder.png';
        gridContainer.innerHTML += `<a href="detail.html?id=${berita.id}" class="berita-lain-card"><img src="${banner}" alt="${berita.judul}"><h4>${berita.judul}</h4></a>`;
    });
}

async function muatDetailBerita() {
    const id = getBeritaIdFromUrl();
    if (!id) { detailContainer.innerHTML = "<h1>Error: ID Berita tidak ditemukan.</h1>"; return; }
    detailContainer.innerHTML = "<p>Memuat berita...</p>";
    const { data, error } = await supabase.from("berita").select(`*, kategori(nama_kategori), profiles:author_id(username, avatar_url)`).eq("id", id).single();
    if (error || !data) { console.error("Gagal memuat detail:", error); detailContainer.innerHTML = `<h1>Error: Berita tidak dapat ditemukan.</h1>`; return; }
    
    buatTombolShare(window.location.href, data.judul);
    const tanggal = new Date(data.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let authorHtml = '';
    if (data.profiles) {
        const authorAvatar = data.profiles.avatar_url || 'placeholder.png';
        const authorName = data.profiles.username ? data.profiles.username.split('@')[0] : 'Admin';
        authorHtml = `<div style="display: flex; align-items: center; gap: 10px; margin-top: 15px;"><img src="${authorAvatar}" alt="Avatar Penulis" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"><div><strong style="display: block;">${authorName}</strong><span style="font-size: 0.9em; color: #555;">Penulis</span></div></div>`;
    }
    let contentHtml = '';
    if (data.isi_berita && Array.isArray(data.isi_berita)) {
        data.isi_berita.forEach(block => {
            if (block.type === 'paragraph') { contentHtml += `<p style="line-height: 1.7; font-size: 1.1em;">${block.content}</p>`; } 
            else if (block.type === 'image' && block.url) {
                const explanationText = block.explanation ? `<span style="display: block; font-size: 1em;">${block.explanation}</span>` : '';
                const sourceText = block.source ? `<span style="display: block; font-size: 0.9em; color: #555; font-style: italic;">Sumber: ${block.source}</span>` : '';
                const captionContent = explanationText + sourceText;
                contentHtml += `<figure style="margin: 20px 0;"><img src="${block.url}" alt="${block.explanation || 'Gambar Berita'}" style="max-width: 100%; border-radius: 5px;">${(block.explanation || block.source) ? `<figcaption style="text-align: left; margin-top: 5px;">${captionContent}</figcaption>` : ''}</figure>`;
            }
        });
    }
    const bannerExplanationText = data.banner_explanation ? `<span style="display: block; font-size: 1em;">${data.banner_explanation}</span>` : '';
    const bannerSourceText = data.banner_source ? `<span style="display: block; font-size: 0.9em; color: #555; font-style: italic;">Sumber: ${data.banner_source}</span>` : '';
    const bannerCaptionContent = bannerExplanationText + bannerSourceText;
    const bannerHtml = data.banner_url ? `<figure style="margin: 0 0 20px 0;"><img src="${data.banner_url}" alt="Banner" style="width:100%; border-radius: 5px;">${(data.banner_explanation || data.banner_source) ? `<figcaption style="text-align: left; margin-top: 5px;">${bannerCaptionContent}</figcaption>` : ''}</figure>` : '';
    const namaKategori = data.kategori ? data.kategori.nama_kategori : 'Tanpa Kategori';
    detailContainer.innerHTML = `<div class="berita-header"><h1>${data.judul}</h1><p class="berita-meta"><strong>Kategori:</strong> ${namaKategori} | <strong>Dipublikasikan pada:</strong> ${tanggal}</p>${authorHtml}</div>${bannerHtml}<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;"><div class="berita-content">${contentHtml}</div>`;
    
    await muatBeritaLain(data.id);
}

// FUNGSI INI HANYA UNTUK MEMPERBARUI UI (HEADER & FORM KOMENTAR)
async function updateAuthUI() {
    if (currentUser) {
        const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', currentUser.id).single();
        let username = (profile && profile.username) ? profile.username.split('@')[0] : 'User';
        let avatarUrl = (profile && profile.avatar_url) ? profile.avatar_url : 'placeholder.png';
        authStatusContainer.innerHTML = `<div class="profile-dropdown"><div class="profile-trigger"><img src="${avatarUrl}" alt="Avatar"><span>Halo, <strong>${username}</strong>!</span></div><div class="dropdown-content"><a href="profile.html">Profil</a><a href="#" id="logout-btn" class="logout-link">Log Out</a></div></div>`;
        loginPrompt.style.display = 'none';
        komentarForm.style.display = 'block';
        document.getElementById('logout-btn').addEventListener('click', async () => { await supabase.auth.signOut(); });
    } else {
        authStatusContainer.innerHTML = `<a href="login-user.html">Login</a> | <a href="registrasi.html">Registrasi</a>`;
        loginPrompt.style.display = 'block';
        komentarForm.style.display = 'none';
    }
}

komentarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const isiKomentar = document.getElementById('isi-komentar').value;
    const beritaId = getBeritaIdFromUrl();
    const { error } = await supabase.from('komentar').insert({ isi_komentar: isiKomentar, id_berita: beritaId, id_user: currentUser.id });
    if (error) { console.error("Gagal mengirim komentar:", error); } 
    else { komentarForm.reset(); await muatKomentar(); }
});

async function muatKomentar() {
    const beritaId = getBeritaIdFromUrl();
    if (!beritaId) return;
    komentarList.innerHTML = "<p>Memuat komentar...</p>";
    const { data, error } = await supabase.from('komentar').select(`id, created_at, isi_komentar, id_induk_komentar, profiles(username, avatar_url)`).eq('id_berita', beritaId).order('created_at', { ascending: true });
    if (error) { console.error("GAGAL MENGAMBIL KOMENTAR:", error); komentarList.innerHTML = "<p>Terjadi kesalahan saat memuat komentar.</p>"; return; }
    if (data.length === 0) { komentarList.innerHTML = "<p>Jadilah yang pertama berkomentar!</p>"; return; }
    komentarList.innerHTML = "";
    const commentMap = new Map();
    data.forEach(komentar => {
        const commentEl = document.createElement('div');
        commentEl.id = `comment-${komentar.id}`;
        commentEl.style.cssText = "border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;";
        const profile = komentar.profiles;
        const avatarUrl = profile && profile.avatar_url ? profile.avatar_url : 'placeholder.png';
        const namaTampilan = profile && profile.username ? profile.username.split('@')[0] : 'User Anonim';
        commentEl.innerHTML = `<div style="display: flex; align-items: flex-start; gap: 10px;"><img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"><div style="flex: 1;"><p style="margin: 0;"><strong>${namaTampilan}</strong> <span style="font-size:0.8em; color:gray;">- ${new Date(komentar.created_at).toLocaleString('id-ID')}</span></p><p style="margin-top: 5px;">${komentar.isi_komentar}</p><button onclick="showReplyForm(${komentar.id})" style="background:none; border:none; color:gray; cursor:pointer; padding:0; font-size: 0.9em;">Balas</button><div id="reply-form-container-${komentar.id}"></div></div></div>`;
        commentMap.set(komentar.id, commentEl);
    });
    data.forEach(komentar => {
        if (komentar.id_induk_komentar && commentMap.has(komentar.id_induk_komentar)) {
            const parentEl = commentMap.get(komentar.id_induk_komentar);
            const replyEl = commentMap.get(komentar.id);
            if (parentEl && replyEl) {
                replyEl.style.borderLeft = "2px solid #ddd";
                replyEl.style.marginLeft = "10px";
                replyEl.style.paddingLeft = "15px";
                parentEl.appendChild(replyEl);
            }
        }
    });
    data.forEach(komentar => {
        if (!komentar.id_induk_komentar) {
            komentarList.appendChild(commentMap.get(komentar.id));
        }
    });
}

window.showReplyForm = function(parentId) {
    const container = document.getElementById(`reply-form-container-${parentId}`);
    if (container.querySelector('form')) return;
    container.innerHTML = `<form onsubmit="postReply(event, ${parentId})" style="margin-top: 10px;"><textarea placeholder="Tulis balasan..." required style="width: 100%; box-sizing: border-box;"></textarea><button type="submit" style="margin-top: 5px;">Kirim Balasan</button></form>`;
    container.querySelector('textarea').focus();
};

window.postReply = async function(event, parentId) {
    event.preventDefault();
    if (!currentUser) { alert("Anda harus login untuk membalas."); return; }
    const isiKomentar = event.target.querySelector('textarea').value;
    const beritaId = getBeritaIdFromUrl();
    const { error } = await supabase.from('komentar').insert({ isi_komentar: isiKomentar, id_berita: beritaId, id_user: currentUser.id, id_induk_komentar: parentId });
    if (error) { console.error("Gagal mengirim balasan:", error); } 
    else { await muatKomentar(); }
};


// --- BAGIAN INISIALISASI HALAMAN YANG BARU DAN LEBIH BAIK ---

// 1. Muat konten utama halaman (berita & komentar) satu kali.
async function loadPageContent() {
    await muatDetailBerita();
    await muatKomentar();
}
loadPageContent();

// 2. Pasang "pendengar" status otentikasi.
// Pendengar ini akan berjalan saat halaman dimuat & setiap kali ada login/logout.
supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user;
    updateAuthUI(); // Perbarui UI header dan form komentar sesuai status login
});