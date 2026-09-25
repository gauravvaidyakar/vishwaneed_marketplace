import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface SmsProvider {
  send(recipient: string, message: string): Promise<string>;
}

/**
 * Provider boundary for transactional SMS. No vendor is selected until the
 * project has an approved SMS account and credentials, so production requests
 * fail closed instead of being reported as delivered by a simulator.
 */
@Injectable()
export class SmsProviderRouter implements SmsProvider {
  private readonly provider: string;

  constructor(config: ConfigService) {
    this.provider = config.get<string>("SMS_PROVIDER", "UNCONFIGURED").toUpperCase();
  }

  send(recipient: string, message: string): Promise<string> {
    void recipient;
    void message;
    const detail = this.provider === "UNCONFIGURED"
      ? "An SMS provider has not been configured"
      : `SMS provider ${this.provider} is not supported by this deployment`;
    throw new ServiceUnavailableException(detail);
  }
}
