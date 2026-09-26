export const integrationSettingKeys = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "SHIPROCKET_EMAIL",
  "SHIPROCKET_PASSWORD",
  "SHIPROCKET_WEBHOOK_SECRET",
  "INTERAKT_API_KEY",
  "MSG91_AUTH_KEY",
  "MSG91_OTP_TEMPLATE_ID",
] as const;

export type IntegrationSettingKey = (typeof integrationSettingKeys)[number];

export const integrationSettingMetadata: Record<
  IntegrationSettingKey,
  { provider: "RAZORPAY" | "SHIPROCKET" | "INTERAKT" | "MSG91"; label: string; secret: boolean }
> = {
  RAZORPAY_KEY_ID: { provider: "RAZORPAY", label: "Key ID", secret: false },
  RAZORPAY_KEY_SECRET: { provider: "RAZORPAY", label: "Key secret", secret: true },
  RAZORPAY_WEBHOOK_SECRET: { provider: "RAZORPAY", label: "Webhook secret", secret: true },
  SHIPROCKET_EMAIL: { provider: "SHIPROCKET", label: "Account email", secret: false },
  SHIPROCKET_PASSWORD: { provider: "SHIPROCKET", label: "Account password", secret: true },
  SHIPROCKET_WEBHOOK_SECRET: { provider: "SHIPROCKET", label: "Webhook secret", secret: true },
  INTERAKT_API_KEY: { provider: "INTERAKT", label: "API key", secret: true },
  MSG91_AUTH_KEY: { provider: "MSG91", label: "Auth key", secret: true },
  MSG91_OTP_TEMPLATE_ID: {
    provider: "MSG91",
    label: "OTP template ID",
    secret: false,
  },
};

export function isIntegrationSettingKey(value: string): value is IntegrationSettingKey {
  return integrationSettingKeys.includes(value as IntegrationSettingKey);
}
