import { Module } from "@nestjs/common";
import { RazorpayPaymentProvider } from "./payment-provider";
import {
  PaymentsController,
  PaymentWebhooksController,
} from "./payments.controller";
import { PaymentsService } from "./payments.service";
@Module({
  controllers: [PaymentsController, PaymentWebhooksController],
  providers: [PaymentsService, RazorpayPaymentProvider],
  exports: [PaymentsService, RazorpayPaymentProvider],
})
export class PaymentsModule {}
