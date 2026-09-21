import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CategoryImageStorageService } from "../src/categories/category-image-storage.service";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

async function storage(maxBytes = "5242880") {
  const directory = await mkdtemp(join(tmpdir(), "vishwaneed-category-images-"));
  createdDirectories.push(directory);
  const config = {
    get: (key: string, fallback: string) =>
      key === "PUBLIC_UPLOAD_DIR"
        ? directory
        : key === "MAX_UPLOAD_BYTES"
          ? maxBytes
          : fallback,
  } as ConfigService;
  return new CategoryImageStorageService(config);
}

function imageFile(
  originalname: string,
  mimetype: string,
  bytes = Buffer.from("image"),
): Express.Multer.File {
  return {
    fieldname: "file",
    originalname,
    encoding: "7bit",
    mimetype,
    size: bytes.length,
    buffer: bytes,
    destination: "",
    filename: "",
    path: "",
    stream: null as never,
  };
}

describe("category image storage", () => {
  it("stores, serves and removes a supported public category image", async () => {
    const service = await storage();
    const stored = await service.store(imageFile("millets.webp", "image/webp"));
    expect(stored.url).toMatch(/^\/api\/v1\/category-images\/[\w-]+\.webp$/);
    const filename = stored.url.split("/").at(-1)!;
    const served = await service.read(filename);
    expect(served.mimeType).toBe("image/webp");
    expect(served.bytes.toString()).toBe("image");
    await service.removeManagedUrl(stored.url);
    await expect(service.read(filename)).rejects.toThrow("Category image not found");
  });

  it("rejects a MIME type and extension mismatch", async () => {
    const service = await storage();
    await expect(
      service.store(imageFile("not-an-image.pdf", "image/png")),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects an oversized image", async () => {
    const service = await storage("4");
    await expect(
      service.store(imageFile("large.jpg", "image/jpeg", Buffer.alloc(5))),
    ).rejects.toThrow("must not exceed 4 bytes");
  });
});
