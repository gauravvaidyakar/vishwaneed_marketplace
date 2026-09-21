import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { WhatsAppProviderRouter } from "./whatsapp-provider";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppProviderRouter,
    private readonly config: ConfigService,
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
    dedupeKey?: string,
  ) {
    let notificationId: string | undefined;
    try {
      let existing;
      if (dedupeKey) {
        existing = await this.prisma.notification.findUnique({
          where: { dedupeKey },
        });
        if (existing?.status === NotificationStatus.SENT) return existing;
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { vendor: { select: { businessMobile: true } } },
      });
      if (!user) return null;
      const recipient = user.mobile ?? user.vendor?.businessMobile;
      const notificationData = {
        userId,
        dedupeKey,
        channel: "WHATSAPP",
        templateKey,
        payload: payload as Prisma.InputJsonValue,
        status: recipient
          ? NotificationStatus.QUEUED
          : NotificationStatus.FAILED,
        failureReason: recipient
          ? null
          : "No mobile number is configured for this account",
      };
      const notification = existing
        ? await this.prisma.notification.update({
            where: { id: existing.id },
            data: notificationData,
          })
        : await this.prisma.notification.create({ data: notificationData });
      notificationId = notification.id;
      if (!recipient) return notification;
      const providerTemplate = this.config.get<string>(
        `WHATSAPP_TEMPLATE_${templateKey.toUpperCase()}`,
        templateKey,
      );
      const providerReference = await this.whatsapp.send(
        providerTemplate,
        recipient,
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
      const message = error instanceof Error ? error.message : "Notification failed";
      this.logger.error(`WhatsApp notification ${templateKey} failed: ${message}`);
      if (notificationId || dedupeKey) {
        await this.prisma.notification.updateMany({
          where: notificationId ? { id: notificationId } : { dedupeKey },
          data: { status: NotificationStatus.FAILED, failureReason: message },
        }).catch(() => undefined);
      }
      return null;
    }
  }

  async notifyOrderPlaced(masterOrderId: string): Promise<void> {
    const order = await this.prisma.masterOrder.findUnique({
      where: { id: masterOrderId },
      include: {
        customer: { select: { userId: true } },
        vendorOrders: {
          include: {
            vendor: { select: { userId: true, businessName: true } },
            _count: { select: { items: true } },
          },
        },
      },
    });
    if (!order) return;
    await Promise.allSettled([
      this.sendWhatsApp(
        order.customer.userId,
        "order_confirmation",
        {
          orderNumber: order.orderNumber,
          amount: order.payableTotal.toString(),
          paymentMethod: order.paymentMethod,
          vendorCount: order.vendorOrders.length,
        },
        `order:${order.id}:customer:placed`,
      ),
      ...order.vendorOrders.map((vendorOrder) =>
        this.sendWhatsApp(
          vendorOrder.vendor.userId,
          "vendor_new_order",
          {
            vendorOrderNumber: vendorOrder.vendorOrderNumber,
            masterOrderNumber: order.orderNumber,
            amount: vendorOrder.orderTotal.toString(),
            itemCount: vendorOrder._count.items,
            paymentMethod: order.paymentMethod,
          },
          `vendor-order:${vendorOrder.id}:vendor:placed`,
        ),
      ),
    ]);
  }

  async notifyVendorOrderStatus(
    vendorOrderId: string,
    status: string,
  ): Promise<void> {
    const order = await this.orderRecipients(vendorOrderId);
    if (!order) return;
    const statusKey = status.toLowerCase();
    await Promise.allSettled([
      this.sendWhatsApp(
        order.masterOrder.customer.userId,
        `order_${statusKey}`,
        {
          orderNumber: order.masterOrder.orderNumber,
          vendorOrderNumber: order.vendorOrderNumber,
          vendorName: order.vendor.businessName,
          status,
        },
        `vendor-order:${order.id}:customer:status:${status}`,
      ),
      this.sendWhatsApp(
        order.vendor.userId,
        "vendor_order_status_update",
        {
          vendorOrderNumber: order.vendorOrderNumber,
          masterOrderNumber: order.masterOrder.orderNumber,
          status,
        },
        `vendor-order:${order.id}:vendor:status:${status}`,
      ),
    ]);
  }

  async notifyItemCancelled(
    itemId: string,
    changedBy: "CUSTOMER" | "VENDOR",
  ): Promise<void> {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        vendorOrder: {
          include: {
            vendor: { select: { userId: true, businessName: true } },
            masterOrder: {
              include: { customer: { select: { userId: true } } },
            },
          },
        },
      },
    });
    if (!item) return;
    const common = {
      orderNumber: item.vendorOrder.masterOrder.orderNumber,
      vendorOrderNumber: item.vendorOrder.vendorOrderNumber,
      productName: item.productName,
      quantity: item.quantity,
      changedBy,
    };
    await Promise.allSettled([
      this.sendWhatsApp(
        item.vendorOrder.masterOrder.customer.userId,
        "order_item_cancelled",
        common,
        `order-item:${item.id}:customer:cancelled`,
      ),
      this.sendWhatsApp(
        item.vendorOrder.vendor.userId,
        "vendor_item_cancelled",
        common,
        `order-item:${item.id}:vendor:cancelled`,
      ),
    ]);
  }

  async notifyPaymentStatus(masterOrderId: string, status: string): Promise<void> {
    const order = await this.prisma.masterOrder.findUnique({
      where: { id: masterOrderId },
      include: {
        customer: { select: { userId: true } },
        vendorOrders: { include: { vendor: { select: { userId: true } } } },
      },
    });
    if (!order) return;
    const template = status === "PAID" ? "payment_confirmation" : "payment_failed";
    const payload = {
      orderNumber: order.orderNumber,
      amount: order.payableTotal.toString(),
      status,
    };
    await Promise.allSettled([
      this.sendWhatsApp(order.customer.userId, template, payload, `order:${order.id}:customer:payment:${status}`),
      ...order.vendorOrders.map((vendorOrder) =>
        this.sendWhatsApp(
          vendorOrder.vendor.userId,
          "vendor_payment_status",
          payload,
          `order:${order.id}:vendor:${vendorOrder.id}:payment:${status}`,
        ),
      ),
    ]);
  }

  async notifyShipmentStatus(
    vendorOrderId: string,
    status: string,
    details: { awb?: string | null; trackingUrl?: string | null } = {},
  ): Promise<void> {
    const order = await this.orderRecipients(vendorOrderId);
    if (!order) return;
    const payload = {
      orderNumber: order.masterOrder.orderNumber,
      vendorOrderNumber: order.vendorOrderNumber,
      vendorName: order.vendor.businessName,
      status,
      awb: details.awb ?? "",
      trackingUrl: details.trackingUrl ?? "",
    };
    await Promise.allSettled([
      this.sendWhatsApp(
        order.masterOrder.customer.userId,
        `shipment_${status.toLowerCase()}`,
        payload,
        `vendor-order:${order.id}:customer:shipment:${status}`,
      ),
      this.sendWhatsApp(
        order.vendor.userId,
        "vendor_shipment_status",
        payload,
        `vendor-order:${order.id}:vendor:shipment:${status}`,
      ),
    ]);
  }

  async notifyReturnStatus(
    returnRequestId: string,
    status: string,
  ): Promise<void> {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        customer: { select: { userId: true } },
        orderItem: {
          include: {
            vendorOrder: {
              include: {
                vendor: { select: { userId: true } },
                masterOrder: { select: { orderNumber: true } },
              },
            },
          },
        },
      },
    });
    if (!request) return;
    const payload = {
      orderNumber: request.orderItem.vendorOrder.masterOrder.orderNumber,
      productName: request.orderItem.productName,
      resolution: request.resolution,
      status,
    };
    await Promise.allSettled([
      this.sendWhatsApp(
        request.customer.userId,
        "return_status_update",
        payload,
        `return:${request.id}:customer:${status}`,
      ),
      this.sendWhatsApp(
        request.orderItem.vendorOrder.vendor.userId,
        status === "REQUESTED" ? "vendor_return_requested" : "vendor_return_status",
        payload,
        `return:${request.id}:vendor:${status}`,
      ),
    ]);
  }

  private orderRecipients(vendorOrderId: string) {
    return this.prisma.vendorOrder.findUnique({
      where: { id: vendorOrderId },
      include: {
        vendor: { select: { userId: true, businessName: true } },
        masterOrder: {
          include: { customer: { select: { userId: true } } },
        },
      },
    });
  }
}
