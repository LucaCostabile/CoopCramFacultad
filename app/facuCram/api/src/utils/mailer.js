import nodemailer from 'nodemailer';
import { loadEnv } from '../config/env.js';

let transporter;
function getTransporter(){
  if (transporter) return transporter;
  loadEnv();
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT || 587);
  const secure = String(process.env.MAIL_ENCRYPTION || '').toLowerCase() === 'ssl' || port === 465;
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  transporter = nodemailer.createTransport({ host, port, secure, auth: user && pass ? { user, pass } : undefined });
  return transporter;
}

export async function sendMail({ to, subject, html, text }){
  const t = getTransporter();
  const from = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || 'no-reply@cram.local';
  const message = { from, to, subject, html: html || undefined, text: text || undefined };
  return t.sendMail(message);
}
