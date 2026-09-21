import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CategoryImageStorageService } from "./category-image-storage.service";
import type { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";

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
    });
  }
  async get(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { OR: [{ id }, { slug: id }], isActive: true },
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }
  create(input: CreateCategoryDto) {
    return this.prisma.category.create({ data: input });
  }
  async update(id: string, input: UpdateCategoryDto) {
    await this.requireAny(id);
    return this.prisma.category.update({ where: { id }, data: input });
  }
  async uploadImage(id: string, file?: Express.Multer.File) {
    const category = await this.requireAny(id);
    const stored = await this.images.store(file);
    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: { imageUrl: stored.url },
      });
      await this.images.removeManagedUrl(category.imageUrl);
      return updated;
    } catch (error) {
      await this.images.removeManagedUrl(stored.url);
      throw error;
    }
  }
  async removeImage(id: string) {
    const category = await this.requireAny(id);
    const updated = await this.prisma.category.update({
      where: { id },
      data: { imageUrl: null },
    });
    await this.images.removeManagedUrl(category.imageUrl);
    return updated;
  }
  readImage(filename: string) {
    return this.images.read(filename);
  }
  private async requireAny(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }
}
