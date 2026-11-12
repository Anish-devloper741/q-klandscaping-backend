import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const enabled = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.NOTIFY_TO;

const transporter = enabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 465,
      secure: (env.SMTP_PORT ?? 465) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

export async function sendQuoteEmail(q) {
  if (!transporter) {
    logger.warn("SMTP not configured, skipping email notification");
    return;
  }
  await transporter.sendMail({
    from: env.MAIL_FROM || env.SMTP_USER,
    to: env.NOTIFY_TO,
    subject: `New quote request: ${q.service} - ${q.name}`,
    text: [
      `Name: ${q.name}`,
      `Phone: ${q.phone}`,
      `Email: ${q.email || "-"}`,
      `Service: ${q.service}`,
      `Location: ${q.location}`,
      `Details: ${q.details || "-"}`,
      `Received: ${q.createdAt.toISOString()}`,
    ].join("\n"),
  });
}