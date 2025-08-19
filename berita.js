import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

const { data: { session } } = await supabase.auth.getSession();
if (!session) { alert("Anda harus login."); window.location.href = "login.html"; }

const beritaForm = document.getElementById("berita-form");
const beritaIdInput = document.getElementById("berita-id");
const judulInput = document.getElementById("judul");
const kategoriSelect = document.getElementById("kategori");
const beritaList = document.getElementById("berita-list");
const bannerInput = document.getElementById("banner-input");
const bannerPreview = document.getElementById("banner-preview");
const bannerExplanationInput = document.getElementById("banner-explanation-input");
const bannerSourceInput = document.getElementById("banner-source-input");
const contentBuilder = document.getElementById("content-builder");
const addParagraphBtn = document.getElementById("add-paragraph-btn");
const addImageBtn = document.getElementById("add-image-btn");
const notificationContainer = document.getElementById('notification-container');

function displayNotification(message, type) {
    notificationContainer.textContent = message;
    notificationContainer.style.display = 'block';
    notificationContainer.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    notificationContainer.style.color = type === 'success' ? '#155724' : '#721c24';
}

function addParagraphBlock(content = '') {
    const block = document.createElement('div');
    block.className = 'content-block';
    block.setAttribute('data-type', 'paragraph');
    block.innerHTML = `<div class="content-block-header"><span>Paragraf</span><button type="button" onclick="this.parentElement.parentElement.remove()">Hapus</button></div><textarea>${content}</textarea>`;
    contentBuilder.appendChild(block);
}

function addImageBlock(url = '', explanation = '', source = '') {
    const block = document.createElement('div');
    block.className = 'content-block';
    block.setAttribute('data-type', 'image');
    block.innerHTML = `<div class="content-block-header"><span>Gambar</span><button type="button" onclick="this.parentElement.parentElement.remove()">Hapus</button></div><input type="file" class="image-file-input" accept="image/*"><img src="${url}" class="image-preview" style="max-width: 150px; margin-top: 10px; ${url ? 'display:block;' : 'display: none;'}"><input type="text" class="image-explanation-input" placeholder="Penjelasan gambar" value="${explanation}"><input type="text" class="image-source-input" placeholder="Sumber gambar" value="${source}" style="margin-top: 5px;">`;
    contentBuilder.appendChild(block);
}

addParagraphBtn.addEventListener('click', () => addParagraphBlock());
addImageBtn.addEventListener('click', () => addImageBlock());
bannerInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) { bannerPreview.src = URL.createObjectURL(file); bannerPreview.style.display = 'block'; } });
contentBuilder.addEventListener('change', (e) => { if (e.target.classList.contains('image-file-input')) { const block = e.target.closest('.content-block'); const preview = block.querySelector('.image-preview'); const file = e.target.files[0]; if (file) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; } } });

beritaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    try {
        let finalBannerUrl = bannerPreview.src;
        if (bannerInput.files[0]) { finalBannerUrl = await uploadFile(bannerInput.files[0]); }
        const isiBeritaJson = [];
        for (const block of contentBuilder.querySelectorAll('.content-block')) {
            const type = block.getAttribute('data-type');
            if (type === 'paragraph') { const content = block.querySelector('textarea').value; if (content) isiBeritaJson.push({ type: 'paragraph', content }); } 
            else if (type === 'image') {
                const imageInput = block.querySelector('.image-file-input');
                let imageUrl = block.querySelector('.image-preview').src;
                if (imageInput.files[0]) { imageUrl = await uploadFile(imageInput.files[0]); }
                const explanation = block.querySelector('.image-explanation-input').value;
                const source = block.querySelector('.image-source-input').value;
                if (imageUrl && !imageUrl.includes('blob:')) isiBeritaJson.push({ type: 'image', url: imageUrl, explanation, source });
            }
        }
        const beritaData = { judul: judulInput.value, id_kategori: kategoriSelect.value, banner_url: finalBannerUrl.includes('blob:') ? null : finalBannerUrl, banner_explanation: bannerExplanationInput.value, banner_source: bannerSourceInput.value, isi_berita: isiBeritaJson, author_id: session.user.id };
        const id = beritaIdInput.value;
        let error;
        if (id) { ({ error } = await supabase.from("berita").update(beritaData).eq("id", id)); } 
        else { ({ error } = await supabase.from("berita").insert([beritaData])); }
        if (error) throw error;
        displayNotification('Berita berhasil disimpan!', 'success');
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) { displayNotification('Gagal menyimpan berita: ' + error.message, 'error'); } 
    finally { submitBtn.disabled = false; submitBtn.textContent = 'Simpan Berita'; }
});

async function uploadFile(file) {
    const filePath = `public/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('gambar-berita').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('gambar-berita').getPublicUrl(filePath);
    return data.publicUrl;
}

async function muatPilihanKategori() {
    const { data, error } = await supabase.from("kategori").select("id, nama_kategori");
    if (error) { console.error("Gagal memuat kategori:", error); return; }
    data.forEach(kategori => { const option = document.createElement("option"); option.value = kategori.id; option.textContent = kategori.nama_kategori; kategoriSelect.appendChild(option); });
}

async function muatBerita() {
    beritaList.innerHTML = "<tr><td colspan='3'>Memuat...</td></tr>";
    const { data, error } = await supabase.from("berita").select(`id, judul, created_at, kategori(nama_kategori)`).order("created_at", { ascending: false });
    if (error) { console.error("Gagal memuat berita:", error); return; }
    beritaList.innerHTML = "";
    data.forEach(berita => { beritaList.innerHTML += `<tr><td>${berita.judul}</td><td>${berita.kategori ? berita.kategori.nama_kategori : 'Tanpa Kategori'}</td><td><button onclick="editBerita(${berita.id})">Edit</button><button onclick="hapusBerita(${berita.id})">Hapus</button></td></tr>`; });
}

window.editBerita = async function(id) {
    notificationContainer.style.display = 'none';
    const { data, error } = await supabase.from("berita").select("*").eq("id", id).single();
    if (error) { displayNotification('Gagal memuat data berita untuk diedit.', 'error'); return; }
    beritaForm.reset();
    contentBuilder.innerHTML = '';
    bannerPreview.src = '';
    bannerPreview.style.display = 'none';
    beritaIdInput.value = data.id;
    judulInput.value = data.judul;
    kategoriSelect.value = data.id_kategori;
    if (data.banner_url) { bannerPreview.src = data.banner_url; bannerPreview.style.display = 'block'; }
    bannerExplanationInput.value = data.banner_explanation || '';
    bannerSourceInput.value = data.banner_source || '';
    if (data.isi_berita && Array.isArray(data.isi_berita)) {
        data.isi_berita.forEach(block => {
            if (block.type === 'paragraph') { addParagraphBlock(block.content); } 
            else if (block.type === 'image') { addImageBlock(block.url, block.explanation, block.source); }
        });
    }
    window.scrollTo(0, 0);
};

window.hapusBerita = async function(id) {
    if (confirm("Yakin hapus berita ini?")) {
        const { error } = await supabase.from("berita").delete().eq("id", id);
        if (error) { displayNotification("Gagal menghapus berita: " + error.message, 'error'); } 
        else { displayNotification("Berita berhasil dihapus.", 'success'); await muatBerita(); }
    }
};

async function initPage() { await muatPilihanKategori(); await muatBerita(); addParagraphBlock(); }
initPage();