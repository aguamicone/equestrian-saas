// scripts/fix-horse-data.js
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

/**
 * CONFIGURACIÓN
 * Cambiar DRY_RUN a false para aplicar los cambios en Firestore.
 */
const DRY_RUN = false;

async function fixHorseData() {
  console.log(`🚀 Iniciando limpieza y re-linkeo de datos de caballos...`);
  console.log(`Modo: ${DRY_RUN ? '⚠️  DRY_RUN (Solo reporte)' : '🔥 EJECUCIÓN REAL'}\n`);

  const stats = {
    deleted: 0,
    relinked: 0,
    errors: []
  };

  try {
    // 1. RESOLVER UIDS DE USUARIOS POR EMAIL
    // Necesitamos esto para Nave 6 y validación de Equus Fidei
    const usersSnap = await db.collection('USERS').get();
    const emailToUser = {};
    usersSnap.forEach(doc => {
      const u = doc.data();
      if (u.email) {
        emailToUser[u.email.toLowerCase()] = { uid: doc.id, ...u };
      }
    });

    // ----- SECCIÓN 1: Borrar caballos demo -----
    console.log('--- SECCIÓN 1: Borrar caballos demo ---');
    const demoHorseIds = ['h-9', 'h-10', 'h-11', 'h-12', 'h-13', 'h-14', 'h-15'];
    for (const id of demoHorseIds) {
      const docRef = db.collection('HORSES').doc(id);
      const doc = await docRef.get();
      if (doc.exists) {
        const name = doc.data().name;
        if (DRY_RUN) {
          console.log(`[DRY] Borraría: ${id} (${name})`);
        } else {
          await docRef.delete();
          console.log(`✅ Borrado: ${id} (${name})`);
        }
        stats.deleted++;
      } else {
        console.log(`ℹ️  Omitido: ${id} no existe.`);
      }
    }

    // ----- SECCIÓN 2: Re-link de equus-fidei -----
    console.log('\n--- SECCIÓN 2: Re-link de equus-fidei ---');
    const equusFideiMapping = [
      { id: 'h-2', name: 'Osiris', email: 'farid@mail.com' },
      { id: 'h-3', name: 'Pensa', email: 'antonella@mail.com' },
      { id: 'h-4', name: 'Astro Noy', email: 'farid@mail.com' },
      { id: 'h-5', name: 'Cervantina', email: 'agustin@mail.com' },
      { id: 'h-6', name: 'Calito', email: 'roberta@mail.com' },
      { id: 'h-7', name: 'Chamorro', email: 'roberta@mail.com' },
      { id: 'h-8', name: 'Patrick', email: 'jacquelline@mail.com' }
    ];

    for (const item of equusFideiMapping) {
      const user = emailToUser[item.email.toLowerCase()];
      if (!user) {
        stats.errors.push(`Usuario no encontrado para ${item.name}: ${item.email}`);
        continue;
      }

      const docRef = db.collection('HORSES').doc(item.id);
      const doc = await docRef.get();
      if (doc.exists) {
        const oldOwnerId = doc.data().ownerId;
        if (DRY_RUN) {
          console.log(`[DRY] Actualizaría: ${item.name} ownerId: "${oldOwnerId}" → "${user.uid}" (${item.email})`);
        } else {
          await docRef.update({ ownerId: user.uid });
          console.log(`✅ Actualizado: ${item.name} → ${item.email}`);
        }
        stats.relinked++;
      } else {
        console.log(`⚠️  Omitido: Caballo ${item.id} (${item.name}) no existe.`);
      }
    }

    // ----- SECCIÓN 3: Re-link de Nave 6 -----
    console.log('\n--- SECCIÓN 3: Re-link de Nave 6 ---');
    const nave6Mapping = [
      { id: 'h-n6-1', name: 'Trueno', email: 'pedro@mail.com' },
      { id: 'h-n6-2', name: 'Rayo', email: 'ana@mail.com' },
      { id: 'h-n6-3', name: 'Sombra', email: 'pedro@mail.com' },
      { id: 'h-n6-4', name: 'Viento', email: 'luis@mail.com' },
      { id: 'h-n6-5', name: 'Fuego', email: 'ana@mail.com' }
    ];

    for (const item of nave6Mapping) {
      const user = emailToUser[item.email.toLowerCase()];
      if (!user) {
        stats.errors.push(`Usuario no encontrado para ${item.name} (Nave 6): ${item.email}`);
        continue;
      }

      const docRef = db.collection('HORSES').doc(item.id);
      const doc = await docRef.get();
      if (doc.exists) {
        if (DRY_RUN) {
          console.log(`[DRY] Actualizaría (N6): ${item.name} → ${item.email} (${user.uid})`);
        } else {
          await docRef.update({ ownerId: user.uid });
          console.log(`✅ Actualizado (N6): ${item.name} → ${item.email}`);
        }
        stats.relinked++;
      } else {
        console.log(`⚠️  Omitido (N6): Caballo ${item.id} (${item.name}) no existe.`);
      }
    }

    // ----- REPORTE FINAL -----
    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════');
    console.log(`Modo: ${DRY_RUN ? 'DRY_RUN (No se guardaron cambios)' : 'EJECUCIÓN REAL (Datos actualizados)'}`);
    console.log(`Borrados:    ${stats.deleted} caballos`);
    console.log(`Re-linked:   ${stats.relinked} caballos`);
    console.log(`Errores:     ${stats.errors.length}`);
    if (stats.errors.length > 0) {
      console.log('\nDetalle de errores:');
      stats.errors.forEach(e => console.log(`- ${e}`));
    }
    console.log('═══════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO DURANTE LA EJECUCIÓN:');
    console.error(error.message);
    process.exit(1);
  }

  process.exit(0);
}

fixHorseData();
