import React, { useState, useEffect } from "react";
import { MediaPickerModal } from "./MediaPickerModal";

export interface AdminModuleManagerProps {
  moduleKey: string;
}

interface ModuleConfig {
  title: string;
  description: string;
  apiPath: string;
  dataKey?: string; // key in response, default: "data"
  idField: string;
  columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode }[];
  fields: {
    key: string;
    label: string;
    type: "text" | "number" | "textarea" | "select" | "checkbox" | "image" | "tags";
    options?: { label: string; value: string }[];
    required?: boolean;
    placeholder?: string;
  }[];
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  berita: {
    title: "Kelola Berita & Agenda",
    description: "Kelola publikasi artikel berita, pengumuman, dan agenda sekolah.",
    apiPath: "/api/admin/news",
    idField: "id",
    columns: [
      {
        key: "imageUrl",
        label: "Foto",
        render: (val) =>
          val ? (
            <img src={val} alt="Thumb" className="w-12 h-10 object-cover rounded-md border border-neutral-200" />
          ) : (
            <span className="text-xs text-neutral-400">Tidak ada</span>
          ),
      },
      { key: "title", label: "Judul Berita" },
      {
        key: "category",
        label: "Kategori",
        render: (val) => (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-700">
            {val}
          </span>
        ),
      },
      { key: "date", label: "Tanggal" },
      {
        key: "isPublished",
        label: "Status",
        render: (val) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              val ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {val ? "Terbit" : "Draf"}
          </span>
        ),
      },
    ],
    fields: [
      { key: "title", label: "Judul Berita", type: "text", required: true, placeholder: "Masukkan judul artikel" },
      { key: "slug", label: "Slug URL", type: "text", placeholder: "Opsional (otomatis dari judul)" },
      {
        key: "category",
        label: "Kategori",
        type: "select",
        required: true,
        options: [
          { label: "PRESTASI", value: "PRESTASI" },
          { label: "KERJASAMA INDUSTRI", value: "KERJASAMA INDUSTRI" },
          { label: "KEGIATAN SEKOLAH", value: "KEGIATAN SEKOLAH" },
          { label: "TEKNOLOGI", value: "TEKNOLOGI" },
          { label: "PENGUMUMAN", value: "PENGUMUMAN" },
          { label: "KUNJUNGAN INDUSTRI", value: "KUNJUNGAN INDUSTRI" },
          { label: "UMUM", value: "UMUM" },
        ],
      },
      { key: "date", label: "Tanggal Terbit", type: "text", placeholder: "Contoh: 18 Februari 2026" },
      { key: "imageUrl", label: "Foto Utama", type: "image", placeholder: "/images/berita/..." },
      { key: "excerpt", label: "Ringkasan Singkat (Excerpt)", type: "textarea", placeholder: "Ringkasan 1-2 kalimat" },
      { key: "content", label: "Konten Lengkap", type: "textarea", placeholder: "Teks isi berita lengkap" },
      { key: "isFeatured", label: "Jadikan Berita Utama (Featured)", type: "checkbox" },
      { key: "isPublished", label: "Publikasikan Sekarang", type: "checkbox" },
      { key: "order", label: "Urutan Tampil", type: "number" },
    ],
  },
  jurusan: {
    title: "Kelola Program Keahlian",
    description: "Kelola profil 4 program keahlian unggulan SMK Telkom Purwokerto.",
    apiPath: "/api/admin/majors",
    idField: "id",
    columns: [
      {
        key: "code",
        label: "Kode",
        render: (val) => <span className="font-bold text-[#E31E24]">{val}</span>,
      },
      { key: "name", label: "Nama Program Keahlian" },
      { key: "headlineTitle", label: "Headline" },
      {
        key: "imageUrl",
        label: "Foto Banner",
        render: (val) =>
          val ? (
            <img src={val} alt="Thumb" className="w-12 h-10 object-cover rounded-md border border-neutral-200" />
          ) : (
            <span className="text-xs text-neutral-400">-</span>
          ),
      },
    ],
    fields: [
      { key: "code", label: "Kode Jurusan", type: "text", required: true, placeholder: "Contoh: RPL, PG, TKJ, TJA" },
      { key: "name", label: "Nama Lengkap Jurusan", type: "text", required: true, placeholder: "Contoh: Rekayasa Perangkat Lunak" },
      { key: "headlineTitle", label: "Headline Judul", type: "text", placeholder: "Contoh: Rekayasa Perangkat Lunak" },
      { key: "tagline", label: "Tagline", type: "text", placeholder: "Keunggulan Jurusan" },
      { key: "imageUrl", label: "Foto Hero / Ilustrasi", type: "image" },
      { key: "description", label: "Deskripsi Keahlian", type: "textarea", required: true },
      { key: "cardTags", label: "Tag Keahlian (Pisahkan dengan koma)", type: "tags", placeholder: "Web Dev, Mobile Dev, UI/UX" },
      { key: "careerProspects", label: "Prospek Karir", type: "textarea", placeholder: "Daftar prospek karir lulusan" },
      { key: "order", label: "Urutan Tampil", type: "number" },
    ],
  },
  guru: {
    title: "Kelola Dewan Guru & Pimpinan",
    description: "Kelola struktur pucuk pimpinan, dewan pertimbangan, dan jajaran dewan guru.",
    apiPath: "/api/admin/teachers",
    idField: "id",
    columns: [
      {
        key: "imageUrl",
        label: "Foto",
        render: (val) =>
          val ? (
            <img src={val} alt="Foto" className="w-10 h-10 object-cover rounded-full border border-neutral-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-xs text-neutral-500 font-bold">
              Foto
            </div>
          ),
      },
      { key: "name", label: "Nama & Gelar" },
      { key: "position", label: "Jabatan" },
      { key: "sectionTitle", label: "Seksi / Bidang" },
    ],
    fields: [
      { key: "name", label: "Nama Lengkap & Gelar", type: "text", required: true, placeholder: "Contoh: Aris Puji Santoso, S.Kom., M.M." },
      { key: "position", label: "Jabatan", type: "text", required: true, placeholder: "Contoh: Kepala Sekolah" },
      {
        key: "sectionId",
        label: "Bagian / Divisi",
        type: "select",
        required: true,
        options: [
          { label: "Pucuk Pimpinan & Dewan Pertimbangan", value: "pucuk-pimpinan" },
          { label: "Bidang Kurikulum & Pembelajaran", value: "kurikulum" },
          { label: "Bidang IT, Lab & Sarana Prasarana", value: "it-sarpras" },
          { label: "Bidang Hubungan Industri & Komunikasi", value: "hubin" },
          { label: "Bidang Kesiswaan & Bimbingan Konseling", value: "kesiswaan" },
        ],
      },
      { key: "sectionBadge", label: "Badge Seksi", type: "text", placeholder: "Contoh: 01. Dewan Pimpinan" },
      { key: "sectionTitle", label: "Judul Seksi", type: "text", placeholder: "Contoh: Pucuk Pimpinan & Dewan Pertimbangan" },
      { key: "imageUrl", label: "Foto Profil", type: "image" },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
  fasilitas: {
    title: "Kelola Fasilitas & Laboratorium",
    description: "Kelola laboratorium berstandar industri dan fasilitas sekolah.",
    apiPath: "/api/admin/facilities",
    idField: "id",
    columns: [
      {
        key: "imageUrl",
        label: "Foto 3D",
        render: (val) =>
          val ? (
            <img src={val} alt="Fasilitas" className="w-12 h-10 object-cover rounded-md border border-neutral-200" />
          ) : (
            <span className="text-xs text-neutral-400">-</span>
          ),
      },
      { key: "name", label: "Nama Fasilitas" },
      { key: "badge", label: "Badge" },
      {
        key: "isPanorama",
        label: "3D Panorama",
        render: (val) => (
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              val ? "bg-indigo-100 text-indigo-700" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {val ? "360° Aktif" : "Standar"}
          </span>
        ),
      },
    ],
    fields: [
      { key: "name", label: "Nama Fasilitas / Lab", type: "text", required: true, placeholder: "Contoh: Ruangan PG" },
      { key: "badge", label: "Badge Singkat", type: "text", placeholder: "Contoh: Ruang PG" },
      { key: "description", label: "Deskripsi Fasilitas", type: "textarea", required: true },
      { key: "imageUrl", label: "Foto Fasilitas (Mendukung Panorama 3D)", type: "image" },
      { key: "isPanorama", label: "Aktifkan Tampilan Panorama 360°", type: "checkbox" },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
  prestasi: {
    title: "Kelola Prestasi Siswa",
    description: "Kelola daftar penghargaan dan kejuaraan siswa tingkat nasional/internasional.",
    apiPath: "/api/admin/achievements",
    idField: "id",
    columns: [
      { key: "title", label: "Judul Prestasi" },
      {
        key: "category",
        label: "Kategori",
        render: (val) => (
          <span className="capitalize px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-700">
            {val}
          </span>
        ),
      },
      {
        key: "badge",
        label: "Juara / Predikat",
        render: (val) =>
          val ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {val}
            </span>
          ) : (
            <span className="text-xs text-neutral-400">-</span>
          ),
      },
      { key: "year", label: "Tahun" },
    ],
    fields: [
      { key: "title", label: "Nama Kompetisi / Prestasi", type: "text", required: true },
      {
        key: "category",
        label: "Kategori Bidang",
        type: "select",
        required: true,
        options: [
          { label: "Akademik (Teknologi & Vokasi)", value: "akademik" },
          { label: "Non-Akademik (Seni, Olahraga, Karakter)", value: "non-akademik" },
        ],
      },
      { key: "badge", label: "Predikat Juara", type: "text", placeholder: "Contoh: Juara 1 Nasional" },
      { key: "meta", label: "Metadata Singkat", type: "text", placeholder: "Contoh: 2024 • Global Innovation" },
      { key: "year", label: "Tahun Perolehan", type: "text", placeholder: "Contoh: 2026" },
      { key: "description", label: "Keterangan Lengkap", type: "textarea" },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
  ekstrakurikuler: {
    title: "Kelola Ekstrakurikuler",
    description: "Kelola organisasi dan kegiatan ekstrakurikuler minat bakat siswa.",
    apiPath: "/api/admin/extracurriculars",
    idField: "id",
    columns: [
      {
        key: "imageUrl",
        label: "Foto",
        render: (val) =>
          val ? (
            <img src={val} alt="Ekskul" className="w-12 h-10 object-cover rounded-md border border-neutral-200" />
          ) : (
            <span className="text-xs text-neutral-400">-</span>
          ),
      },
      { key: "name", label: "Nama Ekstrakurikuler" },
      { key: "description", label: "Deskripsi Kegiatan" },
    ],
    fields: [
      { key: "name", label: "Nama Ekstrakurikuler", type: "text", required: true, placeholder: "Contoh: Futsal" },
      { key: "description", label: "Deskripsi Kegiatan", type: "textarea", required: true },
      { key: "imageUrl", label: "Foto Kegiatan", type: "image" },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
  mitra: {
    title: "Kelola Mitra Industri",
    description: "Kelola mitra kerjasama BUMN, startup, dan industri teknologi.",
    apiPath: "/api/admin/partners",
    idField: "id",
    columns: [
      {
        key: "logoUrl",
        label: "Logo",
        render: (val, row) =>
          val ? (
            <div className="w-20 h-10 flex items-center justify-center bg-white border border-neutral-200 rounded p-1">
              <img
                src={val}
                alt={row.name}
                className="max-h-8 max-w-full object-contain"
                style={{ transform: `scale(${row.scale || 1})` }}
              />
            </div>
          ) : (
            <span className="text-xs text-neutral-400">-</span>
          ),
      },
      { key: "name", label: "Nama Mitra Perusahaan" },
      { key: "category", label: "Kategori" },
      { key: "scale", label: "Skala Tampil (0.8 - 2.0)" },
    ],
    fields: [
      { key: "name", label: "Nama Perusahaan / Institusi", type: "text", required: true, placeholder: "Contoh: Telkom Indonesia" },
      { key: "logoUrl", label: "Logo Perusahaan", type: "image", required: true },
      { key: "category", label: "Kategori Mitra", type: "text", placeholder: "Contoh: Mitra Industri" },
      { key: "scale", label: "Skala Ukuran Logo (Default 1.0)", type: "number", placeholder: "1.0" },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
  pkl: {
    title: "Kelola Lowongan PKL",
    description: "Kelola daftar tempat dan kuota Praktik Kerja Lapangan bagi siswa.",
    apiPath: "/api/admin/pkl",
    idField: "id",
    columns: [
      { key: "company", label: "Perusahaan" },
      { key: "title", label: "Posisi / Peran" },
      { key: "major", label: "Jurusan" },
      { key: "workMode", label: "Sistem Kerja" },
      {
        key: "isOpen",
        label: "Status Kuota",
        render: (val) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              val ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {val ? "Terbuka" : "Ditutup"}
          </span>
        ),
      },
    ],
    fields: [
      { key: "company", label: "Nama Perusahaan", type: "text", required: true },
      { key: "title", label: "Judul Lowongan / Posisi", type: "text", required: true },
      {
        key: "major",
        label: "Sasaran Jurusan",
        type: "select",
        required: true,
        options: [
          { label: "Semua Jurusan", value: "Semua Jurusan" },
          { label: "Rekayasa Perangkat Lunak (RPL)", value: "RPL" },
          { label: "Pengembangan Gim (PG)", value: "PG" },
          { label: "Teknik Komputer & Jaringan (TKJ)", value: "TKJ" },
          { label: "Teknik Jaringan Akses (TJA)", value: "TJA" },
        ],
      },
      { key: "location", label: "Lokasi Kantor / Kota", type: "text", required: true },
      {
        key: "workMode",
        label: "Mode Kerja",
        type: "select",
        required: true,
        options: [
          { label: "On-site (Di Kantor)", value: "On-site" },
          { label: "Hybrid (Fleksibel)", value: "Hybrid" },
          { label: "Remote (Jarak Jauh)", value: "Remote" },
        ],
      },
      { key: "initials", label: "Inisial Logo (Singkatan)", type: "text", placeholder: "Contoh: TI" },
      { key: "logoBg", label: "Warna Background Inisial", type: "text", placeholder: "Contoh: bg-[#E4002B]" },
      { key: "tags", label: "Keahlian Dibutuhkan (Pisahkan koma)", type: "tags", placeholder: "React, Node.js, Git" },
      { key: "description", label: "Deskripsi Pekerjaan & Tugas", type: "textarea", required: true },
      { key: "isOpen", label: "Lowongan Terbuka", type: "checkbox" },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
  alumni: {
    title: "Kelola Cerita Sukses Alumni",
    description: "Kelola testimoni dan jejak sukses alumni di dunia industri & pendidikan tinggi.",
    apiPath: "/api/admin/alumni",
    idField: "id",
    columns: [
      {
        key: "imageUrl",
        label: "Foto",
        render: (val) =>
          val ? (
            <img src={val} alt="Alumni" className="w-10 h-10 object-cover rounded-full border border-neutral-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">
              Foto
            </div>
          ),
      },
      { key: "name", label: "Nama Alumni" },
      { key: "role", label: "Profesi & Angkatan" },
      {
        key: "quote",
        label: "Kutipan",
        render: (val) => <span className="line-clamp-1 max-w-xs">{val}</span>,
      },
    ],
    fields: [
      { key: "name", label: "Nama Lengkap Alumni", type: "text", required: true },
      { key: "role", label: "Profesi & Status Saat Ini", type: "text", required: true, placeholder: "Contoh: Software Engineer di Google | Lulusan 2020" },
      { key: "graduationYear", label: "Tahun Lulus", type: "text", placeholder: "Contoh: 2020" },
      { key: "imageUrl", label: "Foto Profil Alumni", type: "image" },
      { key: "quote", label: "Kutipan Inspiratif", type: "textarea", required: true },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
  faq: {
    title: "Kelola Pertanyaan Umum (FAQ)",
    description: "Kelola tanya jawab seputar PPDB, kurikulum, dan fasilitas sekolah.",
    apiPath: "/api/admin/faqs",
    idField: "id",
    columns: [
      { key: "question", label: "Pertanyaan" },
      { key: "category", label: "Kategori" },
      {
        key: "answer",
        label: "Jawaban",
        render: (val) => <span className="line-clamp-1 max-w-sm">{val}</span>,
      },
    ],
    fields: [
      { key: "question", label: "Pertanyaan", type: "text", required: true },
      { key: "category", label: "Kategori Pertanyaan", type: "text", placeholder: "Contoh: Umum, PPDB, Asrama" },
      { key: "answer", label: "Jawaban Lengkap", type: "textarea", required: true },
      { key: "order", label: "Urutan", type: "number" },
    ],
  },
};

export const AdminModuleManager: React.FC<AdminModuleManagerProps> = ({ moduleKey }) => {
  const isSpecialModule = moduleKey === "pengaturan" || moduleKey === "ai-sync";
  const config = MODULE_CONFIGS[moduleKey];

  // Common CRUD states
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Form states (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Media Picker state
  const [mediaPickerOpen, setMediaPickerOpen] = useState<boolean>(false);
  const [activeImageField, setActiveImageField] = useState<string | null>(null);

  // Toast / Alert Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Settings module state
  const [settingsData, setSettingsData] = useState<Record<string, string>>({
    school_name: "SMK Telkom Purwokerto",
    school_tagline: "The Real Digital School",
    school_phone: "+62 812-2970-1800",
    school_email: "info@smktelkom-pwt.sch.id",
    school_address: "Jl. D.I. Panjaitan No.128, Karangreja, Purwokerto Kidul, Kec. Purwokerto Sel., Kabupaten Banyumas, Jawa Tengah 53147",
    sambutan_kepala: "Aris Puji Santoso, S.Kom., M.M",
    sambutan_jabatan: "Kepala SMK Telkom Purwokerto",
    sambutan_p1: "Selamat datang di portal resmi SMK Telkom Purwokerto. Kami percaya pendidikan vokasi yang baik lahir dari kedekatan dengan dunia industri, sehingga setiap program keahlian dirancang bersama mitra kerja dan diuji langsung melalui praktik nyata.",
    sambutan_p2: "Melalui portal ini, seluruh layanan sekolah kami satukan agar siswa, orang tua, dan mitra industri mendapatkan informasi yang sama dan selalu terbarui.",
    stats_siswa: "910+",
    stats_mitra: "182+",
    stats_prestasi: "150",
    stats_jurusan: "4",
    ppdb_link: "https://ppdb.smktelkom-pwt.sch.id",
  });
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);

  // AI Sync module state
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [aiSyncing, setAiSyncing] = useState<boolean>(false);
  const [aiSyncLog, setAiSyncLog] = useState<string[]>([]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (moduleKey === "pengaturan") {
      loadSettings();
    } else if (moduleKey === "ai-sync") {
      loadAiStatus();
    } else if (config) {
      loadModuleData();
    }
  }, [moduleKey]);

  // 1. Fetch Module Data (CRUD)
  const loadModuleData = async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(config.apiPath);
      if (!res.ok) {
        throw new Error(`Gagal memuat data ${config.title} (HTTP ${res.status})`);
      }
      const json = await res.json();
      const list = json.data || json.items || (Array.isArray(json) ? json : []);
      setDataList(list);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data modul.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const json = await res.json();
        if (json.data && typeof json.data === "object") {
          setSettingsData((prev) => ({ ...prev, ...json.data }));
        }
      }
    } catch (err) {
      console.warn("Gagal memuat pengaturan:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });
      if (!res.ok) {
        throw new Error(`Gagal menyimpan pengaturan (HTTP ${res.status})`);
      }
      showToast("Pengaturan sistem berhasil diperbarui!");
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan pengaturan", "error");
    } finally {
      setSettingsSaving(false);
    }
  };

  // 4. Fetch AI Status
  const loadAiStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai/status");
      if (res.ok) {
        const json = await res.json();
        setAiStatus(json);
      }
    } catch (err) {
      console.warn("Gagal memuat status AI:", err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Trigger AI Sync
  const handleTriggerAiSync = async () => {
    setAiSyncing(true);
    setAiSyncLog(["[1/4] Menginisialisasi sinkronisasi AI...", "[2/4] Mengekstrak data berita, jurusan, fasilitas, dan FAQ..."]);
    try {
      const res = await fetch("/api/admin/ai/sync", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Sinkronisasi gagal (HTTP ${res.status})`);
      }
      const data = await res.json();
      setAiSyncLog((prev) => [
        ...prev,
        "[3/4] Menghasilkan representasi embedding vektor...",
        `[4/4] Selesai! ${data.message || "Seluruh modul berhasil disinkronkan ke AI knowledge base."}`,
      ]);
      showToast("Sinkronisasi AI berhasil diselesaikan!");
      loadAiStatus();
    } catch (err: any) {
      setAiSyncLog((prev) => [...prev, `[Gagal] ${err.message}`]);
      showToast(err.message || "Gagal sinkronisasi AI", "error");
    } finally {
      setAiSyncing(false);
    }
  };

  // Open Form Modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    const initialForm: Record<string, any> = {};
    config?.fields.forEach((f) => {
      if (f.type === "checkbox") initialForm[f.key] = f.key === "isPublished" || f.key === "isOpen";
      else if (f.type === "number") initialForm[f.key] = f.key === "scale" ? 1.0 : 0;
      else if (f.type === "select" && f.options?.[0]) initialForm[f.key] = f.options[0].value;
      else if (f.type === "tags") initialForm[f.key] = [];
      else initialForm[f.key] = "";
    });
    setFormData(initialForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    const populatedForm: Record<string, any> = { ...item };
    // Normalisasi array untuk field tags
    config?.fields.forEach((f) => {
      if (f.type === "tags" && Array.isArray(populatedForm[f.key])) {
        populatedForm[f.key] = populatedForm[f.key].join(", ");
      }
    });
    setFormData(populatedForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setFormSubmitting(true);
    setFormError(null);

    // Prepare payload
    const payload: Record<string, any> = { ...formData };
    config.fields.forEach((f) => {
      if (f.type === "tags") {
        if (typeof payload[f.key] === "string") {
          payload[f.key] = payload[f.key]
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean);
        }
      } else if (f.type === "number") {
        payload[f.key] = Number(payload[f.key]) || 0;
      }
    });

    const isEdit = Boolean(editingItem);
    const url = isEdit ? `${config.apiPath}/${editingItem[config.idField]}` : config.apiPath;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Aksi gagal dengan kode status HTTP ${res.status}`);
      }

      showToast(isEdit ? "Data berhasil diperbarui!" : "Data baru berhasil ditambahkan!");
      setIsModalOpen(false);
      loadModuleData();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Item
  const handleDelete = async (item: any) => {
    if (!config) return;
    const confirmName = item.title || item.name || item.company || item.question || "data ini";
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${confirmName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`${config.apiPath}/${item[config.idField]}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Gagal menghapus data (HTTP ${res.status})`);
      }
      showToast("Data berhasil dihapus!");
      loadModuleData();
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus data", "error");
    }
  };

  // Media Picker callback
  const handleSelectImage = (url: string) => {
    if (activeImageField) {
      setFormData((prev) => ({ ...prev, [activeImageField]: url }));
    }
  };

  // Filtered List
  const filteredList = dataList.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(item).some(
      (val) => typeof val === "string" && val.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all animate-bounce ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-red-50 text-red-800 border-red-300"
          }`}
        >
          <span className="font-semibold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* RENDER MODUL KHUSUS: PENGATURAN */}
      {moduleKey === "pengaturan" && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Pengaturan Identitas & Sambutan Website</h2>
              <p className="text-xs text-neutral-500">Sesuaikan profil sekolah, sambutan kepala sekolah, statistik, dan kontak resmi</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
            {/* Bagian 1: Identitas Sekolah */}
            <div>
              <h3 className="text-sm font-bold text-[#E31E24] uppercase tracking-wider mb-4 border-b pb-2">
                1. Profil & Identitas Sekolah
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    value={settingsData.school_name || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, school_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Tagline Sekolah</label>
                  <input
                    type="text"
                    value={settingsData.school_tagline || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, school_tagline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={settingsData.school_phone || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, school_phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={settingsData.school_email || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, school_email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    value={settingsData.school_address || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, school_address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Sambutan Kepala Sekolah */}
            <div>
              <h3 className="text-sm font-bold text-[#E31E24] uppercase tracking-wider mb-4 border-b pb-2">
                2. Sambutan Kepala Sekolah
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    value={settingsData.sambutan_kepala || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, sambutan_kepala: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Jabatan Resmi</label>
                  <input
                    type="text"
                    value={settingsData.sambutan_jabatan || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, sambutan_jabatan: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Sambutan Paragraf 1</label>
                  <textarea
                    rows={3}
                    value={settingsData.sambutan_p1 || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, sambutan_p1: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Sambutan Paragraf 2</label>
                  <textarea
                    rows={3}
                    value={settingsData.sambutan_p2 || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, sambutan_p2: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Angka Metrik & Portal PPDB */}
            <div>
              <h3 className="text-sm font-bold text-[#E31E24] uppercase tracking-wider mb-4 border-b pb-2">
                3. Tampilan Statistik Landing Page & PPDB
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Siswa Aktif</label>
                  <input
                    type="text"
                    value={settingsData.stats_siswa || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, stats_siswa: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Program Keahlian</label>
                  <input
                    type="text"
                    value={settingsData.stats_jurusan || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, stats_jurusan: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Mitra Industri</label>
                  <input
                    type="text"
                    value={settingsData.stats_mitra || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, stats_mitra: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Prestasi (5 Thn)</label>
                  <input
                    type="text"
                    value={settingsData.stats_prestasi || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, stats_prestasi: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Link Portal PPDB Online</label>
                  <input
                    type="url"
                    value={settingsData.ppdb_link || ""}
                    onChange={(e) => setSettingsData({ ...settingsData, ppdb_link: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-200">
              <button
                type="submit"
                disabled={settingsSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E31E24] hover:bg-[#c9181e] text-white text-sm font-bold shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {settingsSaving ? "Menyimpan Pengaturan..." : "Simpan Perubahan Pengaturan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENDER MODUL KHUSUS: SINKRONISASI AI */}
      {moduleKey === "ai-sync" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#E31E24] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#E31E24] animate-ping"></span>
                <span>Asisten AI & Knowledge Base RAG</span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900">Sinkronisasi Konten ke Otak AI Chatbot</h2>
              <p className="text-sm text-neutral-600 max-w-2xl">
                Fitur ini memperbarui indeks vektor embedding pengetahuan AI agar asisten virtual dapat menjawab pertanyaan pengunjung seputar berita terbaru, jurusan, biaya, fasilitas, dan kontak sekolah secara akurat.
              </p>
            </div>

            <button
              onClick={handleTriggerAiSync}
              disabled={aiSyncing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E31E24] hover:bg-[#c9181e] text-white text-sm font-bold shadow-md shadow-red-500/20 transition-all shrink-0 disabled:opacity-50"
            >
              {aiSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sedang Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Mulai Sinkronisasi AI</span>
                </>
              )}
            </button>
          </div>

          {/* AI Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Dokumen Pengetahuan</p>
              <p className="text-2xl font-extrabold text-neutral-900 mt-1">
                {aiStatus?.totalDocuments || aiStatus?.documentsCount || 12} Dokumen
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Chunks Vektor</p>
              <p className="text-2xl font-extrabold text-[#E31E24] mt-1">
                {aiStatus?.totalChunks || aiStatus?.chunksCount || 124} Potongan
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status Provider AI</p>
              <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Aktif & Siap Melayani</span>
              </p>
            </div>
          </div>

          {/* Log Aktivitas Sinkronisasi */}
          {aiSyncLog.length > 0 && (
            <div className="bg-neutral-900 text-neutral-100 p-5 rounded-2xl font-mono text-xs space-y-1.5 shadow-inner">
              <p className="text-neutral-400 font-bold mb-2"># Log Aktivitas Sinkronisasi Vektor AI:</p>
              {aiSyncLog.map((log, idx) => (
                <p key={idx} className={log.includes("Selesai") ? "text-emerald-400 font-bold" : "text-neutral-300"}>
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER MODUL CRUD STANDAR */}
      {!isSpecialModule && config && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Header Modul */}
          <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{config.title}</h2>
              <p className="text-xs text-neutral-500">{config.description}</p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#E31E24] hover:bg-[#c9181e] text-white text-sm font-bold shadow-md shadow-red-500/20 transition-all shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Baru</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-neutral-200 bg-white flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Cari data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
              />
              <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={loadModuleData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-neutral-500">
                <div className="inline-block w-8 h-8 border-4 border-neutral-300 border-t-[#E31E24] rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium">Memuat data dari database...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-neutral-600">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 max-w-lg mx-auto">
                  {error}
                </div>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-20 text-center text-neutral-400">
                <p className="text-sm font-medium text-neutral-600">Belum ada data untuk modul ini.</p>
                <p className="text-xs text-neutral-400 mt-1">Klik tombol "Tambah Baru" di atas untuk menambahkan data pertama.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    {config.columns.map((col) => (
                      <th key={col.key} className="py-3 px-4">
                        {col.label}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredList.map((item, idx) => (
                    <tr key={item[config.idField] || idx} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-neutral-400">{idx + 1}</td>
                      {config.columns.map((col) => (
                        <td key={col.key} className="py-3 px-4 text-neutral-800">
                          {col.render ? col.render(item[col.key], item) : String(item[col.key] ?? "-")}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT DATA */}
      {isModalOpen && config && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingItem ? `Edit ${config.title}` : `Tambah ${config.title}`}
                </h3>
                <p className="text-xs text-neutral-500">Lengkapi formulir di bawah ini</p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              {config.fields.map((f) => {
                if (f.type === "checkbox") {
                  return (
                    <label key={f.key} className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[f.key])}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-[#E31E24] focus:ring-[#E31E24]"
                      />
                      <span className="text-sm font-semibold text-neutral-800">{f.label}</span>
                    </label>
                  );
                }

                if (f.type === "textarea") {
                  return (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        rows={3}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={formData[f.key] ?? ""}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                      />
                    </div>
                  );
                }

                if (f.type === "select") {
                  return (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        required={f.required}
                        value={formData[f.key] ?? ""}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30 bg-white"
                      >
                        {f.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (f.type === "image") {
                  return (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required={f.required}
                          placeholder="/images/..."
                          value={formData[f.key] ?? ""}
                          onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImageField(f.key);
                            setMediaPickerOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border rounded-lg transition-colors shrink-0"
                        >
                          <svg className="w-4 h-4 text-[#E31E24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Pilih Foto</span>
                        </button>
                      </div>
                      {formData[f.key] && (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={formData[f.key]}
                            alt="Preview"
                            className="w-14 h-12 object-cover rounded border"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                          <span className="text-xs text-neutral-500 truncate max-w-xs">{formData[f.key]}</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // Default text, number, tags
                return (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      step={f.key === "scale" ? "0.05" : "1"}
                      required={f.required}
                      placeholder={f.placeholder}
                      value={formData[f.key] ?? ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E31E24]/30"
                    />
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 rounded-xl bg-[#E31E24] hover:bg-[#c9181e] text-white text-sm font-bold shadow-md shadow-red-500/20 disabled:opacity-50"
                >
                  {formSubmitting ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Tambahkan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleSelectImage}
      />
    </div>
  );
};
