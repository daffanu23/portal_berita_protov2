import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Gunakan URL dan Anon Key Supabase Anda
const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- 1. OTENTIKASI & LOGOUT ---
// Cek apakah user sudah login. Jika belum, tendang kembali ke halaman login.
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    alert("Anda harus login untuk mengakses halaman ini.");
    window.location.href = "login.html";
}

// Fungsi untuk Logout
const logoutButton = document.getElementById("logout-btn");
logoutButton.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert("Gagal logout: " + error.message);
    } else {
        alert("Anda telah logout.");
        window.location.href = "login.html";
    }
});


// --- 2. LOGIKA T.E.H. KATEGORI ---
const kategoriForm = document.getElementById("kategori-form");
const kategoriNamaInput = document.getElementById("nama-kategori");
const kategoriIdInput = document.getElementById("kategori-id");
const kategoriList = document.getElementById("kategori-list");

// FUNGSI TAMPIL (READ): Muat semua kategori saat halaman dibuka
async function muatKategori() {
    kategoriList.innerHTML = "<tr><td colspan='2'>Memuat...</td></tr>"; // Tampilkan pesan loading

    const { data, error } = await supabase
        .from("kategori")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error mengambil kategori:", error);
        return;
    }

    kategoriList.innerHTML = ""; // Kosongkan list sebelum diisi data baru
    data.forEach(kategori => {
        const row = `
            <tr>
                <td>${kategori.nama_kategori}</td>
                <td>
                    <button onclick="editKategori(${kategori.id}, '${kategori.nama_kategori}')">Edit</button>
                    <button onclick="hapusKategori(${kategori.id})">Hapus</button>
                </td>
            </tr>
        `;
        kategoriList.innerHTML += row;
    });
}

// FUNGSI TAMBAH & EDIT (CREATE & UPDATE)
kategoriForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = kategoriNamaInput.value.trim();
    const id = kategoriIdInput.value;

    if (!nama) {
        alert("Nama kategori tidak boleh kosong.");
        return;
    }

    let error;
    if (id) {
        // Jika ada ID, berarti ini mode EDIT (UPDATE)
        const { error: updateError } = await supabase
            .from("kategori")
            .update({ nama_kategori: nama })
            .eq("id", id);
        error = updateError;
    } else {
        // Jika tidak ada ID, berarti ini mode TAMBAH (CREATE)
        const { error: insertError } = await supabase
            .from("kategori")
            .insert([{ nama_kategori: nama }]);
        error = insertError;
    }

    if (error) {
        alert("Gagal menyimpan data: " + error.message);
    } else {
        kategoriForm.reset(); // Bersihkan form
        kategoriIdInput.value = ''; // Pastikan ID kosong lagi
        await muatKategori(); // Muat ulang daftar kategori
    }
});

// FUNGSI HAPUS (DELETE)
window.hapusKategori = async function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
        const { error } = await supabase
            .from("kategori")
            .delete()
            .eq("id", id);
        
        if (error) {
            alert("Gagal menghapus: " + error.message);
        } else {
            await muatKategori();
        }
    }
}

// FUNGSI untuk mode Edit
window.editKategori = function(id, nama) {
    kategoriIdInput.value = id;
    kategoriNamaInput.value = nama;
    kategoriNamaInput.focus(); // Arahkan kursor ke input
}

// Panggil fungsi muatKategori() saat halaman pertama kali dimuat
muatKategori();