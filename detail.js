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

// --- FUNGSI UTAMA ---
function getBeritaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function muatDetailBerita() {
    const id = getBeritaIdFromUrl();
    if (!id) { detailContainer.innerHTML = "<h1>Error: ID Berita tidak ditemukan.</h1>"; return; }
    detailContainer.innerHTML = "<p>Memuat berita...</p>";

    // Kita ambil semua data termasuk banner_url dan isi_berita (jsonb)
    const { data, error } = await supabase
        .from("berita")
        .select(`judul, isi_berita, banner_url, created_at, kategori(nama_kategori)`)
        .eq("id", id)
        .single();

    if (error) {
        console.error("Gagal memuat detail:", error);
        detailContainer.innerHTML = `<h1>Error: Berita tidak dapat ditemukan.</h1>`;
        return;
    }

    const tanggal = new Date(data.created_at).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let contentHtml = '';

    // --- LOGIKA BARU UNTUK MERENDER KONTEN JSON ---
    if (data.isi_berita && Array.isArray(data.isi_berita)) {
        data.isi_berita.forEach(block => {
            if (block.type === 'paragraph') {
                // Jika tipe adalah paragraf, buat tag <p>
                contentHtml += `<p style="line-height: 1.7; font-size: 1.1em;">${block.content}</p>`;
            } else if (block.type === 'image' && block.url) {
                // Jika tipe adalah gambar, buat tag <figure> dengan <img> dan <figcaption>
                contentHtml += `
                    <figure style="margin: 20px 0;">
                        <img src="${block.url}" alt="${block.caption || 'Gambar Berita'}" style="max-width: 100%; border-radius: 5px;">
                        ${block.caption ? `<figcaption style="text-align: center; font-style: italic; color: #555; margin-top: 5px;">${block.caption}</figcaption>` : ''}
                    </figure>
                `;
            }
        });
    }

    // Gabungkan semua bagian menjadi HTML akhir
    detailContainer.innerHTML = `
        <div class="berita-header">
            <h1>${data.judul}</h1>
            <p class="berita-meta">
                <strong>Kategori:</strong> ${data.kategori.nama_kategori} | 
                <strong>Dipublikasikan pada:</strong> ${tanggal}
            </p>
        </div>
        ${data.banner_url ? `<img src="${data.banner_url}" alt="Banner" style="width:100%; margin-bottom: 20px; border-radius: 5px;">` : ''}
        <div class="berita-content">
            ${contentHtml}
        </div>
    `;
}

// --- LOGIKA SESI & OTENTIKASI ---
async function setupAuthUI() {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user;

    if (currentUser) {
        const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', currentUser.id).single();
        let username = (profile && profile.username) ? profile.username.split('@')[0] : 'User';
        let avatarUrl = (profile && profile.avatar_url) ? profile.avatar_url : 'placeholder.png';

        authStatusContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 15px; margin-bottom: 10px;">
                <a href="profile.html" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: black;">
                    <img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <span><strong>${username}</strong></span>
                </a>
                <button id="logout-btn">Logout</button>
            </div>
        `;
        
        loginPrompt.style.display = 'none';
        komentarForm.style.display = 'block';

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });

    } else {
        authStatusContainer.innerHTML = `
             <div style="text-align: right; margin-bottom: 10px;">
                <a href="login-user.html">Login</a> | <a href="registrasi.html">Registrasi</a>
            </div>
        `;
        loginPrompt.style.display = 'block';
        komentarForm.style.display = 'none';
    }
}

// --- LOGIKA KOMENTAR ---
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

        commentEl.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                <div style="flex: 1;">
                    <p style="margin: 0;">
                        <strong>${namaTampilan}</strong> 
                        <span style="font-size:0.8em; color:gray;">- ${new Date(komentar.created_at).toLocaleString('id-ID')}</span>
                    </p>
                    <p style="margin-top: 5px;">${komentar.isi_komentar}</p>
                    <button onclick="showReplyForm(${komentar.id})" style="background:none; border:none; color:gray; cursor:pointer; padding:0; font-size: 0.9em;">Balas</button>
                    <div id="reply-form-container-${komentar.id}"></div>
                </div>
            </div>
        `;
        commentMap.set(komentar.id, commentEl);
    });

    data.forEach(komentar => {
        if (komentar.id_induk_komentar && commentMap.has(komentar.id_induk_komentar)) {
            const parentEl = commentMap.get(komentar.id_induk_komentar);
            const replyEl = commentMap.get(komentar.id);
            if (parentEl && replyEl) {
                // Terapkan gaya ala Reddit ke elemen balasan
                replyEl.style.borderLeft = "2px solid #ddd";
                replyEl.style.marginLeft = "10px";
                replyEl.style.paddingLeft = "15px";
                // Tambahkan balasan ke elemen induk
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
    // Cegah form balasan muncul berkali-kali
    if (container.querySelector('form')) return;

    container.innerHTML = `
        <form onsubmit="postReply(event, ${parentId})" style="margin-top: 10px;">
            <textarea placeholder="Tulis balasan..." required style="width: 100%; box-sizing: border-box;"></textarea>
            <button type="submit" style="margin-top: 5px;">Kirim Balasan</button>
        </form>
    `;
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

// --- INISIALISASI HALAMAN ---
async function initPage() {
    await setupAuthUI();
    await muatDetailBerita();
    await muatKomentar();
}

initPage();