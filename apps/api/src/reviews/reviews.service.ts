import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, ReviewStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { CreateReviewDto } from "./reviews.dto";
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, productId: string, input: CreateReviewDto) {
    const item = await this.prisma.orderItem.findFirst({
      where: {
        id: input.orderItemId,
        productId,
        vendorOrder: { masterOrder: { customer: { userId } } },
      },
      include: {
        vendorOrder: {
          include: { masterOrder: { include: { customer: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException("Purchased order item not found");
    if (item.status !== OrderStatus.DELIVERED)
      throw new BadRequestException("Only delivered products can be reviewed");
    const review = await this.prisma.review.create({
      data: {
        customerId: item.vendorOrder.masterOrder.customer.id,
        productId,
        orderItemId: item.id,
        rating: input.rating,
        comment: input.comment,
        status: ReviewStatus.PENDING,
      },
    });
    return this.present(review);
  }
  async public(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, status: ReviewStatus.PUBLISHED },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        customer: { select: { firstName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: review.customer.firstName,
      submittedAt: review.createdAt.toISOString(),
    }));
  }

  adminList() {
    return this.prisma.review.findMany({
      include: { customer: true, product: true, orderItem: true },
      orderBy: { createdAt: "desc" },
    });
  }

  vendorList(userId: string) {
    return this.prisma.review.findMany({
      where: { product: { vendor: { userId } } },
      select: {
        id: true, rating: true, comment: true, status: true, createdAt: true,
        product: { select: { id: true, name: true } },
        customer: { select: { firstName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  moderate(id: string, status: ReviewStatus) {
    if (status === ReviewStatus.PENDING) {
      throw new BadRequestException(
        "Moderation must publish or reject a review",
      );
    }
    return this.prisma.review.update({ where: { id }, data: { status } });
  }

  private present(review: {
    id: string;
    productId: string;
    orderItemId: string;
    rating: number;
    comment: string;
    status: ReviewStatus;
    createdAt: Date;
  }) {
    return {
      id: review.id,
      productId: review.productId,
      orderItemId: review.orderItemId,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      submittedAt: review.createdAt.toISOString(),
    };
  }
}
