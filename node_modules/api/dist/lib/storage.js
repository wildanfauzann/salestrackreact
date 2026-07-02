import fs from 'fs/promises';
import path from 'path';
export class LocalStorageProvider {
    uploadDir;
    constructor(uploadDir = path.join(process.cwd(), 'uploads')) {
        this.uploadDir = uploadDir;
    }
    async init() {
        await fs.mkdir(this.uploadDir, { recursive: true });
    }
    async save(file, filename, mimetype) {
        await this.init();
        const filePath = path.join(this.uploadDir, filename);
        await fs.writeFile(filePath, file);
        return this.getUrl(filename);
    }
    async delete(url) {
        const filename = path.basename(url);
        const filePath = path.join(this.uploadDir, filename);
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            console.error(`Failed to delete file ${filePath}:`, error);
        }
    }
    getUrl(filename) {
        return `/uploads/${filename}`;
    }
}
// Export a singleton instance for local dev
export const storage = new LocalStorageProvider();
