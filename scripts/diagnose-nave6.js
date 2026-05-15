// scripts/diagnose-nave6.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const NAVE6_TENANT = 'nave-6';

async function diagnose() {
  console.log(`🔍 DIAGNÓSTICO: Datos de Nave 6 (tenantId: ${NAVE6_TENANT})\n`);

  // 1. Caballos de Nave 6
  console.log('--- 🐎 HORSES (nave-6) ---');
  const horsesSnap = await db.collection('HORSES')
    .where('tenantId', '==', NAVE6_TENANT)
    .get();
  
  if (horsesSnap.empty) {
    console.log('No se encontraron caballos.');
  } else {
    horsesSnap.forEach(doc => {
      const h = doc.data();
      console.log(`- docId: ${doc.id}`);
      console.log(`  name: ${h.name}`);
      console.log(`  ownerId: ${h.ownerId}`);
      console.log(`  breed: ${h.breed || '(n/a)'}`);
      console.log(`  age: ${h.age || '(n/a)'}`);
      console.log(`  color: ${h.color || '(n/a)'}`);
      if (h.notes) console.log(`  notes: ${h.notes}`);
      console.log('  -------------------');
    });
  }

  // 2. Usuarios de Nave 6
  console.log('\n--- 👥 USERS (nave-6) ---');
  const usersSnap = await db.collection('USERS')
    .where('tenantId', '==', NAVE6_TENANT)
    .get();

  if (usersSnap.empty) {
    console.log('No se encontraron usuarios.');
  } else {
    usersSnap.forEach(doc => {
      const u = doc.data();
      console.log(`- docId: ${doc.id} (UID real)`);
      console.log(`  displayName: ${u.displayName || '(sin nombre)'}`);
      console.log(`  email: ${u.email || '(sin email)'}`);
      console.log(`  role: ${u.role || '(sin rol)'}`);
      console.log('  -------------------');
    });
  }

  console.log('\nAnálisis finalizado.');
  process.exit(0);
}

diagnose().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
