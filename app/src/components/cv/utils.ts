export function formatPhone(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+62')) {
    const rest = cleaned.substring(3);
    const parts = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7, 11)].filter(Boolean);
    return `+62 ${parts.join('-')}`;
  } else if (cleaned.startsWith('62')) {
    const rest = cleaned.substring(2);
    const parts = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7, 11)].filter(Boolean);
    return `+62 ${parts.join('-')}`;
  } else if (cleaned.startsWith('08')) {
    const parts = [cleaned.slice(0, 4), cleaned.slice(4, 8), cleaned.slice(8, 12)].filter(Boolean);
    return parts.join('-');
  }
  return cleaned;
}

export function validatePhone(phone: string): boolean {
  if (!phone) return true; // optional unless tested
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function formatPeriod(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  current: boolean,
  lang: 'id' | 'en' = 'id'
): string {
  const getMonthLabel = (m: string) => {
    const num = parseInt(m, 10);
    if (isNaN(num) || num < 1 || num > 12) return '';
    const idMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return lang === 'en' ? enMonths[num - 1] : idMonths[num - 1];
  };

  const startM = getMonthLabel(startMonth);
  const startPart = [startM, startYear].filter(Boolean).join(' ');

  if (current) {
    const presentLabel = lang === 'en' ? 'Present' : 'Sekarang';
    return startPart ? `${startPart} - ${presentLabel}` : presentLabel;
  }

  const endM = getMonthLabel(endMonth);
  const endPart = [endM, endYear].filter(Boolean).join(' ');

  if (!startPart && !endPart) return '';
  if (startPart && !endPart) return startPart;
  if (!startPart && endPart) return endPart;
  return `${startPart} - ${endPart}`;
}

// Action verb list for Indonesian RPL resumes
export const ACTION_VERBS_ID = [
  'Membangun',
  'Memimpin',
  'Merancang',
  'Mengembangkan',
  'Mengurangi',
  'Meningkatkan',
  'Mengelola',
  'Menyusun',
  'Membuat',
  'Mengintegrasikan',
  'Mengotomatisasi',
  'Menerapkan',
  'Menguji',
  'Mengoptimalkan',
  'Memelihara',
  'Mengonfigurasi',
  'Melatih',
  'Menyelesaikan',
  'Membuatkan',
  'Mengkoordinasikan',
];

export const WEAK_PREFIXES_ID = ['bertanggung jawab atas', 'membantu', 'ikut serta dalam', 'tugas saya adalah'];

export interface AuditSuggestion {
  id: string;
  category: 'critical' | 'improvement' | 'strength';
  label: string;
  description: string;
  points: number;
  completed: boolean;
  sectionTarget?: string;
}

export function calculateCvCompleteness(cv: any): { score: number; suggestions: AuditSuggestion[] } {
  const suggestions: AuditSuggestion[] = [];

  // 1. Nama Lengkap (10)
  const hasName = Boolean(cv.personal?.fullName && cv.personal.fullName.trim().length >= 3);
  suggestions.push({
    id: 'name',
    category: hasName ? 'strength' : 'critical',
    label: 'Nama Lengkap',
    description: hasName ? 'Nama lengkap sudah terisi.' : 'Isi nama lengkapmu yang jelas dan formal.',
    points: 10,
    completed: hasName,
    sectionTarget: 'sec-personal',
  });

  // 2. Email valid (8)
  const hasEmail = Boolean(cv.personal?.email && validateEmail(cv.personal.email));
  suggestions.push({
    id: 'email',
    category: hasEmail ? 'strength' : 'critical',
    label: 'Email Aktif',
    description: hasEmail ? 'Email format valid sudah terisi.' : 'Cantumkan alamat email aktif untuk dihubungi HR/instansi.',
    points: 8,
    completed: hasEmail,
    sectionTarget: 'sec-personal',
  });

  // 3. Telepon valid (7)
  const hasPhone = Boolean(cv.personal?.phone && validatePhone(cv.personal.phone));
  suggestions.push({
    id: 'phone',
    category: hasPhone ? 'strength' : 'critical',
    label: 'Nomor Telepon / WhatsApp',
    description: hasPhone ? 'Nomor telepon format Indonesia terisi.' : 'Cantumkan nomor telepon/WhatsApp yang aktif.',
    points: 7,
    completed: hasPhone,
    sectionTarget: 'sec-personal',
  });

  // 4. Headline satu fokus <= 60 karakter (5)
  const headlineLen = (cv.personal?.headline || '').trim().length;
  const hasHeadline = headlineLen >= 5 && headlineLen <= 60;
  suggestions.push({
    id: 'headline',
    category: hasHeadline ? 'strength' : 'improvement',
    label: 'Target Profesi / Headline Ringkas',
    description: hasHeadline
      ? 'Target profesi sudah fokus dan proporsional (≤ 60 karakter).'
      : 'Tentukan satu fokus peran (5-60 karakter, mis. "Junior Frontend Developer").',
    points: 5,
    completed: hasHeadline,
    sectionTarget: 'sec-personal',
  });

  // 5. Ringkasan 150-300 karakter (10)
  const summaryLen = (cv.personal?.summary || '').trim().length;
  const hasSummary = summaryLen >= 100 && summaryLen <= 350;
  suggestions.push({
    id: 'summary',
    category: hasSummary ? 'strength' : 'improvement',
    label: 'Tentang Saya (100 - 300 karakter)',
    description: hasSummary
      ? `Deskripsi diri proporsional (${summaryLen} karakter).`
      : 'Tulis ringkasan profil 2-3 kalimat yang menonjolkan minat dan keahlian utamamu.',
    points: 10,
    completed: hasSummary,
    sectionTarget: 'sec-personal',
  });

  // 6. Minimal 1 pendidikan lengkap (10)
  const hasEdu = Boolean(cv.education && cv.education.length > 0 && cv.education[0].school.trim());
  suggestions.push({
    id: 'edu',
    category: hasEdu ? 'strength' : 'critical',
    label: 'Riwayat Pendidikan',
    description: hasEdu ? 'Minimal 1 riwayat sekolah terisi.' : 'Tambahkan sekolahmu saat ini (SMK Telkom Purwokerto).',
    points: 10,
    completed: hasEdu,
    sectionTarget: 'sec-education',
  });

  // 7. Link GitHub / Portofolio (10)
  const hasGitOrPorto = Boolean(
    cv.personal?.links &&
      cv.personal.links.some((l: any) =>
        /github|gitlab|portfolio|portofolio|vercel|netlify/i.test(l.label + ' ' + l.url)
      )
  );
  suggestions.push({
    id: 'links',
    category: hasGitOrPorto ? 'strength' : 'improvement',
    label: 'Tautan GitHub atau Portofolio',
    description: hasGitOrPorto
      ? 'Tautan karya digital sudah terhubung.'
      : 'Siswa RPL sangat disarankan menyertakan tautan profil GitHub atau portofolio.',
    points: 10,
    completed: hasGitOrPorto,
    sectionTarget: 'sec-personal',
  });

  // 8. Minimal 1 proyek dengan >= 2 poin (15)
  const hasProjects = Boolean(
    cv.projects &&
      cv.projects.length > 0 &&
      cv.projects.some((p: any) => p.name.trim() && p.bullets && p.bullets.filter(Boolean).length >= 2)
  );
  suggestions.push({
    id: 'projects',
    category: hasProjects ? 'strength' : 'critical',
    label: 'Proyek Aplikasi / Sekolah',
    description: hasProjects
      ? 'Minimal 1 proyek dengan 2+ poin terisi.'
      : 'Tambahkan minimal 1 proyek aplikasi sekolah/mandiri lengkap dengan 2 poin deskripsi.',
    points: 15,
    completed: hasProjects,
    sectionTarget: 'sec-projects',
  });

  // 9. Minimal 1 pengalaman / organisasi (10)
  const hasExp = Boolean(cv.experience && cv.experience.length > 0 && cv.experience[0].organization.trim());
  suggestions.push({
    id: 'experience',
    category: hasExp ? 'strength' : 'improvement',
    label: 'Pengalaman / Organisasi',
    description: hasExp
      ? 'Pengalaman atau organisasi sekolah terisi.'
      : 'Tambahkan kepanitiaan, komunitas, ekskul, atau organisasi yang pernah kamu ikuti.',
    points: 10,
    completed: hasExp,
    sectionTarget: 'sec-experience',
  });

  // 10. Poin berisi angka/metrik pada >= 2 poin (10)
  let metricPointsCount = 0;
  const allBullets: string[] = [];
  (cv.experience || []).forEach((e: any) => allBullets.push(...(e.bullets || [])));
  (cv.projects || []).forEach((p: any) => allBullets.push(...(p.bullets || [])));
  (cv.custom || []).forEach((c: any) =>
    (c.entries || []).forEach((ce: any) => allBullets.push(...(ce.bullets || [])))
  );

  allBullets.forEach((bullet) => {
    if (/\d+[%+|/]?|\b(pertama|kedua|juara)\b/i.test(bullet)) {
      metricPointsCount++;
    }
  });
  const hasMetrics = metricPointsCount >= 2;
  suggestions.push({
    id: 'metrics',
    category: hasMetrics ? 'strength' : 'improvement',
    label: 'Penggunaan Angka & Hasil Konkret',
    description: hasMetrics
      ? `Bagus! Ditemukan ${metricPointsCount} poin yang memuat angka/hasil nyata.`
      : 'Sertakan angka nyata di poin deskripsimu (mis. "dipakai 12 kelas", "mengurangi waktu 50%").',
    points: 10,
    completed: hasMetrics,
    sectionTarget: 'sec-projects',
  });

  // 11. Keahlian >= 5 item (5)
  let totalSkills = 0;
  (cv.skills || []).forEach((cat: any) => {
    totalSkills += (cat.items || []).length;
  });
  const hasSkills = totalSkills >= 5;
  suggestions.push({
    id: 'skills',
    category: hasSkills ? 'strength' : 'improvement',
    label: 'Keahlian Teknis (Minimal 5 item)',
    description: hasSkills
      ? `Terdaftar ${totalSkills} keahlian.`
      : `Tambahkan minimal 5 keahlian (saat ini ${totalSkills}).`,
    points: 5,
    completed: hasSkills,
    sectionTarget: 'sec-skills',
  });

  const totalEarned = suggestions.reduce((acc, cur) => (cur.completed ? acc + cur.points : acc), 0);

  return {
    score: Math.min(100, totalEarned),
    suggestions,
  };
}
