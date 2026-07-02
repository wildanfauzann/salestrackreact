import fs from 'fs/promises';
import path from 'path';

export interface StorageProvider {
  save(file: Buffer, filename: string, mimetype: string): Promise<string>;
  delete(url: string): Promise<void>;
  getUrl(filename: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  async save(file: Buffer, filename: string, mimetype: string): Promise<string> {
    // Di Vercel, kita tidak bisa menyimpan file ke disk (/var/task/uploads)
    // Solusi tercepat tanpa setup AWS S3 / Supabase Storage adalah
    // mengkonversi file langsung menjadi Base64 Data URI string.
    const base64 = file.toString('base64');
    return `data:${mimetype};base64,${base64}`;
  }

  async delete(url: string): Promise<void> {
    // Tidak ada yang perlu dihapus dari disk karena base64 disimpan di database
  }

  getUrl(filename: string): string {
    return filename; // Tidak digunakan dalam base64 provider
  }
}

// Export a singleton instance
export const storage = new LocalStorageProvider();
