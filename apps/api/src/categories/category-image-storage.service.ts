import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const ALLOWED_IMAGE_EXTENSIONS = new Map<string, ReadonlySet<string>>([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
]);

@Injectable()
export class CategoryImageStorageService {
  constructor(private readonly config: ConfigService) {}

  async store(file?: Express.Multer.File): Promise<{ key: string; url: string }> {
    if (!file) throw new BadRequestException("Category image is required");
    const extension = extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.get(file.mimetype)?.has(extension)) {
      throw new BadRequestException(
        "Only matching JPG, JPEG, PNG or WEBP images are accepted",
      );
    }
    const maxBytes = Number(
      this.config.get<string>("MAX_UPLOAD_BYTES", "5242880"),
    );
    if (!Number.isFinite(maxBytes) || maxBytes <= 0 || file.size > maxBytes) {
      throw new BadRequestException(
        `Category image must not exceed ${Number.isFinite(maxBytes) ? maxBytes : 5_242_880} bytes`,
      );
    }
    const directory = resolve(this.root(), "categories");
    await mkdir(directory, { recursive: true });
    const key = `categories/${randomUUID()}${extension}`;
    await writeFile(this.absolute(key), file.buffer, { flag: "wx" });
    return { key, url: `/api/v1/category-images/${key.split("/")[1]}` };
  }

  async read(filename: string): Promise<{ bytes: Buffer; mimeType: string }> {
    if (!/^[0-9a-f-]+\.(?:jpe?g|png|webp)$/i.test(filename)) {
      throw new NotFoundException("Category image not found");
    }
    const extension = extname(filename).toLowerCase();
    const mimeType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
    try {
      return { bytes: await readFile(this.absolute(`categories/${filename}`)), mimeType };
    } catch {
      throw new NotFoundException("Category image not found");
    }
  }

  async removeManagedUrl(url?: string | null): Promise<void> {
    const filename = url?.match(/\/category-images\/([^/?#]+)$/)?.[1];
    if (!filename) return;
    try {
      await unlink(this.absolute(`categories/${filename}`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  private root(): string {
    return resolve(this.config.get<string>("PUBLIC_UPLOAD_DIR", "./public-uploads"));
  }

  private absolute(key: string): string {
    const root = this.root();
    const absolute = resolve(root, key);
    if (!absolute.startsWith(`${root}${sep}`)) {
      throw new BadRequestException("Invalid category image path");
    }
    return absolute;
  }
}
