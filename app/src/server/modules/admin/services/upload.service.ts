import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface GalleryCategories {
  [category: string]: string[];
}

export interface UploadImageResult {
  url: string;
  filename: string;
  size: number;
}

/**
 * Membaca daftar galeri foto publik eksisting (hanya membaca, dilarang menghapus/menimpa).
 */
export async function getPublicImageGallery(): Promise<GalleryCategories> {
  const publicImagesDir = path.resolve(process.cwd(), "public/images");
  let folders: string[] = [];

  try {
    const entries = await fs.readdir(publicImagesDir, { withFileTypes: true });
    folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    folders = [];
  }

  const categories: GalleryCategories = {};

  for (const folder of folders) {
    try {
      const folderPath = path.join(publicImagesDir, folder);
      const files = await fs.readdir(folderPath);
      const imageFiles = files
        .filter((f) => /\.(png|jpe?g|webp|svg|gif)$/i.test(f))
        .map((f) => `/images/${folder}/${f}`);

      if (imageFiles.length > 0) {
        categories[folder] = imageFiles;
      }
    } catch {
      // Abaikan folder yang tidak bisa dibaca
    }
  }

  return categories;
}

/**
 * Menyimpan file gambar baru yang diunggah ke folder public/images/uploads/
 * Menggunakan nama berkas unik untuk mencegah penimpaan file yang ada.
 */
export async function saveUploadedImage(payload: {
  filename: string;
  base64Data?: string;
  buffer?: Buffer;
}): Promise<UploadImageResult> {
  const uploadsDir = path.resolve(process.cwd(), "public/images/uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  let buffer: Buffer;
  if (payload.buffer) {
    buffer = payload.buffer;
  } else if (payload.base64Data) {
    // Bersihkan header data URI jika ada (misal data:image/png;base64,...)
    const cleanBase64 = payload.base64Data.replace(/^data:image\/[a-z0-9+.-]+;base64,/i, "");
    buffer = Buffer.from(cleanBase64, "base64");
  } else {
    throw new Error("Data gambar (buffer atau base64Data) wajib disertakan.");
  }

  // Sanitasi ekstensi
  const ext = path.extname(payload.filename).toLowerCase();
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
  const finalExt = allowedExtensions.includes(ext) ? ext : ".png";

  // Bersihkan base nama file
  const baseName = path
    .basename(payload.filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  // Buat nama berkas unik: upload-[timestamp]-[randomHex]-[name].[ext]
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  const uniqueFilename = `upload-${timestamp}-${randomSuffix}-${baseName || "image"}${finalExt}`;
  const targetPath = path.join(uploadsDir, uniqueFilename);

  await fs.writeFile(targetPath, buffer);

  return {
    url: `/images/uploads/${uniqueFilename}`,
    filename: uniqueFilename,
    size: buffer.length,
  };
}
