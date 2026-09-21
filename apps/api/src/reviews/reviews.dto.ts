import { Type } from "class-transformer";
import { IsInt, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { IsEnum } from "class-validator";
import { ReviewStatus } from "@prisma/client";
export class CreateReviewDto {
  @IsUUID() orderItemId!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) rating!: number;
  @IsString() @MaxLength(2000) comment!: string;
}

export class ModerateReviewDto {
  @IsEnum(ReviewStatus) status!: ReviewStatus;
}
