import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- OTENTIKASI ---
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    alert("Anda harus login.");
    window.location.href = "login.html";
}

// --- DEFINISI ELEMEN ---
const beritaForm = document.getElementById("berita-form");
const beritaIdInput = document.getElementById("berita-id");
const judulInput = document.getElementById("judul");
const kategoriSelect = document.getElementById("kategori");
const beritaList = document.getElementById("berita-list");
const bannerInput = document.getElementById("banner-input");
const bannerPreview = document.getElementById("banner-preview");
const contentBuilder = document.getElementById("content-builder");
const addParagraphBtn = document.getElementById("add-paragraph-btn");
const addImageBtn = document.getElementById("add-image-btn");

// --- FUNGSI PEMBUAT BLOK KONTEN ---
let blockCounter = 0; // Untuk ID unik setiap blok

function addParagraphBlock(content = '') {
    const blockId = `block-${blockCounter++}`;
    const block = document.createElement('div');
    block.className = 'content-block';
    block.setAttribute('data-type', 'paragraph');
    block.innerHTML = `
        <div class="content-block-header">
            <span>Paragraf</span>
            <button type="button" onclick="this.parentElement.parentElement.remove()">Hapus</button>
        </div>
        <textarea>${content}</textarea>
    `;
    contentBuilder.appendChild(block);
}

function addImageBlock(url = '', caption = '') {
    const blockId = `block-${blockCounter++}`;
    const block = document.createElement('div');
    block.className = 'content-block';
    block.setAttribute('data-type', 'image');
    block.innerHTML = `
        <div class="content-block-header">
            <span>Gambar</span>
            <button type="button" onclick="this.parentElement.parentElement.remove()">Hapus</button>
        </div>
        <input type="file" class="image-file-input" accept="image/*">
        <img src="${url}" class="image-preview" style="max-width: 150px; margin-top: 10px; ${url ? '' : 'display: none;'}">
        <input type="text" class="image-caption-input" placeholder="Keterangan gambar (opsional)" value="${caption}">
    `;
    contentBuilder.appendChild(block);
}

// Event listener untuk tombol tambah blok
addParagraphBtn.addEventListener('click', () => addParagraphBlock());
addImageBtn.addEventListener('click', () => addImageBlock());

// --- LOGIKA SIMPAN DATA ---
beritaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
        // Proses upload Banner (jika ada file baru)
        let finalBannerUrl = bannerPreview.src;
        if (bannerInput.files[0]) {
            finalBannerUrl = await uploadFile(bannerInput.files[0]);
        }

        // Proses data dari content builder
        const contentBlocks = contentBuilder.querySelectorAll('.content-block');
        const isiBeritaJson = [];
        for (const block of contentBlocks) {
            const type = block.getAttribute('data-type');
            if (type === 'paragraph') {
                const content = block.querySelector('textarea').value;
                if (content) isiBeritaJson.push({ type: 'paragraph', content });
            } else if (type === 'image') {
                const imageInput = block.querySelector('.image-file-input');
                let imageUrl = block.querySelector('.image-preview').src;
                if (imageInput.files[0]) {
                    imageUrl = await uploadFile(imageInput.files[0]);
                }
                const caption = block.querySelector('.image-caption-input').value;
                if (imageUrl) isiBeritaJson.push({ type: 'image', url: imageUrl, caption });
            }
        }
        
        const beritaData = {
            judul: judulInput.value,
            id_kategori: kategoriSelect.value,
            banner_url: finalBannerUrl.includes('placeholder.png') ? null : finalBannerUrl,
            isi_berita: isiBeritaJson
        };

        // Simpan ke Supabase
        const id = beritaIdInput.value;
        let error;
        if (id) {
            ({ error } = await supabase.from("berita").update(beritaData).eq("id", id));
        } else {
            ({ error } = await supabase.from("berita").insert([beritaData]));
        }

        if (error) throw error;
        
        alert('Berita berhasil disimpan!');
        window.location.reload();

    } catch (error) {
        alert('Gagal menyimpan berita: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Berita';
    }
});

// Fungsi helper untuk upload file
async function uploadFile(file) {
    const filePath = `public/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('gambar-berita').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('gambar-berita').getPublicUrl(filePath);
    return data.publicUrl;
}

// --- LOGIKA HALAMAN LAINNYA ---
async function muatPilihanKategori() {
    // ... (fungsi ini tetap sama)
    const { data, error } = await supabase.from("kategori").select("id, nama_kategori");
    if (error) { console.error("Gagal memuat kategori:", error); return; }
    data.forEach(kategori => {
        const option = document.createElement("option");
        option.value = kategori.id;
        option.textContent = kategori.nama_kategori;
        kategoriSelect.appendChild(option);
    });
}

async function muatBerita() {
    // ... (fungsi ini tetap sama)
    beritaList.innerHTML = "<tr><td colspan='3'>Memuat...</td></tr>";
    const { data, error } = await supabase.from("berita").select(`id, judul, created_at, kategori(nama_kategori)`).order("created_at", { ascending: false });
    if (error) { console.error("Gagal memuat berita:", error); return; }
    beritaList.innerHTML = "";
    data.forEach(berita => {
        beritaList.innerHTML += `<tr><td>${berita.judul}</td><td>${berita.kategori ? berita.kategori.nama_kategori : 'Tanpa Kategori'}</td><td><button onclick="editBerita(${berita.id})">Edit</button><button onclick="hapusBerita(${berita.id})">Hapus</button></td></tr>`;
    });
}

window.editBerita = async function(id) {
    const { data, error } = await supabase.from("berita").select("*").eq("id", id).single();
    if (error) { alert('Gagal memuat data berita.'); return; }

    // Isi form utama
    beritaIdInput.value = data.id;
    judulInput.value = data.judul;
    kategoriSelect.value = data.id_kategori;
    if (data.banner_url) {
        bannerPreview.src = data.banner_url;
        bannerPreview.style.display = 'block';
    }

    // Bangun kembali content builder dari data JSON
    contentBuilder.innerHTML = '';
    if (data.isi_berita && Array.isArray(data.isi_berita)) {
        data.isi_berita.forEach(block => {
            if (block.type === 'paragraph') {
                addParagraphBlock(block.content);
            } else if (block.type === 'image') {
                addImageBlock(block.url, block.caption);
            }
        });
    }
    window.scrollTo(0, 0);
};

window.hapusBerita = async function(id) {
    // ... (fungsi ini tetap sama)
    if (confirm("Yakin hapus berita ini?")) {
        const { error } = await supabase.from("berita").delete().eq("id", id);
        if (error) { alert("Gagal menghapus."); } 
        else { await muatBerita(); }
    }
};


// INISIALISASI HALAMAN
async function initPage() {
    await muatPilihanKategori();
    await muatBerita();
    addParagraphBlock(); // Tambahkan satu blok paragraf kosong di awal
}
initPage();