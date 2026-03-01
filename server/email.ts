import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

/**
 * Initialize email transporter
 * Uses SMTP configuration from environment variables
 */
function getTransporter() {
  if (transporter) return transporter;

  // Check if SMTP is configured
  if (!ENV.smtpHost || !ENV.smtpPort || !ENV.smtpUser || !ENV.smtpPass) {
    console.warn("[Email] SMTP not configured. Email sending disabled.");
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: parseInt(ENV.smtpPort),
      secure: ENV.smtpSecure === "true", // true for 465, false for other ports
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });

    console.log("[Email] SMTP transporter initialized");
  } catch (error) {
    console.error("[Email] Failed to initialize transporter:", error);
    return null;
  }

  return transporter;
}

/**
 * Send email with HTML content
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  replyTo?: string
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[Email] Cannot send email: SMTP not configured");
    return false;
  }

  try {
    await transport.sendMail({
      from: ENV.smtpFrom || ENV.smtpUser,
      to,
      subject,
      html: htmlContent,
      replyTo: replyTo || ENV.smtpFrom,
    });

    console.log(`[Email] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send email to ${to}:`, error);
    return false;
  }
}

/**
 * Generate HTML email template for weekly summary
 */
export function generateWeeklySummaryEmailTemplate(
  summary: string,
  articlesCount: number,
  weekStartDate: Date,
  weekEndDate: Date,
  articles: Array<{
    title: string;
    url: string;
    source: string;
    excerpt?: string;
    publishedAt?: Date;
  }>
): string {
  const weekStart = weekStartDate.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekEnd = weekEndDate.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const articlesHtml = articles
    .map(
      (article) => `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc; border-radius: 4px;">
      <h4 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 16px;">
        <a href="${article.url}" style="color: #0066cc; text-decoration: none;">
          ${article.title}
        </a>
      </h4>
      <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">
        <strong>Source:</strong> ${article.source}
        ${article.publishedAt ? ` | <strong>Date:</strong> ${new Date(article.publishedAt).toLocaleDateString("fr-FR")}` : ""}
      </p>
      ${article.excerpt ? `<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">${article.excerpt}</p>` : ""}
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synthèse Hebdomadaire ANINF</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .week-info {
      background-color: #e8f0ff;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 4px;
    }
    .week-info p {
      margin: 0;
      color: #0052a3;
      font-weight: 500;
    }
    .summary-section {
      margin-bottom: 30px;
    }
    .summary-section h2 {
      color: #0066cc;
      font-size: 18px;
      margin: 0 0 15px 0;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    .summary-text {
      color: #555;
      line-height: 1.8;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .articles-section {
      margin-top: 30px;
    }
    .articles-section h2 {
      color: #0066cc;
      font-size: 18px;
      margin: 0 0 15px 0;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    .article-count {
      background-color: #f0f4ff;
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 15px;
      font-weight: 500;
      color: #0052a3;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
    .cta-button {
      display: inline-block;
      background-color: #0066cc;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 15px;
    }
    .cta-button:hover {
      background-color: #0052a3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Synthèse Hebdomadaire ANINF</h1>
      <p>Semaine du ${weekStart} au ${weekEnd}</p>
    </div>

    <div class="content">
      <div class="week-info">
        <p>📅 Période: ${weekStart} - ${weekEnd}</p>
        <p>📰 Articles trouvés: ${articlesCount}</p>
      </div>

      <div class="summary-section">
        <h2>Résumé Consolidé</h2>
        <div class="summary-text">${summary}</div>
      </div>

      ${
        articles.length > 0
          ? `
      <div class="articles-section">
        <h2>Articles Détaillés</h2>
        <div class="article-count">${articlesCount} article(s) trouvé(s)</div>
        ${articlesHtml}
      </div>
      `
          : ""
      }

      <div style="text-align: center; margin-top: 30px;">
        <a href="${ENV.appUrl || "https://example.com"}/weekly-summaries" class="cta-button">
          Consulter les synthèses
        </a>
      </div>
    </div>

    <div class="footer">
      <p>
        Cet email a été généré automatiquement par l'Agent de Veille ANINF.<br>
        <a href="${ENV.appUrl || "https://example.com"}/email-settings">Gérer vos préférences d'email</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send weekly summary email to a subscriber
 */
export async function sendWeeklySummaryEmail(
  to: string,
  summary: string,
  articlesCount: number,
  weekStartDate: Date,
  weekEndDate: Date,
  articles: Array<{
    title: string;
    url: string;
    source: string;
    excerpt?: string;
    publishedAt?: Date;
  }>
): Promise<boolean> {
  const weekStart = weekStartDate.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekEnd = weekEndDate.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Synthèse Hebdomadaire ANINF - ${weekStart} au ${weekEnd}`;
  const htmlContent = generateWeeklySummaryEmailTemplate(
    summary,
    articlesCount,
    weekStartDate,
    weekEndDate,
    articles
  );

  return await sendEmail(to, subject, htmlContent);
}
