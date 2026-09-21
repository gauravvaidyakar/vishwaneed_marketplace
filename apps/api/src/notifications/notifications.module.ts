import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { WhatsAppProviderRouter } from "./whatsapp-provider";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WhatsAppProviderRouter],
  exports: [NotificationsService],
})
export class NotificationsModule {}
