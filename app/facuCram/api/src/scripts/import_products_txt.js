import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma.js';
import { loadEnv } from '../config/env.js';

loadEnv();

function parseArgs(argv){
  const args = { file: null, minRows: 100, limit: null, dry: false };
  for (let i=2;i<argv.length;i++){
    const a = argv[i];
    if (!a) continue;
    if (a === '--dry') { args.dry = true; continue; }
    if (a.startsWith('--minRows=')) { args.minRows = parseInt(a.split('=')[1]||'100',10)||100; continue; }
    if (a.startsWith('--limit=')) { args.limit = parseInt(a.split('=')[1]||'',10)||null; continue; }
    if (!args.file) { args.file = a; continue; }
  }
  if (!args.file) {
    // default: take CRAM-WEB.txt from current api working dir
    // This lets you run: npm run import:products (placing the file at: <api>/CRAM-WEB.txt)
    args.file = path.join(process.cwd(), 'CRAM-WEB.txt');
  }
  return args;
}

function splitLines(text){
  return text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
}

function parsePrice(raw){
  if (raw == null) return 0;
  const s = String(raw).replace(/[\s.,]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toBoolInStock(stockStr){
  return String(stockStr||'').toUpperCase().includes('SI');
}

async function importProducts(filePath, { minRows=100, limit=null, dry=false } = {}){
  if (!fs.existsSync(filePath)) {
    console.error('No existe el archivo:', filePath);
    process.exit(2);
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = splitLines(text).map(l=>l.trimEnd()).filter(l=>l.length>0);
  if (lines.length < 2) {
    console.error('TXT vacío o inválido.');
    process.exit(3);
  }

  const header = lines[0];
  const rows = lines.slice(1);
  const col = {
    rubro: 0,
    motor: 1,
    code: 2,
    nro_fabrica: 3,
    articulo: 4,
    info_tecnica: 5,
    price: 6,
    mv: 7,
    stock: 8,
  };

  const parsed = [];
  for (const line of rows){
    const parts = line.split(';').map(v=>v.trim());
    if (parts.every(v=>v==='')) continue;
    const code = parts[col.code] || '';
    if (!code) continue;
    const priceRaw = parts[col.price] || '0';
    const stockStr = parts[col.stock] || '';
    parsed.push({
      code,
      rubro: parts[col.rubro] || null,
      motor: parts[col.motor] || null,
      nro_fabrica: parts[col.nro_fabrica] || null,
      articulo: parts[col.articulo] || null,
      info_tecnica: parts[col.info_tecnica] || null,
      price: parsePrice(priceRaw),
      mv: parts[col.mv] || null,
      stock: stockStr,
      in_stock: toBoolInStock(stockStr),
      is_active: true,
    });
  }

  const totalParsed = parsed.length;
  if (totalParsed < minRows) {
    console.error(`Muy pocos productos detectados (${totalParsed}) (mínimo: ${minRows}). Abortando para proteger la BD.`);
    process.exit(4);
  }

  const now = new Date();
  const items = limit ? parsed.slice(0, limit) : parsed;

  console.log(`Leídos: ${totalParsed}. A importar: ${items.length}. Dry-run: ${dry ? 'Sí' : 'No'}.`);

  if (dry) return { totalParsed, imported: 0 };

  // Desactivar existentes (como en Laravel) antes de upsert
  console.log('Marcando productos existentes como inactivos...');
  await prisma.products.updateMany({ data: { is_active: false } });

  console.log('Upserting por code...');
  // Limitar concurrencia para no saturar conexiones
  const concurrency = 50;
  let i = 0; let imported = 0;
  async function worker(chunk){
    for (const p of chunk){
      await prisma.products.upsert({
        where: { code: p.code },
        update: {
          rubro: p.rubro,
          motor: p.motor,
          nro_fabrica: p.nro_fabrica,
          articulo: p.articulo,
          info_tecnica: p.info_tecnica,
          price: p.price,
          mv: p.mv,
          stock: p.stock,
          in_stock: p.in_stock,
          is_active: true,
          updated_from_txt_at: now,
          updated_at: now,
        },
        create: {
          code: p.code,
          rubro: p.rubro,
          motor: p.motor,
          nro_fabrica: p.nro_fabrica,
          articulo: p.articulo,
          info_tecnica: p.info_tecnica,
          price: p.price,
          mv: p.mv,
          stock: p.stock,
          in_stock: p.in_stock,
          is_active: true,
          updated_from_txt_at: now,
          created_at: now,
          updated_at: now,
        }
      });
      imported++;
      if (imported % 1000 === 0) console.log(`Upserts: ${imported}/${items.length}`);
    }
  }

  // Distribuir items en 'concurrency' lotes balanceados
  const batches = Array.from({length: concurrency}, ()=>[]);
  items.forEach((p, idx)=>{ batches[idx % concurrency].push(p); });
  await Promise.all(batches.map(b=>worker(b)));

  console.log('Eliminando obsoletos...');
  await prisma.products.deleteMany({ where: { is_active: false, OR: [ { updated_from_txt_at: null }, { updated_from_txt_at: { lt: now } } ] } });

  return { totalParsed, imported };
}

async function main(){
  const args = parseArgs(process.argv);
  try {
    const { totalParsed, imported } = await importProducts(path.resolve(args.file), { minRows: args.minRows, limit: args.limit, dry: args.dry });
    console.log(`Finalizado. Leídos=${totalParsed}, Importados=${imported}`);
  } catch (e) {
    console.error('Error:', e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
