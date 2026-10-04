import crypto from "node:crypto";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://jhic_user:jhic_secure_pass_2026@127.0.0.1:5432/jhic_school_db?schema=public";

const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function main() {
  console.log("🌱 Memulai seeding database SMK Telkom Purwokerto...");

  // 1. Akun Default Admin
  const adminUsername = process.env.ADMIN_DEFAULT_USERNAME || "kucang";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "kucang!qiw";
  const passwordHash = await hashPassword(adminPassword);

  // Hapus akun lama 'admin' jika ada
  await prisma.adminUser.deleteMany({ where: { username: "admin" } }).catch(() => {});

  const admin = await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
      name: "Administrator Kucang",
      email: "kucang@smktelkom-pwt.sch.id",
      role: "ADMIN",
      isActive: true,
    },
    create: {
      username: adminUsername,
      name: "Administrator Kucang",
      email: "kucang@smktelkom-pwt.sch.id",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Admin user siap: ${admin.username} (Password default: ${adminPassword})`);

  // 2. Berita & Pengumuman
  const newsList = [
    {
      title: "Siswa SMK Telkom Raih Juara 1 Lomba Kompetensi Siswa Tingkat Provinsi",
      slug: "siswa-smk-telkom-raih-juara-1-lks-provinsi-2026",
      category: "Prestasi",
      date: "18 Februari 2026",
      excerpt:
        "Tim jurusan Teknik Jaringan Komputer dan Telekomunikasi berhasil membawa pulang medali emas dalam ajang LKS tingkat Provinsi Jawa Tengah 2026.",
      content:
        "Tim jurusan Teknik Jaringan Komputer dan Telekomunikasi berhasil membawa pulang medali emas dalam ajang LKS tingkat Provinsi Jawa Tengah 2026, mengalahkan puluhan sekolah vokasi lain di bidang instalasi dan konfigurasi jaringan cerdas. Kepala Sekolah memberikan apresiasi tinggi kepada para mentor dan siswa yang telah berjuang.",
      imageUrl: "/images/berita/berita-prestasi.png",
      isFeatured: true,
      isPublished: true,
      order: 1,
    },
    {
      title: "Telkomsel dan PT Telkom Indonesia Jalin MoU Praktik Kerja Lapangan",
      slug: "telkomsel-telkom-indonesia-mou-pkl-2026",
      category: "Kerjasama",
      date: "12 Februari 2026",
      excerpt:
        "Penguatan kerjasama penyerapan siswa PKL serta kelas industri terpadu untuk talenta digital masa depan.",
      content:
        "SMK Telkom Purwokerto bersama PT Telkom Indonesia Tbk dan Telkomsel menandatangani nota kesepahaman (MoU) terkait perluasan kuota PKL terstandar industri dan kurikulum berbasis proyek nyata (Project Based Learning).",
      imageUrl: "/images/mitra/mitra-telkom.png",
      isFeatured: false,
      isPublished: true,
      order: 2,
    },
    {
      title: "Workshop AI & Machine Learning bersama Praktisi Industri Digital",
      slug: "workshop-ai-machine-learning-praktisi-industri",
      category: "Teknologi",
      date: "5 Februari 2026",
      excerpt:
        "Siswa jurusan Rekayasa Perangkat Lunak memperdalam pemanfaatan model bahasa besar dan computer vision.",
      content:
        "Sebanyak 120 siswa kelas XI mengikuti workshop intensif implementasi kecerdasan buatan dalam rekayasa perangkat lunak modern bersama pemateri senior software engineer industri startup unicorn.",
      imageUrl: "/images/berita/berita-technopreneur.png",
      isFeatured: false,
      isPublished: true,
      order: 3,
    },
    {
      title: "Peresmian Laboratorium Cloud Computing Bantuan Kementerian Kominfo",
      slug: "peresmian-lab-cloud-computing-kominfo",
      category: "Fasilitas",
      date: "28 Januari 2026",
      excerpt:
        "Fasilitas server cloud dan virtualisasi berstandar enterprise kini dapat digunakan untuk pembelajaran praktikum.",
      content:
        "Laboratorium komputasi awan terbaru resmi dibuka untuk mendukung kurikulum AWS Academy dan sertifikasi MikroTik/Cisco bagi seluruh siswa.",
      imageUrl: "/images/profile/smart-school-fasilitas.png",
      isFeatured: false,
      isPublished: true,
      order: 4,
    },
    {
      title: "SMPB SMK Telkom Purwokerto 2027/2028 Jalur EASY Resmi dibuka!",
      slug: "spmb-smk-telkom-jalur-easy-resmi-dibuka",
      category: "PPDB",
      date: "13 Agustus 2026",
      excerpt:
        "Pendaftaran SPMB SMK Telkom Purwokerto TA 2027/2028 Jalur EASY untuk calon peserta didik baru telah resmi dibuka.",
      content:
        "Kabar gembira! Pendaftaran SPMB SMK Telkom Purwokerto TA 2027/2028 Jalur EASY untuk calon peserta didik baru telah resmi dibuka dengan kemudahan seleksi nilai rapor dan portofolio.",
      imageUrl: "/images/berita/berita-spmb.png",
      isFeatured: false,
      isPublished: true,
      order: 5,
    },
    {
      title: "SMK Telkom Purwokerto: Menuju School of Global Technopreneur",
      slug: "smk-telkom-school-of-global-technopreneur",
      category: "Prestasi",
      date: "11 Agustus 2026",
      excerpt:
        "Program dirancang untuk mencetak lulusan yang jago teknologi, berkarakter, dan siap menjadi wirausahawan global.",
      content:
        "Program School of Global Technopreneur SMK Telkom Purwokerto dirancang untuk mencetak lulusan yang jago teknologi, berkarakter, dan siap menjadi wirausahawan di tingkat global melalui inkubasi produk digital.",
      imageUrl: "/images/berita/berita-technopreneur.png",
      isFeatured: true,
      isPublished: true,
      order: 6,
    },
  ];

  for (const n of newsList) {
    await prisma.newsArticle.upsert({
      where: { slug: n.slug },
      update: n,
      create: n,
    });
  }
  console.log(`✅ Berita & Pengumuman seeded: ${newsList.length} artikel.`);

  // 3. Program Keahlian (Jurusan)
  const majors = [
    {
      code: "PG",
      name: "Pengembangan Gim",
      headlineTitle: "Pengembangan Game",
      tagline: "Keunggulan Jurusan",
      description:
        "Ubah imajinasimu menjadi karya interaktif yang memikat dunia. Kamu akan mempelajari seluruh alur pembuatan gim, mulai dari desain karakter, mekanik permainan, hingga animasi 2D/3D. Dengan fasilitas lab canggih, siswa diarahkan menjadi inovator kreatif yang mampu menciptakan produk gim yang memiliki nilai jual di pasar digital.",
      imageUrl: "/images/jurusan/siswa-vr.png",
      cardTags: ["Game Design", "3D Animation", "Interactive Art"],
      competencies: [
        { text: "Game QA & Tester", icon: "qa" },
        { text: "Pemrograman Game (Unity & C#)", icon: "code" },
        { text: "Multiplayer & Game Networking", icon: "network" },
        { text: "Publishing & Monetisasi Game", icon: "publish" },
        { text: "Tata Suara & Audio Efek Game", icon: "audio" },
        { text: "Game UI/UX Designer", icon: "uiux" },
      ],
      careerProspects:
        "Game Developer, Game Programmer, Game Designer, 2D/3D Artist, Technical Artist, dan Game QA Tester.",
      order: 1,
    },
    {
      code: "RPL",
      name: "Rekayasa Perangkat Lunak",
      headlineTitle: "Rekayasa Perangkat Lunak",
      tagline: "Keunggulan Jurusan",
      description:
        "Jadilah kreator di balik aplikasi dan perangkat lunak masa depan. Di sini, kamu tidak hanya belajar menulis kode, tapi membangun solusi digital mulai dari aplikasi web hingga mobile. Fokus pada pengembangan produk nyata (MVP) yang siap bersaing di industri startup global maupun menjadi Technopreneur muda.",
      imageUrl: "/images/jurusan/siswa-pplg.png",
      cardTags: ["Web Development", "Mobile Dev", "Technopreneur"],
      competencies: [
        { text: "Web Development (Front-end & Back-end)", icon: "code" },
        { text: "Mobile Development (Flutter & React Native)", icon: "mobile" },
        { text: "UI/UX & Product Design", icon: "uiux" },
        { text: "Database & Software Architecture", icon: "database" },
        { text: "Software Quality Assurance (QA) & Testing", icon: "qa" },
        { text: "MVP Development & Technopreneurship", icon: "publish" },
      ],
      careerProspects:
        "Software Engineer, Web Developer, Mobile App Developer, Database Administrator, QA Engineer, System Analyst.",
      order: 2,
    },
    {
      code: "TKJ",
      name: "Teknik Komputer & Jaringan",
      headlineTitle: "Teknik Komputer & Jaringan",
      tagline: "Keunggulan Jurusan",
      description:
        "Kuasai infrastruktur digital, keamanan siber (Cybersecurity), dan sistem awan (Cloud Computing). Dibekali dengan sertifikasi kompetensi industri internasional (seperti Cisco/Mikrotik), kamu akan dididik menjadi ahli IT profesional yang siap menjaga dan membangun jaringan teknologi di perusahaan-perusahaan raksasa.",
      imageUrl: "/images/jurusan/siswa-game.png",
      cardTags: ["Cybersecurity", "Cloud Sys", "Networking"],
      competencies: [
        { text: "Network Engineering & Routing (Cisco & Mikrotik)", icon: "network" },
        { text: "Cyber Security & Ethical Hacking", icon: "security" },
        { text: "System & Server Administration (Linux)", icon: "server" },
        { text: "Cloud Computing & Virtualization", icon: "cloud" },
        { text: "Network Troubleshooting & Automation", icon: "tools" },
      ],
      careerProspects:
        "Network Engineer, Cybersecurity Analyst, Cloud Architect, Systems Administrator, DevOps Engineer.",
      order: 3,
    },
    {
      code: "TJA",
      name: "Teknik Jaringan Akses Telekomunikasi",
      headlineTitle: "Teknik Jaringan Akses Telekomunikasi",
      tagline: "Keunggulan Jurusan",
      description:
        "Mempelajari teknologi jaringan telekomunikasi kabel dan nirkabel, fiber optik (FTTH), transmisi radio, dan infrastruktur seluler generasi modern 5G bersama ekosistem PT Telkom Indonesia.",
      imageUrl: "/images/class3d/RuangTJKT.jpg",
      cardTags: ["Fiber Optic", "FTTH", "Telecommunication"],
      competencies: [
        { text: "Fiber Optic Splicing & OTDR Measurement", icon: "network" },
        { text: "Instalasi Jaringan Akses FTTH", icon: "tools" },
        { text: "Transmisi Radio & Microwave", icon: "server" },
        { text: "Sistem Komunikasi Nirkabel & 5G", icon: "cloud" },
      ],
      careerProspects:
        "Telecommunication Technician, Fiber Optic Specialist, RF Engineer, Access Network Specialist.",
      order: 4,
    },
  ];

  for (const m of majors) {
    await prisma.schoolMajor.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
  }
  console.log(`✅ Jurusan seeded: ${majors.length} program keahlian.`);

  // 4. Dewan Guru & Pimpinan
  const teachers = [
    {
      name: "Aris Puji Santoso, S.Kom., M.M.",
      position: "Kepala Sekolah",
      sectionId: "pucuk-pimpinan",
      sectionBadge: "01. Dewan Pimpinan",
      sectionTitle: "Pucuk Pimpinan & Dewan Pertimbangan",
      imageUrl: "/images/guru/kepala-sekolah.png",
      order: 1,
    },
    {
      name: "Ferat Kristanto, S.E., S.Kom.",
      position: "Kaur Quality Development & Performance Management",
      sectionId: "pucuk-pimpinan",
      sectionBadge: "01. Dewan Pimpinan",
      sectionTitle: "Pucuk Pimpinan & Dewan Pertimbangan",
      imageUrl: "/images/guru/dsc05988_EVEREST (1) - 06740003 FERAT KRISTANTO, SE. S.KOM.jpg",
      order: 2,
    },
    {
      name: "Desti Nurcahyani, S.Pd.Si.",
      position: "Waka Bid. Kurikulum",
      sectionId: "kurikulum",
      sectionBadge: "02. Kurikulum & Pembelajaran",
      sectionTitle: "Bidang Kurikulum & Pembelajaran",
      imageUrl: "/images/guru/dsc08058_EVEREST - 09860097 DESTI NURCAHYANI, SPd Si.jpg",
      order: 3,
    },
    {
      name: "Bayu Aji Sukma, S.Si.",
      position: "Pgs. Kaur Pembelajaran & Perpustakaan",
      sectionId: "kurikulum",
      sectionBadge: "02. Kurikulum & Pembelajaran",
      sectionTitle: "Bidang Kurikulum & Pembelajaran",
      imageUrl: "/images/guru/dsc05924_EVEREST - 16850007 BAYU AJI SUKMA.jpg",
      order: 4,
    },
    {
      name: "Ragil Rudi Priyanto, S.Si.",
      position: "Pgs. Kaur Pengembangan KurSilMat",
      sectionId: "kurikulum",
      sectionBadge: "02. Kurikulum & Pembelajaran",
      sectionTitle: "Bidang Kurikulum & Pembelajaran",
      imageUrl: "/images/guru/dsc05823_EVEREST - 12850092 RAGIL RUDI PRIYANTO.jpg",
      order: 5,
    },
    {
      name: "Andang Jaka Patrianta, S.Pd.",
      position: "Guru Senior & Pengajar Vokasi",
      sectionId: "kurikulum",
      sectionBadge: "02. Kurikulum & Pembelajaran",
      sectionTitle: "Bidang Kurikulum & Pembelajaran",
      imageUrl: "/images/guru/1758848686419 - 20182019 ANDANG JAKA PATRIANTA, S.Pd.jpg",
      order: 6,
    },
    {
      name: "Putra Utama Eka Sakti",
      position: "Guru Jurusan RPL & Rekayasa Perangkat Lunak",
      sectionId: "kejuruan",
      sectionBadge: "03. Tenaga Pendidik Kejuruan",
      sectionTitle: "Kompetensi Keahlian & Praktik Industri",
      imageUrl: "/images/guru/dsc05752_EVEREST - 15920046 PUTRA UTAMA EKA SAKTI.jpg",
      order: 7,
    },
    {
      name: "Agung Restu Saputra",
      position: "Guru Teknik Komputer & Jaringan",
      sectionId: "kejuruan",
      sectionBadge: "03. Tenaga Pendidik Kejuruan",
      sectionTitle: "Kompetensi Keahlian & Praktik Industri",
      imageUrl: "/images/guru/dsc05760_EVEREST - 17990002 AGUNG RESTU SAPUTRA.jpg",
      order: 8,
    },
    {
      name: "Bintang Nugraha Kasaluri, S.",
      position: "Guru Pengembangan Gim & Animasi 3D",
      sectionId: "kejuruan",
      sectionBadge: "03. Tenaga Pendidik Kejuruan",
      sectionTitle: "Kompetensi Keahlian & Praktik Industri",
      imageUrl: "/images/guru/dsc05960_EVEREST - 20192020 BINTANG NUGRAHA KASALURI S.jpg",
      order: 9,
    },
    {
      name: "Berlian Windasari, S.Kom.",
      position: "Instruktur Laboratorium Komputer",
      sectionId: "kejuruan",
      sectionBadge: "03. Tenaga Pendidik Kejuruan",
      sectionTitle: "Kompetensi Keahlian & Praktik Industri",
      imageUrl: "/images/guru/dsc05967_EVEREST - 17840098 BERLIAN WINDASARI S KOM.jpg",
      order: 10,
    },
    {
      name: "Krisma Dwi Brata",
      position: "Pembina Ekstrakurikuler & Kesiswaan",
      sectionId: "kesiswaan",
      sectionBadge: "04. Kesiswaan & Karakter",
      sectionTitle: "Bidang Kesiswaan & Pengembangan Karakter",
      imageUrl: "/images/guru/dsc08047_EVEREST - 17900075 KRISMA DWI BRATA.jpg",
      order: 11,
    },
  ];

  await prisma.teacherLeader.deleteMany({});
  for (const t of teachers) {
    await prisma.teacherLeader.create({ data: t });
  }
  console.log(`✅ Dewan Guru & Pimpinan seeded: ${teachers.length} personil.`);

  // 5. Fasilitas & 360 Tur
  const facilities = [
    {
      name: "Ruangan PG",
      badge: "Ruang PG",
      description:
        "Ruang berstandar industri untuk perancangan mekanik gim, pemodelan 3D, dan pengujian gim interaktif dengan workstation spesifikasi tinggi.",
      imageUrl: "/images/class3d/RuangPG.jpg",
      isPanorama: true,
      icon: "gamepad",
      order: 1,
    },
    {
      name: "Laboratorium Jaringan & Telekomunikasi",
      badge: "Lab TJKT",
      description:
        "Fasilitas praktik infrastruktur fiber optik, perangkat routing Cisco & Mikrotik, dan server berstandar sertifikasi internasional.",
      imageUrl: "/images/class3d/RuangTJKT.jpg",
      isPanorama: true,
      icon: "network",
      order: 2,
    },
    {
      name: "Laboratorium Robotika & IoT",
      badge: "Lab Robotik",
      description:
        "Pusat riset dan perakitan robot, otomasi, dan mikrokontroler untuk kompetisi nasional dan inovasi teknologi cerdas.",
      imageUrl: "/images/class3d/RuangRobotik.jpg",
      isPanorama: true,
      icon: "robot",
      order: 3,
    },
    {
      name: "Studio Podcast & Konten Digital",
      badge: "Studio Podcast",
      description:
        "Ruang kedap suara dilengkapi tata cahaya profesional, mikrofon broadcast, dan sistem rekaman multi-kamera untuk produksi media.",
      imageUrl: "/images/class3d/RuangPodcast.jpg",
      isPanorama: true,
      icon: "microphone",
      order: 4,
    },
    {
      name: "Aula Serbaguna",
      badge: "Aula",
      description:
        "Gedung serbaguna berkapasitas besar dilengkapi sistem audio visual canggih untuk kegiatan upacara, seminar, dan pentas seni.",
      imageUrl: "/images/class3d/Aula.jpg",
      isPanorama: true,
      icon: "building",
      order: 5,
    },
    {
      name: "Masjid Baitul Ilmi",
      badge: "Masjid",
      description:
        "Masjid sekolah yang representatif sebagai pusat kegiatan keagamaan, ibadah, dan pembinaan karakter islami siswa.",
      imageUrl: "/images/class3d/Masjid.jpg",
      isPanorama: true,
      icon: "moon",
      order: 6,
    },
    {
      name: "Lapangan Upacara & Olahraga",
      badge: "Lapangan",
      description:
        "Area lapangan utama yang luas dan representatif untuk pelaksanaan upacara bendera, apel pagi, kegiatan baris-berbaris, serta berbagai agenda luar ruangan.",
      imageUrl: "/images/class3d/LapanganUpacara.jpg",
      isPanorama: true,
      icon: "flag",
      order: 7,
    },
    {
      name: "Unit Kesehatan Sekolah (UKS)",
      badge: "UKS",
      description:
        "Ruang pelayanan pertolongan pertama dan kesehatan siswa dengan peralatan medis dasar yang bersih dan nyaman.",
      imageUrl: "/images/class3d/UKS.jpg",
      isPanorama: true,
      icon: "heart",
      order: 8,
    },
  ];

  await prisma.schoolFacility.deleteMany({});
  for (const f of facilities) {
    await prisma.schoolFacility.create({ data: f });
  }
  console.log(`✅ Fasilitas seeded: ${facilities.length} fasilitas.`);

  // 6. Prestasi Siswa
  const achievements = [
    {
      title: "Lomba Kompetensi Siswa (LKS) Nasional 2023 - Cyber Security",
      category: "akademik",
      badge: "Juara 1 Nasional",
      meta: "2023 • Teknologi Informasi",
      description:
        "Tim Cyber SMK Telkom Purwokerto berhasil mengamankan peringkat pertama dalam ajang bergengsi LKS Nasional.",
      year: "2023",
      order: 1,
    },
    {
      title: "Global Student Tech Innovation - Singapore",
      category: "akademik",
      badge: "Top 3 International",
      meta: "2024 • Global Innovation",
      description:
        "Mengembangkan aplikasi solusi lingkungan berbasis AI yang mendapatkan apresiasi di tingkat Asia Tenggara.",
      year: "2024",
      order: 2,
    },
    {
      title: "Popda Jawa Tengah - Cabang Olahraga Basket",
      category: "non-akademik",
      badge: "Juara Regional",
      meta: "2023 • Olahraga",
      description:
        "Tim Basket putra SMK Telkom Purwokerto menunjukkan sportivitas dan performa luar biasa di tingkat provinsi.",
      year: "2023",
      order: 3,
    },
    {
      title: "Kontes Robot Indonesia (KRI) Wilayah 2",
      category: "akademik",
      badge: "Best Design",
      meta: "2024 • Robotics",
      description:
        "Inovasi desain mekanik robot pencari korban bencana mendapatkan penghargaan desain terbaik.",
      year: "2024",
      order: 4,
    },
    {
      title: "Animasi Pendek FLS2N Jawa Tengah",
      category: "non-akademik",
      badge: "Juara 1 Regional",
      meta: "2023 • Multimedia",
      description:
        "Karya animasi 3D siswa meraih apresiasi tertinggi kategori kreativitas visual tingkat regional.",
      year: "2023",
      order: 5,
    },
    {
      title: "Mikrotik Certified Student Competition 2024",
      category: "akademik",
      badge: "Juara 2 Nasional",
      meta: "2024 • Networking",
      description:
        "Kompetisi konfigurasi router dan troubleshooting jaringan komputer tingkat nasional.",
      year: "2024",
      order: 6,
    },
  ];

  await prisma.studentAchievement.deleteMany({});
  for (const a of achievements) {
    await prisma.studentAchievement.create({ data: a });
  }
  console.log(`✅ Prestasi Siswa seeded: ${achievements.length} pencapaian.`);

  // 7. Ekstrakurikuler
  const extracurriculars = [
    {
      name: "Badminton",
      imageUrl: "/images/kegiatan/kegiatan-seni.png",
      description:
        "Olahraga bulutangkis untuk melatih ketangkasan, refleks, stamina, serta teknik bertanding yang kompetitif di berbagai kejuaraan.",
      icon: "activity",
      order: 1,
    },
    {
      name: "Basket",
      imageUrl: "/images/kegiatan/kegiatan-basket.png",
      description:
        "Olahraga basket kompetitif antar sekolah yang melatih kerjasama tim, strategi, dan kebugaran fisik para siswa.",
      icon: "disc",
      order: 2,
    },
    {
      name: "Futsal",
      imageUrl: "/images/kegiatan/kegiatan-futsal.png",
      description:
        "Olahraga futsal tim sekolah yang mengasah kemampuan teknis, kecepatan, dan kerjasama dalam pertandingan antar sekolah.",
      icon: "shield",
      order: 3,
    },
    {
      name: "Paskibra",
      imageUrl: "/images/kegiatan/kegiatan-paskibra.png",
      description:
        "Paskibra adalah ekskul baris-berbaris untuk melatih kedisiplinan dan mempersiapkan petugas pengibar bendera sekolah.",
      icon: "flag",
      order: 4,
    },
    {
      name: "Pramuka",
      imageUrl: "/images/kegiatan/kegiatan-pramuka.png",
      description:
        "Kegiatan kepanduan untuk membentuk karakter siswa yang disiplin, mandiri, dan bertanggung jawab melalui berbagai kegiatan alam dan sosial.",
      icon: "compass",
      order: 5,
    },
    {
      name: "PMR (Palang Merah Remaja)",
      imageUrl: "/images/kegiatan/kegiatan-paduan-suara.png",
      description:
        "Kegiatan palang merah remaja dan pertolongan pertama yang melatih siswa untuk siap membantu sesama dalam situasi darurat.",
      icon: "heart",
      order: 6,
    },
  ];

  await prisma.extracurricular.deleteMany({});
  for (const e of extracurriculars) {
    await prisma.extracurricular.create({ data: e });
  }
  console.log(`✅ Ekstrakurikuler seeded: ${extracurriculars.length} ekskul.`);

  // 8. Mitra Industri
  const partners = [
    { name: "Dinkominfo Banyumas", logoUrl: "/images/mitra/mitra-telkom.png", scale: 1.28, order: 1 },
    { name: "Bank Jateng", logoUrl: "/images/mitra/mitra-oracle.png", scale: 1.0, order: 2 },
    { name: "PLN Indonesia Power", logoUrl: "/images/mitra/mitra-pln.png", scale: 1.7, order: 3 },
    { name: "nusantara.media", logoUrl: "/images/mitra/mitra-cisco.png", scale: 0.88, order: 4 },
    { name: "Telkom Indonesia", logoUrl: "/images/mitra/mitra-mikrotik.png", scale: 1.3, order: 5 },
    { name: "METRODATA", logoUrl: "/images/mitra/mitra-redhat.png", scale: 1.35, order: 6 },
    { name: "Dicoding", logoUrl: "/images/mitra/mitra-aws.png", scale: 1.65, order: 7 },
  ];

  await prisma.industryPartner.deleteMany({});
  for (const p of partners) {
    await prisma.industryPartner.create({ data: p });
  }
  console.log(`✅ Mitra Industri seeded: ${partners.length} mitra.`);

  // 9. Lowongan PKL
  const pklListings = [
    // --- RPL ---
    {
      company: "Telkom Indonesia",
      initials: "TI",
      logoBg: "bg-[#E4002B]",
      location: "Bandung",
      workMode: "Hybrid",
      title: "Frontend Developer Intern",
      tags: ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
      description: "Membantu pengembangan antarmuka portal layanan pelanggan berbasis web dan integrasi API design system Telkom.",
      major: "RPL",
      isOpen: true,
      order: 1,
    },
    {
      company: "Finnet Indonesia",
      initials: "FN",
      logoBg: "bg-[#0761C7]",
      location: "Jakarta",
      workMode: "Hybrid",
      title: "Backend Node.js & API Intern",
      tags: ["Node.js", "Express", "PostgreSQL", "REST APIs"],
      description: "Mengembangkan endpoint microservice pembayaran digital, integrasi gateway perbankan, dan optimasi query database.",
      major: "RPL",
      isOpen: true,
      order: 2,
    },
    {
      company: "Telkomsel",
      initials: "TS",
      logoBg: "bg-[#E4002B]",
      location: "Jakarta",
      workMode: "Hybrid",
      title: "Mobile Flutter Developer Intern",
      tags: ["Flutter", "Dart", "State Management", "Mobile UI"],
      description: "Membantu pembuatan fitur aplikasi mobile layanan mandiri pelanggan, pengujian widget, dan integrasi response API backend.",
      major: "RPL",
      isOpen: true,
      order: 3,
    },
    {
      company: "Tokopedia",
      initials: "TP",
      logoBg: "bg-[#10B981]",
      location: "Jakarta",
      workMode: "Remote",
      title: "Junior Fullstack Web Intern",
      tags: ["Next.js", "TypeScript", "Prisma", "Tailwind CSS"],
      description: "Berkolaborasi dalam pengembangan fitur merchant dashboard, pemeliharaan arsitektur frontend, dan integrasi backend modern.",
      major: "RPL",
      isOpen: true,
      order: 4,
    },
    {
      company: "Infomedia Nusantara",
      initials: "IN",
      logoBg: "bg-[#0761C7]",
      location: "Bandung",
      workMode: "Hybrid",
      title: "QA Automation & Software Tester Intern",
      tags: ["Playwright", "Cypress", "Jest", "Manual Testing"],
      description: "Menyusun skenario pengujian end-to-end, melakukan automation test antarmuka web, dan mendokumentasikan temuan bug sistem.",
      major: "RPL",
      isOpen: true,
      order: 5,
    },

    // --- TKJ ---
    {
      company: "Telkomsigma",
      initials: "TS",
      logoBg: "bg-[#E4002B]",
      location: "Semarang",
      workMode: "On-site",
      title: "Data Center Support Intern",
      tags: ["Linux Server", "Monitoring", "Hardware", "Virtualization"],
      description: "Membantu pemantauan operasional pusat data tier-3, inventarisasi server rak, dan dasar administrasi infrastruktur cloud enterprise.",
      major: "TKJ",
      isOpen: true,
      order: 6,
    },
    {
      company: "PINS Indonesia",
      initials: "PN",
      logoBg: "bg-[#0761C7]",
      location: "Purwokerto",
      workMode: "On-site",
      title: "IT Infrastructure & Support Intern",
      tags: ["Jaringan", "Hardware", "Troubleshoot", "MikroTik"],
      description: "Mendukung instalasi perangkat jaringan, konfigurasi router/switch, dan perbaikan perangkat keras di lingkungan klien korporat.",
      major: "TKJ",
      isOpen: true,
      order: 7,
    },
    {
      company: "Lintasarta",
      initials: "LA",
      logoBg: "bg-[#0761C7]",
      location: "Jakarta",
      workMode: "On-site",
      title: "Network Engineer & Routing Intern",
      tags: ["Cisco", "MikroTik", "BGP", "VLAN", "Routing"],
      description: "Membantu konfigurasi routing static & dynamic, manajemen VLAN switch enterprise, dan pengawasan link WAN pelanggan bisnis.",
      major: "TKJ",
      isOpen: true,
      order: 8,
    },
    {
      company: "Telkomsel Regional",
      initials: "TR",
      logoBg: "bg-[#E4002B]",
      location: "Purwokerto",
      workMode: "On-site",
      title: "NOC Network Operations Intern",
      tags: ["NOC", "Wireshark", "Monitoring", "TCP/IP", "Incident"],
      description: "Membantu monitoring real-time ketersediaan jaringan telekomunikasi seluler dan koordinasi eskalasi insiden BTS di regional Jateng.",
      major: "TKJ",
      isOpen: true,
      order: 9,
    },
    {
      company: "CBN Cloud",
      initials: "CB",
      logoBg: "bg-[#10B981]",
      location: "Jakarta",
      workMode: "Hybrid",
      title: "Cloud & Linux Systems Admin Intern",
      tags: ["Ubuntu Server", "Docker", "Nginx", "Bash", "Cloud"],
      description: "Membantu konfigurasi web server Nginx, containerisasi aplikasi berbasis Docker, dan otomasi pemeliharaan server Linux.",
      major: "TKJ",
      isOpen: true,
      order: 10,
    },

    // --- TJA ---
    {
      company: "Telkom Akses Purwokerto",
      initials: "TA",
      logoBg: "bg-[#0761C7]",
      location: "Purwokerto",
      workMode: "On-site",
      title: "Fiber Optic Splicing & OTDR Technician",
      tags: ["FTTH", "OTDR", "Fusion Splicer", "ODP/ODC"],
      description: "Praktik langsung penanganan jaringan kabel serat optik, penyambungan core dengan fusion splicer, dan pengukuran redaman OTDR.",
      major: "TJA",
      isOpen: true,
      order: 11,
    },
    {
      company: "Telkom Akses Regional",
      initials: "TA",
      logoBg: "bg-[#0761C7]",
      location: "Semarang",
      workMode: "On-site",
      title: "FTTH Outside Plant (OSP) Planner Intern",
      tags: ["AutoCAD", "QGIS", "FTTH", "Survey", "ODP"],
      description: "Membantu survei lapangan jalur distribusi kabel optik, pemetaan rute tiang & manhole, serta penggambaran as-built drawing jaringan FTTH.",
      major: "TJA",
      isOpen: true,
      order: 12,
    },
    {
      company: "Mitratel",
      initials: "MT",
      logoBg: "bg-[#E4002B]",
      location: "Purwokerto",
      workMode: "On-site",
      title: "Tower & RF Transmission Technician Intern",
      tags: ["Tower BTS", "RF", "Antenna", "VSWR", "K3 Lapangan"],
      description: "Mendampingi teknisi senior dalam pemeliharaan berkala infrastruktur menara BTS, pengecekan feeder kabel RF, dan audit grounding.",
      major: "TJA",
      isOpen: true,
      order: 13,
    },
    {
      company: "Telkom Akses Banyumas",
      initials: "TA",
      logoBg: "bg-[#0761C7]",
      location: "Purwokerto",
      workMode: "On-site",
      title: "Quality Assurance & Fiber Testing Intern",
      tags: ["OPM", "VFL", "Optical Power", "Fiber Optic"],
      description: "Melakukan pengujian kualitas sambungan kabel optik pada jaringan backbone dan distribusi menggunakan Optical Power Meter (OPM) dan Visual Fault Locator.",
      major: "TJA",
      isOpen: true,
      order: 14,
    },
    {
      company: "Indosat Ooredoo Hutchison",
      initials: "IO",
      logoBg: "bg-[#F59E0B]",
      location: "Yogyakarta",
      workMode: "Hybrid",
      title: "Microwave & Backhaul Transmission Intern",
      tags: ["Microwave", "Backhaul", "Link Budget", "Transmisi"],
      description: "Membantu analisis performa link transmisi microwave antar-site, pemantauan utilisasi kapasitas backhaul radio, dan pelaporan metrik sinyal.",
      major: "TJA",
      isOpen: true,
      order: 15,
    },

    // --- PG ---
    {
      company: "Agate International",
      initials: "AG",
      logoBg: "bg-[#8B5CF6]",
      location: "Bandung",
      workMode: "Hybrid",
      title: "Game Programmer Unity & C# Intern",
      tags: ["Unity", "C#", "Gameplay Mechanics", "Physics 2D/3D"],
      description: "Mengembangkan logika mekanisme gameplay, sistem kontrol karakter, dan integrasi antarmuka game menggunakan Unity Engine.",
      major: "PG",
      isOpen: true,
      order: 16,
    },
    {
      company: "Gameloft Indonesia",
      initials: "GL",
      logoBg: "bg-[#0761C7]",
      location: "Yogyakarta",
      workMode: "Hybrid",
      title: "3D Game Environment Artist Intern",
      tags: ["Blender", "Maya", "3D Modeling", "Texturing", "PBR"],
      description: "Membuat aset lingkungan 3D berstandar mobile gaming, pemodelan low-poly teroptimasi, serta UV unwrapping dan texturing PBR.",
      major: "PG",
      isOpen: true,
      order: 17,
    },
    {
      company: "Nuon Digital Indonesia",
      initials: "ND",
      logoBg: "bg-[#0761C7]",
      location: "Jakarta",
      workMode: "Hybrid",
      title: "Game UI/UX & Asset Designer Intern",
      tags: ["Figma", "Photoshop", "Game UI", "Asset Export", "Wireframe"],
      description: "Merancang layout antarmuka interaktif game mobile, membuat ikon item, tombol, dan asset sheet yang siap diimpor ke game engine.",
      major: "PG",
      isOpen: true,
      order: 18,
    },
    {
      company: "Toge Productions",
      initials: "TP",
      logoBg: "bg-[#EC4899]",
      location: "Tangerang",
      workMode: "Remote",
      title: "2D Sprite & Pixel Animator Intern",
      tags: ["Aseprite", "Pixel Art", "2D Animation", "Frame-by-frame"],
      description: "Membuat aset karakter 2D, animasi walk/attack/idle frame-by-frame menggunakan Aseprite, dan menyiapkan sprite sheets untuk integrasi game.",
      major: "PG",
      isOpen: true,
      order: 19,
    },
    {
      company: "Metra Digital",
      initials: "MD",
      logoBg: "bg-[#E4002B]",
      location: "Jakarta",
      workMode: "Hybrid",
      title: "Multimedia & Motion Graphics Intern",
      tags: ["After Effects", "Premiere Pro", "Motion Graphics", "Video Editing"],
      description: "Memproduksi trailer gameplay interaktif, animasi motion graphics promosi digital, dan aset visual multimedia untuk rilisan gim lokal.",
      major: "PG",
      isOpen: true,
      order: 20,
    },
  ];

  await prisma.pklListing.deleteMany({});
  for (const p of pklListings) {
    await prisma.pklListing.create({ data: p });
  }
  console.log(`✅ Lowongan PKL seeded: ${pklListings.length} lowongan.`);

  // 10. Kisah Sukses Alumni
  const alumni = [
    {
      name: "PROF. DR. IR. MOH. KHAIRUDIN, M.T., PH.D.",
      role: "Guru Besar Universitas Negeri Yogyakarta | Lulusan 1998",
      quote:
        "Fondasi teknologi dan karakter yang saya dapatkan di SMK Telkom adalah pijakan awal kesuksesan. Kini saya bangga melihat almamater saya terus mencetak pemimpin masa depan.",
      imageUrl: "/images/alumni/alumni-khairudin.png",
      graduationYear: "1998",
      order: 1,
    },
    {
      name: "DR. TENIA WAHYUNINGRUM, S.KOM., M.T.",
      role: "Direktur Telkom University Purwokerto | Lulusan 2001",
      quote:
        "SMK Telkom Purwokerto adalah kawah candradimuka talenta digital. Lulusannya terbukti memiliki daya saing tinggi saat melanjutkan studi di Telkom University.",
      imageUrl: "/images/alumni/alumni-tenia.png",
      graduationYear: "2001",
      order: 2,
    },
    {
      name: "ALFA PUTRA KURNIA",
      role: "Co-founder & CEO Arkademy.com | Alumni TKJ",
      quote:
        "Menghadapi dunia bisnis butuh skill, knowledge, dan attitude. Semua fondasi adaptasi dunia kerja itu saya dapatkan lengkap di SMK Telkom Purwokerto.",
      imageUrl: "/images/alumni/alumni-alfa.png",
      graduationYear: "2010",
      order: 3,
    },
    {
      name: "PRARIARGA MAOLANA B.",
      role: "Manager PT PLN (Persero) ULP Purwokerto Kota | Alumni",
      quote:
        "Menghadapi dunia bisnis dan ketenagalistrikan modern yang kompleks dibutuhkan keahlian, integritas, dan disiplin tinggi yang terasah sejak sekolah.",
      imageUrl: "/images/alumni/alumni-prariarga.png",
      graduationYear: "2008",
      order: 4,
    },
  ];

  await prisma.alumniStory.deleteMany({});
  for (const a of alumni) {
    await prisma.alumniStory.create({ data: a });
  }
  console.log(`✅ Kisah Alumni seeded: ${alumni.length} profil.`);

  // 11. FAQ Items
  const faqs = [
    {
      question: "Apa saja jurusan atau program keahlian yang tersedia di SMK Telkom Purwokerto?",
      answer:
        "SMK Telkom Purwokerto memiliki 4 program keahlian unggulan berstandar industri: Pengembangan Game (PG), Rekayasa Perangkat Lunak (RPL), Teknik Komputer & Jaringan (TKJ), dan Teknik Jaringan Akses Telekomunikasi (TJA). Masing-masing dilengkapi laboratorium modern dan sertifikasi resmi.",
      category: "Akademik",
      order: 1,
    },
    {
      question: "Apa saja persyaratan dokumen yang harus disiapkan?",
      answer:
        "Dokumen yang perlu disiapkan antara lain scan rapor SMP/MTs semester 1 sampai 5, scan Kartu Keluarga (KK), scan Akta Kelahiran, pas foto berwarna terbaru, dan piagam atau sertifikat prestasi (opsional untuk pendaftar jalur beasiswa/prestasi).",
      category: "Pendaftaran",
      order: 2,
    },
    {
      question: "Apakah sekolah menyediakan fasilitas asrama atau tempat tinggal?",
      answer:
        "SMK Telkom Purwokerto bekerjasama dengan mitra asrama dan pondokan/kost terverifikasi yang berada dekat lingkungan sekolah, dengan pengawasan aman, tertib, dan fasilitas memadai bagi siswa dari luar kota Purwokerto.",
      category: "Fasilitas",
      order: 3,
    },
  ];

  await prisma.faqItem.deleteMany({});
  for (const f of faqs) {
    await prisma.faqItem.create({ data: f });
  }
  console.log(`✅ FAQ seeded: ${faqs.length} pertanyaan.`);

  // 12. Pengaturan Sistem Website
  const settings: Record<string, string> = {
    site_name: "SMK Telkom Purwokerto",
    site_tagline: "School of Global Technopreneur",
    contact_phone: "+62 812-2970-1800",
    contact_email: "info@smktelkom-pwt.sch.id",
    ppdb_url: "https://ppdb.smktelkom-pwt.sch.id",
    stats_siswa_aktif: "910+",
    stats_jurusan: "4",
    stats_mitra: "182+",
    stats_prestasi: "150+",
    sambutan_nama: "Aris Puji Santoso, S.Kom., M.M.",
    sambutan_jabatan: "Kepala SMK Telkom Purwokerto",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  console.log(`✅ Pengaturan Sistem seeded: ${Object.keys(settings).length} item.`);

  console.log("🎉 Seeding database 12 modul dan Admin selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
