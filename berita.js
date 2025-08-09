import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- 1. OTENTIKASI ---
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    alert("Anda harus login untuk mengakses halaman ini.");
    window.location.href = "login.html";
}

// --- 2. DEFINISI ELEMEN & LOGIKA T.E.H. BERITA ---
const beritaForm = document.getElementById("berita-form");
const beritaIdInput = document.getElementById("berita-id");
const judulInput = document.getElementById("judul");
const isiInput = document.getElementById("isi-berita");
const kategoriSelect = document.getElementById("kategori");
const beritaList = document.getElementById("berita-list");

// FUNGSI: Muat kategori ke dalam dropdown <select>
async function muatPilihanKategori() {
    const { data, error } = await supabase.from("kategori").select("id, nama_kategori");
    if (error) {
        console.error("Gagal memuat kategori:", error);
        return;
    }
    data.forEach(kategori => {
        const option = document.createElement("option");
        option.value = kategori.id;
        option.textContent = kategori.nama_kategori;
        kategoriSelect.appendChild(option);
    });
}

// FUNGSI TAMPIL (READ): Muat semua berita
async function muatBerita() {
    beritaList.innerHTML = "<tr><td colspan='3'>Memuat...</td></tr>";

    // Mengambil data berita sekaligus data kategori yang berelasi
    const { data, error } = await supabase
        .from("berita")
        .select(`
            id,
            judul,
            created_at,
            kategori ( nama_kategori ) 
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gagal memuat berita:", error);
        return;
    }

    beritaList.innerHTML = "";
    data.forEach(berita => {
        const row = `
            <tr>
                <td>${berita.judul}</td>
                <td>${berita.kategori ? berita.kategori.nama_kategori : 'Tanpa Kategori'}</td>
                <td>
                    <button onclick="editBerita(${berita.id})">Edit</button>
                    <button onclick="hapusBerita(${berita.id})">Hapus</button>
                </td>
            </tr>
        `;
        beritaList.innerHTML += row;
    });
}

// FUNGSI TAMBAH & EDIT (CREATE & UPDATE)
beritaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = beritaIdInput.value;
    const beritaData = {
        judul: judulInput.value,
        isi_berita: isiInput.value,
        id_kategori: kategoriSelect.value,
    };

    let error;
    if (id) {
        // Mode EDIT
        const { error: updateError } = await supabase.from("berita").update(beritaData).eq("id", id);
        error = updateError;
    } else {
        // Mode TAMBAH
        const { error: insertError } = await supabase.from("berita").insert([beritaData]);
        error = insertError;
    }

    if (error) {
        alert("Gagal menyimpan berita: " + error.message);
    } else {
        beritaForm.reset();
        beritaIdInput.value = "";
        await muatBerita();
    }
});

// FUNGSI untuk mode EDIT
window.editBerita = async function(id) {
    const { data, error } = await supabase.from("berita").select("*").eq("id", id).single();
    if (error) {
        console.error("Gagal mengambil data untuk diedit:", error);
        return;
    }
    beritaIdInput.value = data.id;
    judulInput.value = data.judul;
    isiInput.value = data.isi_berita;
    kategoriSelect.value = data.id_kategori;
    window.scrollTo(0, 0); // Gulir ke atas halaman
    judulInput.focus();
};

// FUNGSI HAPUS (DELETE)
window.hapusBerita = async function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
        const { error } = await supabase.from("berita").delete().eq("id", id);
        if (error) {
            alert("Gagal menghapus berita: " + error.message);
        } else {
            await muatBerita();
        }
    }
};


// --- 3. INISIALISASI HALAMAN ---
// Jalankan fungsi-fungsi ini saat halaman dimuat
async function initPage() {
    await muatPilihanKategori();
    await muatBerita();
}

initPage();