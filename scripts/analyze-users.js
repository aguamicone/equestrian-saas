// scripts/analyze-users.js
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

async function analyzeUsers() {
  console.log('🔍 Analizando colección USERS...\n');
  const snapshot = await db.collection('USERS').get();
  
  const stats = {
    total: snapshot.size,
    onlyTenantId: [],
    onlyTenantIds: [],
    both: [],
    neither: [],
    inconsistent: [],
  };

  snapshot.forEach(doc => {
    const data = doc.data();
    const hasTenantId = typeof data.tenantId === 'string' && data.tenantId.length > 0;
    const hasTenantIds = Array.isArray(data.tenantIds) && data.tenantIds.length > 0;
    const summary = {
      docId: doc.id,
      email: data.email || '(sin email)',
      displayName: data.displayName || '(sin nombre)',
      role: data.role || '(sin rol)',
      tenantId: data.tenantId,
      tenantIds: data.tenantIds,
    };

    if (hasTenantId && hasTenantIds) {
      // Verificar si tenantId está incluido en tenantIds
      if (!data.tenantIds.includes(data.tenantId)) {
        stats.inconsistent.push({ ...summary, reason: 'tenantId NO está en tenantIds' });
      } else {
        stats.both.push(summary);
      }
    } else if (hasTenantId) {
      stats.onlyTenantId.push(summary);
    } else if (hasTenantIds) {
      stats.onlyTenantIds.push(summary);
    } else {
      stats.neither.push(summary);
    }
  });

  // Reporte
  console.log('═══════════════════════════════════════════════');
  console.log(`📊 TOTAL DE USUARIOS: ${stats.total}`);
  console.log('═══════════════════════════════════════════════\n');
  
  console.log(`✅ Solo tenantId (singular): ${stats.onlyTenantId.length}`);
  stats.onlyTenantId.forEach(u => 
    console.log(`   - ${u.displayName} <${u.email}> · rol: ${u.role} · tenantId: ${u.tenantId}`)
  );

  console.log(`\n✅ Solo tenantIds (array): ${stats.onlyTenantIds.length}`);
  stats.onlyTenantIds.forEach(u => 
    console.log(`   - ${u.displayName} <${u.email}> · rol: ${u.role} · tenantIds: ${JSON.stringify(u.tenantIds)}`)
  );

  console.log(`\n✅ Ambos campos (consistentes): ${stats.both.length}`);
  stats.both.forEach(u => 
    console.log(`   - ${u.displayName} <${u.email}> · rol: ${u.role}`)
  );

  console.log(`\n⚠️  Sin tenantId ni tenantIds (huérfanos): ${stats.neither.length}`);
  stats.neither.forEach(u => 
    console.log(`   - ${u.displayName} <${u.email}> · rol: ${u.role} · docId: ${u.docId}`)
  );

  console.log(`\n❌ INCONSISTENTES: ${stats.inconsistent.length}`);
  stats.inconsistent.forEach(u => 
    console.log(`   - ${u.displayName} <${u.email}> · ${u.reason}`)
  );

  console.log('\n═══════════════════════════════════════════════');
  console.log('Análisis completado. NO se modificó ningún dato.');
  console.log('═══════════════════════════════════════════════');

  process.exit(0);
}

analyzeUsers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
