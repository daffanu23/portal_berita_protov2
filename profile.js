import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

// --- DEFINISI ELEMEN ---
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username');
const namaLengkapInput = document.getElementById('nama-lengkap');
const avatarPreview = document.getElementById('avatar-preview');
const avatarFileInput = document.getElementById('avatar-file');
const kategoriTagsContainer = document.getElementById('kategori-tags');

let currentUser = null;

// --- FUNGSI UTAMA UNTUK MEMUAT SEMUA DATA ---
async function loadProfileData() {
    // 1. Dapatkan data user yang sedang login
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        alert("Anda harus login untuk mengakses halaman ini.");
        window.location.href = "login-user.html";
        return;
    }
    currentUser = session.user;

    // 2. Ambil data dari tabel 'profiles'
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, nama_lengkap, avatar_url')
        .eq('id', currentUser.id)
        .single();
    
    // 3. Ambil SEMUA kategori yang tersedia
    const { data: semuaKategori, error: kategoriError } = await supabase.from('kategori').select('*');

    // 4. Ambil kategori FAVORIT user saat ini
    const { data: favorit, error: favoritError } = await supabase
        .from('user_kategori_favorit')
        .select('kategori_id')
        .eq('user_id', currentUser.id);

    if (profileError || kategoriError || favoritError) {
        console.error('Gagal memuat data:', { profileError, kategoriError, favoritError });
        alert('Gagal memuat data profil.');
        return;
    }

    // 5. Isi form dengan data yang sudah ada
    if (profile) {
        usernameInput.value = profile.username || '';
        namaLengkapInput.value = profile.nama_lengkap || '';
        if (profile.avatar_url) {
            avatarPreview.src = profile.avatar_url;
        }
    }

    // 6. Buat checkbox untuk setiap kategori
    kategoriTagsContainer.innerHTML = ''; // Kosongkan container
    const favoritIds = favorit.map(item => item.kategori_id); // Buat array dari ID favorit

    semuaKategori.forEach(kategori => {
        const isChecked = favoritIds.includes(kategori.id) ? 'checked' : '';
        const checkboxHtml = `
            <label>
                <input type="checkbox" name="kategori" value="${kategori.id}" ${isChecked}>
                ${kategori.nama_kategori}
            </label>
        `;
        kategoriTagsContainer.innerHTML += checkboxHtml;
    });
}

// --- FUNGSI UNTUK MENYIMPAN PERUBAHAN ---
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button');
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';

    try {
        // 1. Handle Upload Foto Profil (jika ada file baru)
        const file = avatarFileInput.files[0];
        let newAvatarUrl = null;
        if (file) {
            const filePath = `${currentUser.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            // Dapatkan URL publik dari file yang baru diunggah
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            newAvatarUrl = urlData.publicUrl;
        }

        // 2. Siapkan data untuk di-update ke tabel 'profiles'
        const profileUpdates = {
            username: usernameInput.value,
            nama_lengkap: namaLengkapInput.value,
            updated_at: new Date(),
        };
        if (newAvatarUrl) {
            profileUpdates.avatar_url = newAvatarUrl;
        }
        const { error: profileUpdateError } = await supabase.from('profiles').update(profileUpdates).eq('id', currentUser.id);
        if (profileUpdateError) throw profileUpdateError;

        // 3. Handle Update Tag Kategori (delete-then-insert)
        // Hapus semua tag lama
        const { error: deleteError } = await supabase.from('user_kategori_favorit').delete().eq('user_id', currentUser.id);
        if (deleteError) throw deleteError;

        // Tambahkan tag baru yang dipilih
        const selectedKategori = Array.from(document.querySelectorAll('input[name="kategori"]:checked')).map(cb => ({
            user_id: currentUser.id,
            kategori_id: parseInt(cb.value)
        }));

        if (selectedKategori.length > 0) {
            const { error: insertError } = await supabase.from('user_kategori_favorit').insert(selectedKategori);
            if (insertError) throw insertError;
        }
        
        alert('Profil berhasil diperbarui!');
        location.reload(); // Muat ulang halaman untuk melihat perubahan
    } catch (error) {
        console.error('Error saat menyimpan profil:', error);
        alert('Gagal menyimpan profil: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan Perubahan';
    }
});

// Panggil fungsi utama saat halaman dimuat
loadProfileData();