import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { prisma } from '../config/prisma.js';
import { loadEnv } from '../config/env.js';
loadEnv();
import { normalizeId, detectRoleFromId } from '../utils/userId.js';

async function upsertUser(id, name) {
  const now = new Date();
  try {
    await prisma.users.upsert({
      where: { id },
      update: {
        name,
        role: detectRoleFromId(id),
        updated_at: now,
      },
      create: {
        id,
        name,
        role: detectRoleFromId(id),
        created_at: now,
        updated_at: now,
      }
    });
    return true;
  } catch (e) {
    console.error('DB error for', id, e.message || e);
    return false;
  }
}

async function importFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(2);
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let processed = 0;
  let skipped = 0;

  for (const row of data) {
    // Expecting at least [id, name]
    const rawId = row[0];
    const name = row[1] ? String(row[1]).trim() : '';
    const id = normalizeId(rawId);
    if (!id) { skipped++; continue; }
    const ok = await upsertUser(id, name || '');
    if (ok) processed++; else skipped++;
  }

  console.log(`Imported: ${processed}, Skipped: ${skipped}`);
}

async function main(){
  const arg = process.argv[2] || path.join(process.cwd(), 'CLIENTES-CRAM.xlsx');
  await importFile(arg);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error(e); process.exit(1); });
