import { Module } from "@nestjs/common";
import { ReturnsController } from "./returns.controller";
import { ReturnsService } from "./returns.service";
import { VendorsModule } from "../vendors/vendors.module";
@Module({
  imports: [VendorsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
