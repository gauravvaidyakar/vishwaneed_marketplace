import { Injectable } from "@nestjs/common";
import { NotificationStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { WhatsAppProviderRouter } from "./whatsapp-provider";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppProviderRouter,
  ) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async sendWhatsApp(
    userId: string,
    templateKey: string,
    payload: Record<string, unknown>,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mobile) return null;
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        channel: "WHATSAPP",
        templateKey,
        payload: payload as Prisma.InputJsonValue,
      },
    });
    try {
      const providerReference = await this.whatsapp.send(
        templateKey,
        user.mobile,
        payload,
      );
      return this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          providerReference,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          failureReason:
            error instanceof Error ? error.message : "Notification failed",
        },
      });
      return null;
    }
  }
}
