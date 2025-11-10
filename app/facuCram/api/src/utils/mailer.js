import nodemailer from 'nodemailer';
import { loadEnv } from '../config/env.js';

let transporter;
function getTransporter(){
  if (transporter) return transporter;
  loadEnv();
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT || 587);
  const enc = String(process.env.MAIL_ENCRYPTION || '').toLowerCase();
  const secure = enc === 'ssl' || port === 465; // 465 => SSL; 587 => STARTTLS (secure=false)
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  const logger = String(process.env.MAIL_DEBUG || '').toLowerCase() === 'true';
  const connectionTimeout = Number(process.env.MAIL_CONNECTION_TIMEOUT || 10000); // 10s
  const greetingTimeout = Number(process.env.MAIL_GREETING_TIMEOUT || 10000);
  const socketTimeout = Number(process.env.MAIL_SOCKET_TIMEOUT || 20000);
  const insecure = String(process.env.MAIL_TLS_INSECURE || '').toLowerCase() === 'true';

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    logger,
    debug: logger,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    tls: insecure ? { rejectUnauthorized: false } : undefined,
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }){
  const t = getTransporter();
  const from = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || 'no-reply@cram.local';
  const message = { from, to, subject, html: html || undefined, text: text || undefined };
  return t.sendMail(message);
}
