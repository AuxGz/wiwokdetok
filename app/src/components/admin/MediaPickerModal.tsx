import React, { useState, useEffect } from "react";

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Pilih Gambar",
}) => {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");
  const [categories, setCategories] = useState<{ [category: string]: string[] }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingGallery, setLoadingGallery] = useState<boolean>(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGallery();
    }
  }, [isOpen]);

  const loadGallery = async () => {
    setLoadingGallery(true);
    setGalleryError(null);
    try {
      // Coba panggil /api/admin/media/gallery terlebih dahulu, jika gagal coba /api/admin/media
      let res = await fetch("/api/admin/media/gallery");
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/admin/media");
      }
      if (!res.ok) {
        throw new Error(`Gagal memuat galeri media (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      } else if (data.data && typeof data.data === "object") {
        setCategories(data.data);
      }
    } catch (err: any) {
      console.warn("Gagal memuat galeri dari API, mencoba fallback galeri lokal:", err);
      // Fallback fallback daftar kategori default agar admin tetap bisa memilih aset penting
      setCategories({
        berita: [
          "/images/berita/berita-prestasi.png",
          "/images/berita/berita-spmb.png",
          "/images/berita/berita-technopreneur.png",
        ],
        jurusan: [
          "/images/jurusan/siswa-pplg.png",
          "/images/jurusan/siswa-vr.png",
          "/images/jurusan/siswa-game.png",
          "/images/jurusan/siswa-tjkt.png",
        ],
        guru: [
          "/images/guru/kepala-sekolah.png",
          "/images/guru/Yogi S - Yogi S.jpg",
        ],
        mitra: [
          "/images/mitra/mitra-telkom.png",
          "/images/mitra/mitra-oracle.png",
          "/images/mitra/mitra-pln.png",
          "/images/mitra/mitra-cisco.png",
          "/images/mitra/mitra-mikrotik.png",
          "/images/mitra/mitra-redhat.png",
          "/images/mitra/mitra-aws.png",
        ],
        class3d: [
          "/images/class3d/RuangPG.jpg",
          "/images/class3d/RuangTJKT.jpg",
          "/images/class3d/RuangRobotik.jpg",
          "/images/class3d/RuangPodcast.jpg",
          "/images/class3d/Aula.jpg",
          "/images/class3d/Masjid.jpg",
          "/images/class3d/LapanganUpacara.jpg",
        ],
        kegiatan: [
          "/images/kegiatan/kegiatan-seni.png",
          "/images/kegiatan/kegiatan-basket.png",
          "/images/kegiatan/kegiatan-futsal.png",
          "/images/kegiatan/kegiatan-paskibra.png",
          "/images/kegiatan/kegiatan-pramuka.png",
          "/images/kegiatan/kegiatan-paduan-suara.png",
          "/images/kegiatan/extrakurikuler-banner.png",
        ],
        alumni: [
          "/images/alumni/alumni-khairudin.png",
          "/images/alumni/alumni-tenia.png",
          "/images/alumni/alumni-alfa.png",
          "/images/alumni/alumni-prariarga.png",
        ],
        brand: [
          "/images/brand/logo-telkom-schools.png",
          "/images/brand/gedung-sekolah.png",
        ],
      });
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Hanya berkas gambar (PNG, JPG, WEBP, SVG) yang diperbolehkan.");
        return;
      }
      setUploadFile(file);
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadPreview) {
      setUploadError("Silakan pilih berkas gambar terlebih dahulu.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Kirim via JSON base64 ke endpoint upload admin
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile.name,
          base64Data: uploadPreview,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload gagal dengan status HTTP ${res.status}`);
      }

      const data = await res.json();
      const uploadedUrl = data.url || data.imageUrl || data.data?.url;
      if (!uploadedUrl) {
        throw new Error("Respon server tidak memuat URL gambar yang diunggah.");
      }

      // Auto-select URL yang baru diunggah dan tutup modal
      onSelect(uploadedUrl);
      onClose();
      // Reset state upload
      setUploadFile(null);
      setUploadPreview(null);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  // Flatten and filter images
  const allImages: { url: string; category: string; name: string }[] = [];
  Object.entries(categories).forEach(([cat, urls]) => {
    urls.forEach((url) => {
      const parts = url.split("/");
      const name = parts[parts.length - 1] || url;
      allImages.push({ url, category: cat, name });
    });
  });

  const filteredImages = allImages.filter((img) => {
    const matchCategory = selectedCategory === "all" || img.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categoryKeys = ["all", ...Object.keys(categories)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E31E24] flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">{title}</h3>
              <p className="text-xs text-neutral-500">Pilih dari galeri foto sekolah atau unggah berkas baru</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
            title="Tutup dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="flex border-b border-neutral-200 px-6 pt-2 bg-white gap-2">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "gallery"
                ? "border-[#E31E24] text-[#E31E24]"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Galeri Foto</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
              {allImages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "upload"
                ? "border-[#E31E24] text-[#E31E24]"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload Foto Baru</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50">
          {activeTab === "gallery" ? (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Cari nama gambar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
                  />
                  <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Refresh Galeri */}
                <button
                  onClick={loadGallery}
                  disabled={loadingGallery}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${loadingGallery ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Segarkan</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 py-1">
                {categoryKeys.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                      selectedCategory === cat
                        ? "bg-[#E31E24] text-white shadow-sm"
                        : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {cat === "all" ? "Semua Kategori" : cat}
                    {cat !== "all" && categories[cat] && (
                      <span className="ml-1.5 opacity-75 text-[10px]">
                        ({categories[cat].length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Status & Grid Thumbnail */}
              {loadingGallery ? (
                <div className="py-20 text-center text-neutral-500">
                  <div className="inline-block w-8 h-8 border-4 border-neutral-300 border-t-[#E31E24] rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-medium">Memuat galeri foto...</p>
                </div>
              ) : galleryError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {galleryError}
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="py-16 text-center text-neutral-400">
                  <svg className="w-12 h-12 mx-auto mb-2 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-neutral-600">Tidak ada gambar yang cocok.</p>
                  <p className="text-xs text-neutral-400 mt-1">Coba ubah kata kunci pencarian atau kategori.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredImages.map((img) => (
                    <div
                      key={img.url}
                      onClick={() => {
                        onSelect(img.url);
                        onClose();
                      }}
                      className="group relative bg-white rounded-xl border border-neutral-200 hover:border-[#E31E24] hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                    >
                      <div className="aspect-square w-full bg-neutral-100 overflow-hidden relative">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback jika gambar rusak
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="px-2 py-1 rounded bg-[#E31E24] text-white text-[11px] font-bold shadow">
                            Pilih
                          </span>
                        </div>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-[11px] font-medium text-neutral-800 truncate" title={img.name}>
                          {img.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                          {img.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Upload Tab */
            <form onSubmit={handleUploadSubmit} className="max-w-xl mx-auto space-y-5 py-4">
              <div className="border-2 border-dashed border-neutral-300 hover:border-[#E31E24] rounded-2xl p-6 text-center bg-white transition-colors">
                <input
                  type="file"
                  id="image-upload-input"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-48 h-48 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-inner flex items-center justify-center">
                      <img
                        src={uploadPreview}
                        alt="Preview unggahan"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">{uploadFile?.name}</p>
                      <p className="text-xs text-neutral-500">
                        {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : ""}
                      </p>
                    </div>
                    <label
                      htmlFor="image-upload-input"
                      className="inline-block px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors"
                    >
                      Ganti Berkas
                    </label>
                  </div>
                ) : (
                  <label htmlFor="image-upload-input" className="cursor-pointer block space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-[#E31E24] flex items-center justify-center">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#E31E24] hover:underline">
                        Klik untuk memilih berkas
                      </span>
                      <span className="text-sm text-neutral-600"> atau seret ke area ini</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Format didukung: PNG, JPG, JPEG, WEBP, SVG (Maks. 5 MB)
                    </p>
                  </label>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E31E24] hover:bg-[#c9181e] text-white text-sm font-bold shadow-md shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Simpan & Gunakan Foto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-white border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Katalog media resmi SMK Telkom Purwokerto</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-neutral-600 hover:bg-neutral-100 font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
