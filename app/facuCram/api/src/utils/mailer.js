import nodemailer from 'nodemailer';
import { loadEnv } from '../config/env.js';

let transporter;

function buildTransportOptions() {
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT || 587);
  const enc = String(process.env.MAIL_ENCRYPTION || '').toLowerCase();
  const secure = enc === 'ssl' || port === 465; // 465 => SSL; 587 => STARTTLS (secure=false)
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  const logger = String(process.env.MAIL_DEBUG || '').toLowerCase() === 'true';
  const connectionTimeout = Number(process.env.MAIL_CONNECTION_TIMEOUT || 15000); // 15s por entornos cloud
  const greetingTimeout = Number(process.env.MAIL_GREETING_TIMEOUT || 15000);
  const socketTimeout = Number(process.env.MAIL_SOCKET_TIMEOUT || 30000);
  const insecure = String(process.env.MAIL_TLS_INSECURE || '').toLowerCase() === 'true';
  const requireTLS = String(process.env.MAIL_REQUIRE_TLS || '').toLowerCase() === 'true';
  const pool = String(process.env.MAIL_POOL || '').toLowerCase() === 'true';
  const maxConnections = Number(process.env.MAIL_POOL_MAX_CONNECTIONS || 2);
  const maxMessages = Number(process.env.MAIL_POOL_MAX_MESSAGES || 100);
  const service = process.env.MAIL_SERVICE; // opcional: 'gmail', etc.
  const familyEnv = String(process.env.MAIL_FAMILY || '').trim();
  const forceIPv4 = String(process.env.MAIL_FORCE_IPV4 || '').toLowerCase() === 'true';
  let family;
  if (familyEnv === '4' || forceIPv4) family = 4;
  else if (familyEnv === '6') family = 6;

  const base = {
    host,
    port,
    secure,
    requireTLS,
    auth: user && pass ? { user, pass } : undefined,
    logger,
    debug: logger,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    pool,
    maxConnections,
    maxMessages,
    tls: insecure ? { rejectUnauthorized: false } : undefined,
  };

  if (family) base.family = family;
  if (service) base.service = service;
  return base;
}

function getTransporter() {
  if (transporter) return transporter;
  loadEnv();
  const options = buildTransportOptions();
  transporter = nodemailer.createTransport(options);
  const logger = String(process.env.MAIL_DEBUG || '').toLowerCase() === 'true';
  if (logger) {
    // snapshot seguro sin credenciales
    const snapshot = getMailConfigSnapshot();
    try { console.info('[mailer] Config SMTP:', snapshot); } catch (_) {}
  }
  return transporter;
}

export function getMailConfigSnapshot() {
  loadEnv();
  const opts = buildTransportOptions();
  return {
    host: opts.host,
    port: opts.port,
    secure: opts.secure,
    requireTLS: opts.requireTLS,
    pool: opts.pool,
    family: opts.family,
    service: opts.service,
    tlsInsecure: !!(opts.tls && opts.tls.rejectUnauthorized === false),
    timeouts: {
      connectionTimeout: opts.connectionTimeout,
      greetingTimeout: opts.greetingTimeout,
      socketTimeout: opts.socketTimeout,
    },
    hasAuth: !!opts.auth,
    from: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || 'no-reply@cram.local',
  };
}

export async function verifyMailTransport() {
  const t = getTransporter();
  return t.verify();
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  const address = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || 'no-reply@cram.local';
  const name = process.env.MAIL_FROM_NAME;
  const from = name ? `${JSON.stringify(name)} <${address}>` : address;
  const message = { from, to, subject, html: html || undefined, text: text || undefined };
  return t.sendMail(message);
}
