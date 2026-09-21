import { Module } from "@nestjs/common";
import {
  ShipmentsController,
  ShipmentWebhooksController,
} from "./shipments.controller";
import { ShippingService, ShipmentsService } from "./shipments.service";
@Module({
  controllers: [ShipmentsController, ShipmentWebhooksController],
  providers: [ShippingService, ShipmentsService],
  exports: [ShippingService, ShipmentsService],
})
export class ShipmentsModule {}
