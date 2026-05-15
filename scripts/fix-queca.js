// scripts/fix-queca.js
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

async function fixQueca() {
  const horseRef = db.collection('HORSES').doc('h-1');
  const userUid = 'kbQ47xog2haJFgQfa7K7LFzxy1C3'; // Agustin UID
  
  await horseRef.update({
    ownerId: userUid
  });
  
  console.log('✅ Queca (h-1) actualizada con ownerId:', userUid);
  process.exit(0);
}

fixQueca().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
