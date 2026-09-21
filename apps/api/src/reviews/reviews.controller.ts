import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import type { RequestUser } from "../common/request-user";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { CreateReviewDto, ModerateReviewDto } from "./reviews.dto";
import { ReviewsService } from "./reviews.service";
@ApiTags("Reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}
  @Get("products/:productId/reviews") list(
    @Param("productId", ParseUUIDPipe) i: string,
  ) {
    return this.reviews.public(i);
  }
  @Post("products/:productId/reviews")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  create(
    @CurrentUser() u: RequestUser,
    @Param("productId", ParseUUIDPipe) i: string,
    @Body() b: CreateReviewDto,
  ) {
    return this.reviews.create(u.id, i, b);
  }

  @Get("admin/reviews")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminList() {
    return this.reviews.adminList();
  }
  @Get("vendor/reviews")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  vendorList(@CurrentUser() user: RequestUser) {
    return this.reviews.vendorList(user.id);
  }

  @Post("admin/reviews/:id/moderate")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  moderate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ModerateReviewDto,
  ) {
    return this.reviews.moderate(id, input.status);
  }
}
