import fs from 'fs/promises';
import path from 'path';

export interface StorageProvider {
  save(file: Buffer, filename: string, mimetype: string): Promise<string>;
  delete(url: string): Promise<void>;
  getUrl(filename: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor(uploadDir: string = path.join(process.cwd(), 'uploads')) {
    this.uploadDir = uploadDir;
  }

  async init() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async save(file: Buffer, filename: string, mimetype: string): Promise<string> {
    await this.init();
    const filePath = path.join(this.uploadDir, filename);
    await fs.writeFile(filePath, file);
    return this.getUrl(filename);
  }

  async delete(url: string): Promise<void> {
    const filename = path.basename(url);
    const filePath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }

  getUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}

// Export a singleton instance for local dev
export const storage = new LocalStorageProvider();
