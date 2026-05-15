// scripts/diagnose-horse-owner.js
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
const TENANT_ID = 'equus-fidei';

async function diagnose() {
  console.log(`🔍 DIAGNÓSTICO: Correlación Caballo-Dueño para tenant: ${TENANT_ID}\n`);

  // 1. Obtener caballos del tenant
  const horsesSnap = await db.collection('HORSES')
    .where('tenantId', '==', TENANT_ID)
    .get();
  
  const horses = horsesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Obtener usuarios del tenant
  const usersSnap = await db.collection('USERS')
    .where('tenantId', '==', TENANT_ID)
    .get();
  
  const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Mapas para búsqueda rápida
  const usersById = {};
  const usersByUid = {};
  users.forEach(u => {
    usersById[u.id] = u;
    if (u.uid) usersByUid[u.uid] = u;
  });

  const results = {
    found: [],
    notFound: [],
  };

  horses.forEach(h => {
    const ownerId = h.ownerId;
    let owner = null;
    let matchType = null;

    if (usersById[ownerId]) {
      owner = usersById[ownerId];
      matchType = 'doc.id';
    } else if (usersByUid[ownerId]) {
      owner = usersByUid[ownerId];
      matchType = 'data.uid';
    }

    const horseInfo = {
      name: h.name,
      id: h.id,
      ownerId: ownerId,
    };

    if (owner) {
      results.found.push({
        ...horseInfo,
        ownerName: owner.displayName || '(sin nombre)',
        ownerEmail: owner.email || '(sin email)',
        matchType,
      });
    } else {
      results.notFound.push(horseInfo);
    }
  });

  // --- REPORTE ---
  console.log('═══════════════════════════════════════════════');
  console.log(`📊 CABALLOS EN ${TENANT_ID}: ${horses.length}`);
  console.log('═══════════════════════════════════════════════\n');

  console.log(`✅ Caballos con dueño encontrado: ${results.found.length}`);
  results.found.forEach(r => {
    console.log(`   - ${r.name} (${r.id}) → ${r.ownerName} <${r.ownerEmail}> [match por ${r.matchType}]`);
  });

  if (results.notFound.length > 0) {
    console.log(`\n❌ Caballos con dueño NO encontrado: ${results.notFound.length}`);
    results.notFound.forEach(r => {
      console.log(`   - ${r.name} (${r.id}) → ownerId="${r.ownerId}" (no existe en USERS del tenant)`);
    });
  }

  console.log(`\n🔍 USERS de ${TENANT_ID} (para referencia):`);
  users.forEach(u => {
    console.log(`   - docId=${u.id.padEnd(28)} email=${(u.email || '').padEnd(25)} displayName=${(u.displayName || '').padEnd(20)} uid=${u.uid || '(n/a)'}`);
  });

  console.log('\n═══════════════════════════════════════════════');
  console.log('Diagnóstico completado.');
  console.log('═══════════════════════════════════════════════');

  process.exit(0);
}

diagnose().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
