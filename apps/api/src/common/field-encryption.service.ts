import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, randomBytes } from "node:crypto";

@Injectable()
export class FieldEncryptionService {
  private readonly key: Buffer;
  constructor(config: ConfigService) {
    this.key = Buffer.from(
      config.getOrThrow<string>("BANK_DATA_ENCRYPTION_KEY"),
      "hex",
    );
  }
  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
  }
}
