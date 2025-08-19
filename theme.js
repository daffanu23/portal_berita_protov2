document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const docElement = document.documentElement; // Target <html>

    // Fungsi untuk menerapkan tema dan mengubah ikon tombol
    function applyTheme(theme) {
        if (theme === 'dark') {
            docElement.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '☀️'; // Ikon matahari
        } else {
            docElement.classList.remove('dark-mode');
            themeToggleBtn.innerHTML = '🌙'; // Ikon bulan
        }
    }

    // Pasang event listener pada tombol
    themeToggleBtn.addEventListener('click', () => {
        const isDarkMode = docElement.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        
        // Simpan pilihan ke localStorage
        localStorage.setItem('theme', newTheme);
        
        // Terapkan tema baru
        applyTheme(newTheme);
    });

    // Saat halaman dimuat, set ikon tombol sesuai tema yang tersimpan
    applyTheme(localStorage.getItem('theme') || 'light');
});