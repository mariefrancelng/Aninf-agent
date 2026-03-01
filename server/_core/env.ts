export const ENV = {
  // Auth (session JWT)
  cookieSecret: process.env.JWT_SECRET ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  // Firebase Admin
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",
  // LLM / API
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Email SMTP
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: process.env.SMTP_PORT ?? "587",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "",
  smtpSecure: process.env.SMTP_SECURE ?? "false",
  // App
  appUrl: process.env.APP_URL ?? "https://example.com",
  isProduction: process.env.NODE_ENV === "production",
};
