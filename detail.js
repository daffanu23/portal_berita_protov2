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
    if (!id) {
        detailContainer.innerHTML = "<h1>Error: ID Berita tidak ditemukan.</h1>";
        return;
    }
    detailContainer.innerHTML = "<p>Memuat berita...</p>";
    const { data, error } = await supabase.from("berita").select(`judul, isi_berita, created_at, kategori(nama_kategori)`).eq("id", id).single();
    if (error) {
        detailContainer.innerHTML = `<h1>Error: Berita tidak dapat ditemukan.</h1>`;
    } else {
        const tanggal = new Date(data.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        detailContainer.innerHTML = `
            <div class="berita-header">
                <h1>${data.judul}</h1>
                <p class="berita-meta">
                    <strong>Kategori:</strong> ${data.kategori.nama_kategori} | 
                    <strong>Dipublikasikan pada:</strong> ${tanggal}
                </p>
            </div>
            <div class="berita-content">
                ${data.isi_berita.replace(/\n/g, '<br>')}
            </div>
        `;
    }
}

// --- LOGIKA SESI & OTENTIKASI ---
async function setupAuthUI() {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user;

    if (currentUser) {
        authStatusContainer.innerHTML = `<p>Login sebagai: ${currentUser.email} | <button id="logout-btn">Logout</button></p>`;
        loginPrompt.style.display = 'none';
        komentarForm.style.display = 'block';
        document.getElementById("logout-btn").addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    } else {
        authStatusContainer.innerHTML = "";
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
    if (error) {
        console.error("Gagal mengirim komentar:", error);
    } else {
        komentarForm.reset();
        await muatKomentar();
    }
});

// GANTI FUNGSI LAMA ANDA DENGAN VERSI LENGKAP INI
// GANTI FUNGSI LAMA DENGAN VERSI LENGKAP INI
async function muatKomentar() {
    const beritaId = getBeritaIdFromUrl();
    if (!beritaId) {
        komentarList.innerHTML = "";
        return;
    }

    komentarList.innerHTML = "<p>Memuat komentar...</p>";

    const { data, error } = await supabase
        .from('komentar')
        .select(`
            id,
            created_at,
            isi_komentar,
            id_induk_komentar,
            profiles ( id, username )
        `)
        .eq('id_berita', beritaId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("GAGAL MENGAMBIL KOMENTAR:", error);
        komentarList.innerHTML = "<p>Terjadi kesalahan saat memuat komentar. Cek console browser untuk detail.</p>";
        return;
    }

    if (data.length === 0) {
        komentarList.innerHTML = "<p>Jadilah yang pertama berkomentar!</p>";
        return;
    }

    komentarList.innerHTML = "";
    const commentMap = {};

    data.forEach(komentar => {
        const commentEl = document.createElement('div');
        commentEl.id = `comment-${komentar.id}`;
        commentEl.style.cssText = "border: 1px solid #eee; padding: 10px; margin-top: 10px; border-radius: 5px;";

        // INI ADALAH BARIS YANG SUDAH DIPERBAIKI DAN LEBIH AMAN
        const username = komentar.profiles?.username; // Menggunakan optional chaining (?.)
        const namaTampilan = username ? username.split('@')[0] : 'User Anonim';

        commentEl.innerHTML = `
            <p><strong>${namaTampilan}</strong> <span style="font-size:0.8em; color:gray;">- ${new Date(komentar.created_at).toLocaleString('id-ID')}</span></p>
            <p>${komentar.isi_komentar}</p>
            <button onclick="showReplyForm(${komentar.id})">Balas</button>
            <div id="reply-form-container-${komentar.id}"></div>
        `;
        commentMap[komentar.id] = commentEl;
    });

    data.forEach(komentar => {
        if (komentar.id_induk_komentar && commentMap[komentar.id_induk_komentar]) {
            const parentEl = commentMap[komentar.id_induk_komentar];
            const replyEl = commentMap[komentar.id];
            if (replyEl) {
                replyEl.style.cssText += "margin-left: 30px; border-left: 2px solid #ddd;";
                parentEl.appendChild(replyEl);
            }
        }
    });

    data.forEach(komentar => {
        if (!komentar.id_induk_komentar) {
            komentarList.appendChild(commentMap[komentar.id]);
        }
    });
}

window.showReplyForm = function(parentId) {
    const container = document.getElementById(`reply-form-container-${parentId}`);
    container.innerHTML = `
        <form onsubmit="postReply(event, ${parentId})">
            <textarea placeholder="Tulis balasan..." required></textarea>
            <button type="submit">Kirim Balasan</button>
        </form>
    `;
};

window.postReply = async function(event, parentId) {
    event.preventDefault();
    if (!currentUser) {
        alert("Anda harus login untuk membalas.");
        return;
    }
    const isiKomentar = event.target.querySelector('textarea').value;
    const beritaId = getBeritaIdFromUrl();
    const { error } = await supabase.from('komentar').insert({
        isi_komentar: isiKomentar,
        id_berita: beritaId,
        id_user: currentUser.id,
        id_induk_komentar: parentId
    });
    if (error) {
        console.error("Gagal mengirim balasan:", error);
    } else {
        await muatKomentar();
    }
};

// --- INISIALISASI HALAMAN ---
async function initPage() {
    await setupAuthUI();
    await muatDetailBerita();
    await muatKomentar();
}

initPage();