export interface Subordinate {
  title: string;
  name: string;
  image?: string;
}

export interface PimpinanItem {
  id: string;
  name: string;
  title: string;
  badge: string;
  category: "waka" | "staf_pimpinan" | "kaprog";
  image: string;
  portrait: string;
  bidang: string;
  description: string;
  subordinates: Subordinate[];
}

export interface KaurItem {
  id: string;
  name: string;
  title: string;
  bidang: "Kurikulum" | "IT & SarPra" | "Hubin" | "Kesiswaan" | "Administrasi" | "Program Keahlian";
  categoryLabel: string;
  image: string;
  description: string;
}

export const dataPimpinan: PimpinanItem[] = [
  {
    id: "waka-kurikulum",
    name: "Desti Nurcahyani, S.Pd.Si.",
    title: "Waka Bid. Kurikulum",
    badge: "Wakil Kepala Bidang",
    category: "waka",
    bidang: "Kurikulum & Pembelajaran",
    image: "/images/guru/pimpinan/card-desti.png",
    portrait: "/images/guru/pimpinan/desti-nurcahyani.png",
    description: "Memimpin perancangan, pengembangan struktur kurikulum adaptif industri, serta penjaminan mutu proses belajar mengajar terstandarisasi.",
    subordinates: [
      {
        title: "Pgs. Kaur Pembelajaran & Perpustakaan",
        name: "Bayu Aji Sukma, S.Si.",
        image: "/images/guru/kaur/bayu-aji-sukma.png"
      },
      {
        title: "Pgs. Kaur Pengembangan KurSilMat",
        name: "Ragil Rudi Priyanto, S.Si.",
        image: "/images/guru/kaur/ragil-rudi.png"
      }
    ]
  },
  {
    id: "waka-it-sarpras",
    name: "Yogi Sasongko, S.Kom",
    title: "Pgs. Waka Bid. IT, Lab, dan SarPra",
    badge: "Wakil Kepala Bidang",
    category: "waka",
    bidang: "IT, Lab & Sarana Prasarana",
    image: "/images/guru/pimpinan/card-yogi.png",
    portrait: "/images/guru/pimpinan/yogi-sasongko.png",
    description: "Mengoptimalkan ekosistem smart campus, ketersediaan fasilitas laboratorium canggih, dan infrastruktur komputasi penunjang riset kejuruan.",
    subordinates: [
      {
        title: "Pgs. Kaur Laboratorium & Teknologi Informasi",
        name: "Agung Restu Saputra, S.Kom",
        image: "/images/guru/kaur/agung-restu-saputra.png"
      },
      {
        title: "Pgs. Kaur Sarana Prasarana",
        name: "Aris Rianto, S.Kom",
        image: "/images/guru/kaur/aris-rianto.png"
      }
    ]
  },
  {
    id: "waka-hubin",
    name: "Krisna Dwi Brata, S.Kom",
    title: "Pgs. Waka Bid. Hubin dan Komunikasi",
    badge: "Wakil Kepala Bidang",
    category: "waka",
    bidang: "Hubungan Industri & Komunikasi",
    image: "/images/guru/pimpinan/card-krisna.png",
    portrait: "/images/guru/pimpinan/krisna-dwi-brata.png",
    description: "Menghubungkan talenta siswa dengan ekosistem industri nasional melalui kemitraan strategis, program magang PKL, dan serapan karier alumni.",
    subordinates: [
      {
        title: "Kaur PPDB dan Komunikasi",
        name: "Afhali Luqci Sianggang, S.Kom",
        image: "/images/guru/kaur/afhali-luqci.png"
      },
      {
        title: "Pgs. Kaur Sinergi, Unit Produksi & Alumni",
        name: "Bintang Nugraha K.S., S.Kom",
        image: "/images/guru/kaur/bintang-nugraha.png"
      }
    ]
  },
  {
    id: "waka-kesiswaan",
    name: "Arif Muttakin, S.T",
    title: "Pgs. Waka Bid. Kesiswaan & Karakter",
    badge: "Wakil Kepala Bidang",
    category: "waka",
    bidang: "Kesiswaan & Karakter",
    image: "/images/guru/pimpinan/card-arif.png",
    portrait: "/images/guru/pimpinan/arif-muttakin.png",
    description: "Membina integritas, kedisiplinan berkarakter Telkom, layanan bimbingan konseling komprehensif, serta akselerasi prestasi bakat ekstrakurikuler.",
    subordinates: [
      {
        title: "Pgs. Kaur Bimbingan Konseling & Karakter",
        name: "Prasetyo Adi W., S.Pd., M.Pd",
        image: "/images/guru/kaur/prasetyo-adi.png"
      },
      {
        title: "Kaur Ekstrakurikuler & Pembinaan Prestasi",
        name: "Andang Jaka P., S.Pd",
        image: "/images/guru/kaur/andang-jaka.png"
      }
    ]
  },
  {
    id: "ka-administrasi",
    name: "Sri Mulani Widayati, S.Pd, M.Pd",
    title: "Pgs. Kepala Administrasi",
    badge: "Kepala Administrasi",
    category: "waka",
    bidang: "Tata Kelola & Administrasi",
    image: "/images/guru/pimpinan/card-sri-mulani.png",
    portrait: "/images/guru/pimpinan/sri-mulani-widayati.png",
    description: "Menyelenggarakan tata kelola manajerial, akuntabilitas keuangan, operasional logistik, dan tata kelola sumber daya manusia yang tertib dan transparan.",
    subordinates: [
      {
        title: "Kaur Keuangan / Bendahara",
        name: "Tety Wityasari, S.E",
        image: "/images/guru/kaur/tety-wityasari.png"
      },
      {
        title: "Kaur Urusan HC, Logistik & Sekretariat",
        name: "Ani Nur Wijayanti, S.Pd, M.Pd",
        image: "/images/guru/kaur/ani-nur-wijayanti.png"
      }
    ]
  },
  {
    id: "kaur-qdp",
    name: "Ferat Kristanto, S.E, S.Kom",
    title: "Kaur Quality Development & Performance Management",
    badge: "Staf Pimpinan",
    category: "staf_pimpinan",
    bidang: "Penjaminan Mutu & ISO",
    image: "/images/guru/pimpinan/card-ferat.png",
    portrait: "/images/guru/pimpinan/ferat-kristanto.png",
    description: "Mengawal standarisasi manajemen mutu ISO 21001:2018, kepatuhan prosedur operasional, dan metrik performa kinerja sekolah secara berkelanjutan.",
    subordinates: []
  },
  {
    id: "kaprog-tjkt",
    name: "Putra Utama Eka Sakti, S.T",
    title: "Pgs. Ketua Program Keahlian TJKT",
    badge: "Ketua Program Keahlian",
    category: "kaprog",
    bidang: "Teknik Jaringan Komputer & Telekomunikasi",
    image: "/images/guru/pimpinan/card-putra-utama.png",
    portrait: "/images/guru/pimpinan/putra-utama.png",
    description: "Memimpin kurikulum dan keahlian siswa bidang Computer Network, Cloud Infrastructure, Cyber Security, dan Fiber Optic Telecommunications.",
    subordinates: []
  },
  {
    id: "kaprog-pplg",
    name: "Berlian Windasari, S.Kom",
    title: "Pgs. Ketua Program Keahlian PPLG",
    badge: "Ketua Program Keahlian",
    category: "kaprog",
    bidang: "Pengembangan Perangkat Lunak & Gim",
    image: "/images/guru/pimpinan/card-berlian.png",
    portrait: "/images/guru/pimpinan/berlian-windasari.png",
    description: "Memimpin kurikulum rekayasa perangkat lunak, web/mobile development, database architecture, game engineering, dan teknologi modern.",
    subordinates: []
  }
];

export const dataKaur: KaurItem[] = [
  {
    id: "kaur-pembelajaran",
    name: "Bayu Aji Sukma, S.Si.",
    title: "Pgs. Kaur Pembelajaran & Perpustakaan",
    bidang: "Kurikulum",
    categoryLabel: "Kurikulum & Akademik",
    image: "/images/guru/kaur/bayu-aji-sukma.png",
    description: "Pengelolaan jadwal belajar, literasi perpustakaan digital, serta monitoring keaktifan kelas."
  },
  {
    id: "kaur-kursilmat",
    name: "Ragil Rudi Priyanto, S.Si.",
    title: "Pgs. Kaur Pengembangan KurSilMat",
    bidang: "Kurikulum",
    categoryLabel: "Kurikulum & Akademik",
    image: "/images/guru/kaur/ragil-rudi.png",
    description: "Penyusunan kurikulum, silabus pembelajaran, dan bahan ajar berbasis kompetensi praktikal."
  },
  {
    id: "kaur-lab-ti",
    name: "Agung Restu Saputra, S.Kom",
    title: "Pgs. Kaur Laboratorium & Teknologi Informasi",
    bidang: "IT & SarPra",
    categoryLabel: "IT & Sarpras",
    image: "/images/guru/kaur/agung-restu-saputra.png",
    description: "Pemeliharaan infrastruktur jaringan laboratorium, server sekolah, dan perangkat praktik siswa."
  },
  {
    id: "kaur-sarpras",
    name: "Aris Rianto, S.Kom",
    title: "Pgs. Kaur Sarana Prasarana",
    bidang: "IT & SarPra",
    categoryLabel: "IT & Sarpras",
    image: "/images/guru/kaur/aris-rianto.png",
    description: "Inventarisasi sarana fisik kampus, perawatan gedung, dan utilitas penunjang kenyamanan KBM."
  },
  {
    id: "kaur-ppdb-komunikasi",
    name: "Afhali Luqci Sianggang, S.Kom",
    title: "Kaur PPDB dan Komunikasi",
    bidang: "Hubin",
    categoryLabel: "Hubin & Kemitraan",
    image: "/images/guru/kaur/afhali-luqci.png",
    description: "Manajemen penerimaan peserta didik baru dan saluran komunikasi publik serta media sekolah."
  },
  {
    id: "kaur-sinergi-alumni",
    name: "Bintang Nugraha K.S., S.Kom",
    title: "Pgs. Kaur Sinergi, Unit Produksi & Alumni",
    bidang: "Hubin",
    categoryLabel: "Hubin & Kemitraan",
    image: "/images/guru/kaur/bintang-nugraha.png",
    description: "Pemberdayaan unit produksi sekolah, inkubasi bisnis kejuruan, dan pelacakan tracer study alumni."
  },
  {
    id: "kaur-bk-karakter",
    name: "Prasetyo Adi W., S.Pd., M.Pd",
    title: "Pgs. Kaur Bimbingan Konseling & Karakter",
    bidang: "Kesiswaan",
    categoryLabel: "Kesiswaan & Prestasi",
    image: "/images/guru/kaur/prasetyo-adi.png",
    description: "Pendampingan psikososial, bimbingan karier perguruan tinggi/kerja, dan pembentukan karakter akhlak mulia."
  },
  {
    id: "kaur-ekskul-prestasi",
    name: "Andang Jaka P., S.Pd",
    title: "Kaur Ekstrakurikuler & Pembinaan Prestasi",
    bidang: "Kesiswaan",
    categoryLabel: "Kesiswaan & Prestasi",
    image: "/images/guru/kaur/andang-jaka.png",
    description: "Pengembangan 20+ cabang ekstrakurikuler serta pembinaan delegasi lomba sains, IT, dan seni."
  },
  {
    id: "kaur-keuangan",
    name: "Tety Wityasari, S.E",
    title: "Kaur Keuangan / Bendahara",
    bidang: "Administrasi",
    categoryLabel: "Administrasi & Tata Usaha",
    image: "/images/guru/kaur/tety-wityasari.png",
    description: "Pengelolaan anggaran operasional sekolah, pelaporan keuangan, dan administrasi pembiayaan siswa."
  },
  {
    id: "kaur-hc-logistik",
    name: "Ani Nur Wijayanti, S.Pd, M.Pd",
    title: "Kaur Urusan HC, Logistik & Sekretariat",
    bidang: "Administrasi",
    categoryLabel: "Administrasi & Tata Usaha",
    image: "/images/guru/kaur/ani-nur-wijayanti.png",
    description: "Layanan kesekretariatan, pengadaan inventaris kebutuhan kantor, dan administrasi kepegawaian."
  }
];
