import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ProductStatus, VendorStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { VendorsService } from "../vendors/vendors.service";
import type {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from "./products.dto";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendors: VendorsService,
  ) {}

  async publicList(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.APPROVED,
      vendor: { status: VendorStatus.APPROVED },
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.category
        ? {
            category: {
              OR: [{ id: query.category }, { slug: query.category }],
            },
          }
        : {}),
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.productType ? { productType: query.productType } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { price: { gte: query.minPrice, lte: query.maxPrice } }
        : {}),
      ...(query.available
        ? { inventory: { is: { quantity: { gt: 0 } } } }
        : {}),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === "PRICE_ASC"
        ? { price: "asc" }
        : query.sort === "PRICE_DESC"
          ? { price: "desc" }
          : query.sort === "POPULAR"
            ? { orderItems: { _count: "desc" } }
            : { createdAt: "desc" };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: this.publicInclude(),
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: items.map((item) => this.toPublic(item)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async publicGet(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        status: ProductStatus.APPROVED,
        vendor: { status: VendorStatus.APPROVED },
      },
      include: this.publicInclude(),
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.toPublic(product);
  }

  async vendorList(userId: string, query: ProductQueryDto) {
    const vendorId = await this.vendors.getVendorId(userId);
    const where = {
      vendorId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true, images: true, inventory: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async create(userId: string, input: CreateProductDto) {
    const vendor = await this.vendors.getByUser(userId);
    if (vendor.status !== VendorStatus.APPROVED)
      throw new ForbiddenException("Only approved vendors can create products");
    if (input.mrp !== undefined && input.mrp < input.price)
      throw new BadRequestException(
        "MRP cannot be lower than the selling price",
      );
    const slug = `${input.name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${randomBytes(3).toString("hex")}`;
    const { images, stock, specifications, ...data } = input;
    return this.prisma.$transaction(async (tx) =>
      tx.product.create({
        data: {
          ...data,
          price: new Prisma.Decimal(input.price),
          mrp:
            input.mrp === undefined ? undefined : new Prisma.Decimal(input.mrp),
          gstRate: new Prisma.Decimal(input.gstRate),
          lengthCm:
            input.lengthCm === undefined
              ? undefined
              : new Prisma.Decimal(input.lengthCm),
          widthCm:
            input.widthCm === undefined
              ? undefined
              : new Prisma.Decimal(input.widthCm),
          heightCm:
            input.heightCm === undefined
              ? undefined
              : new Prisma.Decimal(input.heightCm),
          specifications: specifications,
          slug,
          vendorId: vendor.id,
          images: {
            create: images.map((url, sortOrder) => ({ url, sortOrder })),
          },
          inventory: {
            create: {
              quantity: stock,
              transactions: {
                create: {
                  type: "INITIAL_STOCK",
                  quantity: stock,
                  balanceAfter: stock,
                  notes: "Initial stock from product creation",
                },
              },
            },
          },
        },
        include: { images: true, inventory: true },
      }),
    );
  }

  async getOwned(userId: string, id: string) {
    const vendorId = await this.vendors.getVendorId(userId);
    const product = await this.prisma.product.findFirst({
      where: { id, vendorId },
      include: { category: true, images: true, inventory: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async update(userId: string, id: string, input: UpdateProductDto) {
    const current = await this.getOwned(userId, id);
    if (
      current.status !== ProductStatus.DRAFT &&
      current.status !== ProductStatus.REJECTED
    )
      throw new BadRequestException(
        "Only draft or rejected products can be edited",
      );
    const { images, specifications, ...data } = input;
    return this.prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: images.map((url, sortOrder) => ({
            productId: id,
            url,
            sortOrder,
          })),
        });
      }
      return tx.product.update({
        where: { id },
        data: {
          ...data,
          specifications: specifications,
          rejectionReason: null,
        },
        include: { images: true, inventory: true },
      });
    });
  }

  async submit(userId: string, id: string) {
    const product = await this.getOwned(userId, id);
    if (
      product.status !== ProductStatus.DRAFT &&
      product.status !== ProductStatus.REJECTED
    )
      throw new BadRequestException(
        "Product cannot be submitted in its current state",
      );
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.PENDING_APPROVAL, rejectionReason: null },
    });
  }
  async archive(userId: string, id: string) {
    await this.getOwned(userId, id);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
  }

  private publicInclude() {
    return {
      category: true,
      vendor: {
        include: {
          _count: {
            select: {
              products: { where: { status: ProductStatus.APPROVED } },
            },
          },
        },
      },
      images: { orderBy: { sortOrder: "asc" as const } },
      inventory: true,
      reviews: {
        where: { status: "PUBLISHED" as const },
        select: { rating: true },
      },
    };
  }
  private toPublic(
    product: Awaited<ReturnType<ProductsService["fetchPublicShape"]>>,
  ) {
    const available = Math.max(
      0,
      (product.inventory?.quantity ?? 0) - (product.inventory?.reserved ?? 0),
    );
    const ratings = product.reviews.map((review) => review.rating);
    const rating = ratings.length
      ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
      : 0;
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      productType: product.productType,
      vendor: {
        id: product.vendor.id,
        name: product.vendor.businessName,
        location: product.vendor.pickupPincode ?? "",
        rating: 0,
        productCount: product.vendor._count.products,
      },
      price: { amount: product.price.toNumber(), currency: "INR" },
      mrp: product.mrp
        ? { amount: product.mrp.toNumber(), currency: "INR" }
        : undefined,
      gstInclusive: true,
      weight: `${product.weightGrams} g`,
      dimensions:
        product.lengthCm || product.widthCm || product.heightCm
          ? {
              lengthCm: product.lengthCm?.toNumber(),
              widthCm: product.widthCm?.toNumber(),
              heightCm: product.heightCm?.toNumber(),
            }
          : undefined,
      description: product.description,
      ingredients: product.ingredients
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      specifications: product.specifications ?? {},
      images: product.images.map((image) => image.url),
      stockStatus:
        available === 0
          ? "OUT_OF_STOCK"
          : available <= (product.inventory?.lowStockThreshold ?? 5)
            ? "LOW_STOCK"
            : "IN_STOCK",
      availableQuantity: available,
      rating,
      reviewCount: ratings.length,
      featured: false,
      bestSeller: false,
    };
  }
  private fetchPublicShape() {
    return this.prisma.product.findFirstOrThrow({
      include: this.publicInclude(),
    });
  }
}
