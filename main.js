import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://otwpcpfrcqogtcsnfxtu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3BjcGZyY3FvZ3Rjc25meHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzYsImV4cCI6MjA3MDE4NjA3Nn0.u5C3LjsJq6lkBpM5SDhjPV9rpn4JxldFpRtfXtGaHks"
);

const beritaListContainer = document.getElementById("berita-list");

async function muatSemuaBerita() {
    beritaListContainer.innerHTML = "<p>Memuat berita...</p>";

    const { data, error } = await supabase
        .from("berita")
        .select(`
            id,
            judul,
            isi_berita,
            kategori ( nama_kategori )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gagal memuat berita:", error);
        beritaListContainer.innerHTML = "<p>Gagal memuat berita.</p>";
        return;
    }

    beritaListContainer.innerHTML = ""; // Kosongkan container
    data.forEach(berita => {
        // Potong isi berita agar tidak terlalu panjang di kartu
        const preview = berita.isi_berita.substring(0, 100) + "...";

        const card = document.createElement("div");
        card.className = "berita-card";
        card.innerHTML = `
            <h3>${berita.judul}</h3>
            <p><strong>Kategori:</strong> ${berita.kategori.nama_kategori}</p>
            <p>${preview}</p>
        `;
        // Tambahkan event listener untuk pindah ke halaman detail saat diklik
        card.addEventListener('click', () => {
            window.location.href = `detail.html?id=${berita.id}`;
        });

        beritaListContainer.appendChild(card);
    });
}

// Panggil fungsi utama saat halaman dimuat
muatSemuaBerita();