type Environment = Record<string, string | undefined>;

export function validateEnvironment(input: Environment): Environment {
  const environment = input.NODE_ENV ?? "development";
  const required = [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "BANK_DATA_ENCRYPTION_KEY",
    "CORS_ORIGINS",
  ];
  const missing = required.filter((key) => !input[key]);
  if (missing.length > 0)
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  if (
    (input.JWT_ACCESS_SECRET?.length ?? 0) < 32 ||
    (input.JWT_REFRESH_SECRET?.length ?? 0) < 32
  ) {
    throw new Error("JWT secrets must each contain at least 32 characters");
  }
  if (!/^[a-fA-F0-9]{64}$/.test(input.BANK_DATA_ENCRYPTION_KEY ?? ""))
    throw new Error(
      "BANK_DATA_ENCRYPTION_KEY must be 64 hexadecimal characters",
    );
  if (environment === "production" && input.CORS_ORIGINS?.includes("*")) {
    throw new Error("Wildcard CORS is prohibited in production");
  }
  if (environment === "production") {
    const productionRequired = [
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
      "SHIPROCKET_EMAIL",
      "SHIPROCKET_PASSWORD",
      "SHIPROCKET_WEBHOOK_SECRET",
      "INTERAKT_API_KEY",
      "INTERAKT_API_URL",
    ];
    const missingProduction = productionRequired.filter((key) => !input[key]);
    if (missingProduction.length > 0) {
      throw new Error(
        `Missing production integrations: ${missingProduction.join(", ")}`,
      );
    }
  }
  return {
    ...input,
    NODE_ENV: environment,
    PORT: input.PORT ?? "4000",
    JWT_ACCESS_TTL: input.JWT_ACCESS_TTL ?? "15m",
    JWT_REFRESH_TTL: input.JWT_REFRESH_TTL ?? "30d",
    PRIVATE_UPLOAD_DIR: input.PRIVATE_UPLOAD_DIR ?? "./private-uploads",
    PUBLIC_UPLOAD_DIR: input.PUBLIC_UPLOAD_DIR ?? "./public-uploads",
    MAX_UPLOAD_BYTES: input.MAX_UPLOAD_BYTES ?? "5242880",
    SETTLEMENT_DAYS: input.SETTLEMENT_DAYS ?? "7",
    RETURN_WINDOW_DAYS: input.RETURN_WINDOW_DAYS ?? "7",
    CHECKOUT_QUOTE_TTL_MINUTES: input.CHECKOUT_QUOTE_TTL_MINUTES ?? "10",
    PASSWORD_RESET_TTL_MINUTES: input.PASSWORD_RESET_TTL_MINUTES ?? "30",
    CUSTOMER_WEB_URL: input.CUSTOMER_WEB_URL ?? "http://localhost:5173",
    SHIPPING_PROVIDER:
      input.SHIPPING_PROVIDER ??
      (environment === "production" ? "SHIPROCKET" : "DEVELOPMENT"),
    WHATSAPP_PROVIDER:
      input.WHATSAPP_PROVIDER ??
      (environment === "production" ? "INTERAKT" : "DEVELOPMENT"),
    DEV_SHIPPING_BASE_MINOR: input.DEV_SHIPPING_BASE_MINOR ?? "4000",
    DEV_SHIPPING_PER_KG_MINOR: input.DEV_SHIPPING_PER_KG_MINOR ?? "2000",
  };
}
