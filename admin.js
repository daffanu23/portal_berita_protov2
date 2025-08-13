import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- OTENTIKASI & LOGOUT (Tidak Berubah) ---
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    alert("Anda harus login untuk mengakses halaman ini.");
    window.location.href = "login.html";
}
const logoutButton = document.getElementById("logout-btn");
logoutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
});


// --- LOGIKA T.E.H. KATEGORI (Bagian yang Diperbarui) ---
const kategoriForm = document.getElementById("kategori-form");
const kategoriNamaInput = document.getElementById("nama-kategori");
const kategoriList = document.getElementById("kategori-list");

// FUNGSI TAMPIL (READ): Sedikit modifikasi untuk menambahkan ID unik pada setiap baris
async function muatKategori() {
    kategoriList.innerHTML = "<tr><td colspan='2'>Memuat...</td></tr>";

    const { data, error } = await supabase.from("kategori").select("*").order("created_at", { ascending: false });
    if (error) { console.error("Error mengambil kategori:", error); return; }

    kategoriList.innerHTML = "";
    data.forEach(kategori => {
        // PERUBAHAN: Menambahkan id unik pada <td> agar mudah ditargetkan
        const row = `
            <tr>
                <td id="nama-kategori-${kategori.id}">${kategori.nama_kategori}</td>
                <td id="aksi-kategori-${kategori.id}">
                    <button onclick="editKategori(${kategori.id}, '${kategori.nama_kategori}')">Edit</button>
                    <button onclick="hapusKategori(${kategori.id})">Hapus</button>
                </td>
            </tr>
        `;
        kategoriList.innerHTML += row;
    });
}

// FUNGSI TAMBAH (CREATE): Sekarang HANYA untuk menambah data baru
kategoriForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = kategoriNamaInput.value.trim();
    if (!nama) {
        alert("Nama kategori tidak boleh kosong.");
        return;
    }

    // PERUBAHAN: Logika 'if (id)' untuk edit sudah dihapus. Form ini HANYA untuk insert.
    const { error } = await supabase.from("kategori").insert([{ nama_kategori: nama }]);

    if (error) {
        alert("Gagal menambah data: " + error.message);
    } else {
        kategoriForm.reset();
        await muatKategori();
    }
});

// FUNGSI HAPUS (DELETE): Tidak ada perubahan
window.hapusKategori = async function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
        const { error } = await supabase.from("kategori").delete().eq("id", id);
        if (error) { alert("Gagal menghapus: " + error.message); } 
        else { await muatKategori(); }
    }
}

// --- LOGIKA BARU UNTUK INLINE EDITING ---

// FUNGSI EDIT: Mengubah baris menjadi mode edit
window.editKategori = function(id, nama) {
    const namaCell = document.getElementById(`nama-kategori-${id}`);
    const aksiCell = document.getElementById(`aksi-kategori-${id}`);

    // Ganti teks nama dengan kolom input
    namaCell.innerHTML = `<input type="text" id="input-edit-${id}" value="${nama}" style="width: 90%;">`;
    
    // Ganti tombol lama dengan tombol "Confirm" dan "Cancel"
    aksiCell.innerHTML = `
        <button onclick="simpanPerubahan(${id})">Confirm</button>
        <button onclick="batalEdit(${id}, '${nama}')">Cancel</button>
    `;
}

// FUNGSI SIMPAN PERUBAHAN: Dipanggil oleh tombol "Confirm"
window.simpanPerubahan = async function(id) {
    const inputElement = document.getElementById(`input-edit-${id}`);
    const namaBaru = inputElement.value.trim();

    if (!namaBaru) {
        alert("Nama kategori tidak boleh kosong.");
        return;
    }

    const { error } = await supabase
        .from('kategori')
        .update({ nama_kategori: namaBaru })
        .eq('id', id);

    if (error) {
        alert('Gagal menyimpan perubahan: ' + error.message);
    } else {
        // Muat ulang seluruh daftar untuk mengembalikan tampilan ke normal
        await muatKategori();
    }
}

// FUNGSI BATAL EDIT: Dipanggil oleh tombol "Cancel"
window.batalEdit = function(id, namaAsli) {
    const namaCell = document.getElementById(`nama-kategori-${id}`);
    const aksiCell = document.getElementById(`aksi-kategori-${id}`);

    // Kembalikan konten sel ke kondisi semula
    namaCell.innerHTML = namaAsli;
    aksiCell.innerHTML = `
        <button onclick="editKategori(${id}, '${namaAsli}')">Edit</button>
        <button onclick="hapusKategori(${id})">Hapus</button>
    `;
}


// Panggil fungsi muatKategori() saat halaman pertama kali dimuat
muatKategori();