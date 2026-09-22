import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CategoryImageStorageService } from "./category-image-storage.service";
import type { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";

const categoryResponseSelect = {
  id: true,
  parentId: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: CategoryImageStorageService,
  ) {}
  list() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        parentId: true,
      },
    });
  }
  adminList() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: categoryResponseSelect,
    });
  }
  async get(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { OR: [{ id }, { slug: id }], isActive: true },
      select: categoryResponseSelect,
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }
  create(input: CreateCategoryDto) {
    return this.prisma.category.create({
      data: input,
      select: categoryResponseSelect,
    });
  }
  async update(id: string, input: UpdateCategoryDto) {
    await this.requireAny(id);
    return this.prisma.category.update({
      where: { id },
      data: input,
      select: categoryResponseSelect,
    });
  }
  async uploadImage(id: string, file?: Express.Multer.File) {
    const category = await this.requireAny(id);
    const optimized = await this.images.optimize(file);
    const imageUrl = this.images.publicUrl(id, optimized.digest);
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        imageUrl,
        imageData: optimized.bytes,
        imageMimeType: optimized.mimeType,
      },
      select: categoryResponseSelect,
    });
    await this.images.removeLegacyUrl(category.imageUrl);
    return updated;
  }
  async removeImage(id: string) {
    const category = await this.requireAny(id);
    const updated = await this.prisma.category.update({
      where: { id },
      data: { imageUrl: null, imageData: null, imageMimeType: null },
      select: categoryResponseSelect,
    });
    await this.images.removeLegacyUrl(category.imageUrl);
    return updated;
  }
  async readImage(filename: string) {
    const categoryId = this.images.categoryIdFromPersistentFilename(filename);
    if (!categoryId) return this.images.readLegacy(filename);
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { imageUrl: true, imageData: true, imageMimeType: true },
    });
    if (
      !category?.imageData ||
      !category.imageMimeType ||
      category.imageUrl !== `/api/v1/category-images/${filename}`
    ) {
      throw new NotFoundException("Category image not found");
    }
    return {
      bytes: Buffer.from(category.imageData),
      mimeType: category.imageMimeType,
    };
  }
  private async requireAny(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }
}
