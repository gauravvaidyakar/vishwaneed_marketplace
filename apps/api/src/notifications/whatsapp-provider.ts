import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface WhatsAppProvider {
  send(
    templateKey: string,
    recipient: string,
    payload: Record<string, unknown>,
  ): Promise<string>;
}

export class DevelopmentWhatsAppProvider implements WhatsAppProvider {
  send(templateKey: string, recipient: string): Promise<string> {
    return Promise.resolve(
      `DEV-WHATSAPP-${templateKey}-${recipient.slice(-4)}-${Date.now()}`,
    );
  }
}

export class InteraktWhatsAppProvider implements WhatsAppProvider {
  constructor(private readonly config: ConfigService) {}

  async send(
    templateKey: string,
    recipient: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const apiKey = this.config.get<string>("INTERAKT_API_KEY");
    const url = this.config.get<string>("INTERAKT_API_URL");
    if (!apiKey || !url) {
      throw new ServiceUnavailableException("Interakt is not configured");
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: recipient.replace(/^\+?91/, ""),
        type: "Template",
        template: {
          name: templateKey,
          languageCode: "en",
          bodyValues: Object.values(payload).map(String),
        },
      }),
    });
    const body: unknown = await response.json().catch(() => undefined);
    if (!response.ok || !body || typeof body !== "object") {
      throw new ServiceUnavailableException("Interakt delivery failed");
    }
    const result = body as Record<string, unknown>;
    const reference = result.id ?? result.result;
    if (typeof reference !== "string") {
      throw new ServiceUnavailableException("Invalid Interakt response");
    }
    return reference;
  }
}

@Injectable()
export class WhatsAppProviderRouter implements WhatsAppProvider {
  private readonly provider: WhatsAppProvider;

  constructor(config: ConfigService) {
    const configured = config.get<string>("WHATSAPP_PROVIDER");
    const production = config.get<string>("NODE_ENV") === "production";
    this.provider =
      configured === "INTERAKT" || (production && configured !== "DEVELOPMENT")
        ? new InteraktWhatsAppProvider(config)
        : new DevelopmentWhatsAppProvider();
  }

  send(
    templateKey: string,
    recipient: string,
    payload: Record<string, unknown>,
  ) {
    return this.provider.send(templateKey, recipient, payload);
  }
}
