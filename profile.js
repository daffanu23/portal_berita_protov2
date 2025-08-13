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
const deleteAvatarBtn = document.getElementById('delete-avatar-btn');
const kategoriTagsContainer = document.getElementById('kategori-tags');
const submitButton = document.getElementById('submit-btn');

let currentUser = null;
let currentAvatarPath = null;
let isAvatarMarkedForDeletion = false;

// --- FUNGSI UTAMA UNTUK MEMUAT SEMUA DATA ---
async function loadProfileData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Anda harus login untuk mengakses halaman ini.");
        window.location.href = "login-user.html";
        return;
    }
    currentUser = session.user;

    const { data: profile, error: profileError } = await supabase.from('profiles').select('username, nama_lengkap, avatar_url').eq('id', currentUser.id).single();
    const { data: semuaKategori, error: kategoriError } = await supabase.from('kategori').select('*');
    const { data: favorit, error: favoritError } = await supabase.from('user_kategori_favorit').select('kategori_id').eq('user_id', currentUser.id);

    if (profileError || kategoriError || favoritError) {
        console.error('Gagal memuat data:', { profileError, kategoriError, favoritError });
        alert('Gagal memuat data profil.');
        return;
    }

    if (profile) {
        usernameInput.value = profile.username || '';
        namaLengkapInput.value = profile.nama_lengkap || '';
        if (profile.avatar_url) {
            avatarPreview.src = profile.avatar_url;
            // Simpan path file dari URL untuk keperluan delete nanti
            currentAvatarPath = profile.avatar_url.split('/avatars/')[1];
        } else {
            avatarPreview.src = 'placeholder.png'; // Pastikan Anda punya gambar placeholder
        }
    }

    kategoriTagsContainer.innerHTML = '';
    const favoritIds = favorit.map(item => item.kategori_id);
    semuaKategori.forEach(kategori => {
        const isChecked = favoritIds.includes(kategori.id) ? 'checked' : '';
        kategoriTagsContainer.innerHTML += `<label><input type="checkbox" name="kategori" value="${kategori.id}" ${isChecked}> ${kategori.nama_kategori}</label>`;
    });
}

// --- LOGIKA BARU UNTUK FITUR FOTO PROFIL ---

// 1. Fitur Preview saat file dipilih
avatarFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        avatarPreview.src = URL.createObjectURL(file);
        isAvatarMarkedForDeletion = false; // Batalkan niat hapus jika user memilih file baru
    }
});

// 2. Fitur Hapus Foto
deleteAvatarBtn.addEventListener('click', () => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return;
    
    avatarFileInput.value = ''; // Hapus file yang mungkin sudah dipilih
    avatarPreview.src = 'placeholder.png'; // Kembalikan ke gambar default
    isAvatarMarkedForDeletion = true; // Tandai untuk dihapus saat disimpan
});


// --- FUNGSI UNTUK MENYIMPAN PERUBAHAN ---
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';

    try {
        let avatarUpdateUrl = undefined; // Gunakan undefined agar tidak menimpa jika tidak ada perubahan

        // 1. Handle Hapus Foto Profil
        if (isAvatarMarkedForDeletion && currentAvatarPath) {
            const { error: deleteError } = await supabase.storage.from('avatars').remove([currentAvatarPath]);
            if (deleteError) throw deleteError;
            avatarUpdateUrl = null; // Set URL jadi null di database
            currentAvatarPath = null;
            isAvatarMarkedForDeletion = false;
        }

        // 2. Handle Upload Foto Baru (jika ada)
        const file = avatarFileInput.files[0];
        if (file) {
            const filePath = `${currentUser.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatarUpdateUrl = urlData.publicUrl;
        }

        // 3. Siapkan data untuk di-update ke tabel 'profiles'
        const profileUpdates = {
            username: usernameInput.value,
            nama_lengkap: namaLengkapInput.value,
            updated_at: new Date(),
        };
        // Hanya tambahkan avatar_url ke object update jika ada perubahan (baru atau dihapus)
        if (avatarUpdateUrl !== undefined) {
            profileUpdates.avatar_url = avatarUpdateUrl;
        }
        const { error: profileUpdateError } = await supabase.from('profiles').update(profileUpdates).eq('id', currentUser.id);
        if (profileUpdateError) throw profileUpdateError;

        // 4. Handle Update Tag Kategori (delete-then-insert)
        const { error: deleteTagsError } = await supabase.from('user_kategori_favorit').delete().eq('user_id', currentUser.id);
        if (deleteTagsError) throw deleteTagsError;
        
        const selectedKategori = Array.from(document.querySelectorAll('input[name="kategori"]:checked')).map(cb => ({
            user_id: currentUser.id,
            kategori_id: parseInt(cb.value)
        }));
        if (selectedKategori.length > 0) {
            const { error: insertTagsError } = await supabase.from('user_kategori_favorit').insert(selectedKategori);
            if (insertTagsError) throw insertTagsError;
        }
        
        alert('Profil berhasil diperbarui!');
        
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