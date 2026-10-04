import type { CvData } from './types';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

export const SAMPLE_CV_DATA: CvData = {
  version: 1,
  meta: {
    language: 'id',
    template: 'modern',
    accent: '#ED1E28', // Merah Telkom
    font: 'sans',
    sectionOrder: ['education', 'projects', 'experience', 'skills', 'custom'],
    hiddenSections: [],
  },
  personal: {
    fullName: 'Cresendo Assyabani Darmawan',
    headline: 'Junior Web Developer & UI Enthusiast',
    phone: '0812-2970-1800',
    email: 'cresendo.darmawan@smktelkom-pwt.sch.id',
    address: 'Purwokerto, Jawa Tengah',
    summary: 'Siswa SMK Telkom Purwokerto jurusan RPL dengan ketertarikan tinggi pada frontend web modern dan API integration. Terbiasa membangun antarmuka responsif menggunakan React dan Tailwind CSS.',
    links: [
      { id: 'link-1', label: 'GitHub', url: 'https://github.com/cresendodarmawan' },
      { id: 'link-2', label: 'LinkedIn', url: 'https://linkedin.com/in/cresendo-assyabani' },
      { id: 'link-3', label: 'Portofolio', url: 'https://cresendo-dev.vercel.app' },
    ],
  },
  education: [
    {
      id: 'edu-1',
      school: 'SMK Telkom Purwokerto',
      major: 'Rekayasa Perangkat Lunak (RPL)',
      startMonth: '07',
      startYear: '2023',
      endMonth: '06',
      endYear: '2026',
      current: true,
      gpa: '89.4 / 100',
      description: 'Fokus pada pemrograman web modern, basis data relasional, dan arsitektur RESTful API.',
    },
    {
      id: 'edu-2',
      school: 'SMP Negeri 1 Purwokerto',
      major: '',
      startMonth: '07',
      startYear: '2020',
      endMonth: '06',
      endYear: '2023',
      current: false,
      gpa: '',
      description: 'Aktif dalam ekstrakurikuler sains terapan dan olimpiade informatika tingkat kabupaten.',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      role: 'Ketua Divisi Coding & Web',
      organization: 'Komunitas Pengembang Telkom (TelDev)',
      startMonth: '08',
      startYear: '2024',
      endMonth: '',
      endYear: '',
      current: true,
      bullets: [
        'Memimpin 6 anggota membangun sistem presensi QR-Code yang dipakai 12 kelas.',
        'Mengadakan workshop bulanan React dasar untuk 40+ siswa baru jurusan RPL.',
        'Mengelola alur version control GitHub tim untuk meminimalisasi konflik kode.',
      ],
    },
    {
      id: 'exp-2',
      role: 'Anggota Divisi IT Support',
      organization: 'OSIS SMK Telkom Purwokerto',
      startMonth: '10',
      startYear: '2023',
      endMonth: '09',
      endYear: '2024',
      current: false,
      bullets: [
        'Mengonfigurasi jaringan Wi-Fi dan sound system untuk 8 agenda acara sekolah tahunan.',
        'Membantu pemeliharaan inventaris laboratorium komputer sebanyak 45 unit PC.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'SiPresensi - Sistem Presensi Siswa Real-time',
      techStack: ['React', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
      url: 'https://github.com/cresendodarmawan/sipresensi-telkom',
      bullets: [
        'Membangun modul pemindai barcode kamera yang mengurangi waktu antre presensi dari 15 menit menjadi 3 menit.',
        'Merancang dashboard statistik kehadiran kelas dengan visualisasi grafik interaktif.',
      ],
    },
    {
      id: 'proj-2',
      name: 'Katalog Portofolio Siswa RPL',
      techStack: ['Astro', 'TypeScript', 'Tailwind CSS'],
      url: 'https://github.com/cresendodarmawan/rpl-showcase',
      bullets: [
        'Mengembangkan web showcase portofolio yang memuat 30 karya proyek akhir siswa.',
        'Mencapai skor Lighthouse 98/100 pada performa dan aksesibilitas ramah ponsel.',
      ],
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Bahasa Pemrograman & Frontend',
      items: ['JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'React', 'Tailwind CSS'],
    },
    {
      id: 'skill-2',
      category: 'Backend & Basis Data',
      items: ['Node.js', 'Express.js', 'PostgreSQL', 'Prisma ORM', 'REST APIs'],
    },
    {
      id: 'skill-3',
      category: 'Tools & Version Control',
      items: ['Git', 'GitHub', 'VS Code', 'Postman', 'Figma'],
    },
  ],
  custom: [
    {
      id: 'custom-1',
      title: 'Sertifikasi & Pelatihan',
      entries: [
        {
          id: 'cert-1',
          title: 'Junior Web Developer (JWD)',
          subtitle: 'Badan Nasional Sertifikasi Profesi (BNSP) & Kominfo',
          year: '2024',
          bullets: ['Lulus uji kompetensi pembuatan aplikasi web dinamis dengan skor memuaskan.'],
        },
      ],
    },
    {
      id: 'custom-2',
      title: 'Prestasi & Lomba',
      entries: [
        {
          id: 'ach-1',
          title: 'Juara 2 Lomba Web Design Tingkat Karesidenan Banyumas',
          subtitle: 'Universitas Amikom Purwokerto',
          year: '2024',
          bullets: ['Merancang purwarupa website pariwisata daerah dalam waktu kompetisi 6 jam.'],
        },
      ],
    },
  ],
};

export const EMPTY_CV_DATA: CvData = {
  version: 1,
  meta: {
    language: 'id',
    template: 'modern',
    accent: '#ED1E28',
    font: 'sans',
    sectionOrder: ['education', 'projects', 'experience', 'skills', 'custom'],
    hiddenSections: [],
  },
  personal: {
    fullName: '',
    headline: '',
    phone: '',
    email: '',
    address: '',
    summary: '',
    links: [],
  },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  custom: [],
};

export const ACCENT_COLORS = [
  { name: 'Merah Telkom', hex: '#ED1E28' },
  { name: 'Biru Royal', hex: '#0F62FE' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Navy Klasik', hex: '#1E3A8A' },
  { name: 'Burgundy', hex: '#831843' },
  { name: 'Hitam Netral', hex: '#1F2937' },
];

export const MONTHS_ID = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Agu' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Okt' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Des' },
];

export const MONTHS_EN = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];
