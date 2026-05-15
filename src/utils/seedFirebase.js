import { db, auth } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { INITIAL_DATA } from '../services/mockFirebase';

export const executeFirebaseSeed = async () => {
    try {
        console.log("Iniciando Seed de Firebase...");
        
        // 1. Crear TODOS los usuarios Mock en Firebase Auth
        console.log("Registrando usuarios en Firebase Auth...");
        for (const user of INITIAL_DATA.USERS) {
            try {
                const userCred = await createUserWithEmailAndPassword(auth, user.email, '123456');
                user.uid = userCred.user.uid; // Actualizar con el UID real de Auth
                console.log(`Usuario creado: ${user.email}`);
            } catch (e) {
                if (e.code === 'auth/email-already-in-use') {
                    console.log(`User ${user.email} ya existe en Auth (o se uso la cache local). Saltando...`);
                } else {
                    console.error("Error Auth:", e);
                }
            }
        }

        // 2. Poblar Firestore
        console.log("Poblando Tenants...");
        for (const tenantId in INITIAL_DATA.TENANTS) {
            await setDoc(doc(db, 'TENANTS', tenantId), INITIAL_DATA.TENANTS[tenantId]);
        }

        const collections = ['SPACES', 'PRICING_PLANS', 'HORSES', 'INVENTORY', 'FINANCES', 'SERVICES_CATALOG', 'ROUTINES', 'EVENTS'];
        
        for (const coll of collections) {
            console.log(`Poblando ${coll}...`);
            if (Array.isArray(INITIAL_DATA[coll])) {
                for (const item of INITIAL_DATA[coll]) {
                    if (item.id) {
                        await setDoc(doc(db, coll, item.id), item);
                    }
                }
            }
        }

        // 3. Poblar Tabla USERS temporal (Profile documents)
        console.log("Poblando Usuarios (Documentos Profile Firestore)...");
        for (const user of INITIAL_DATA.USERS) {
            const docId = user.uid || user.email; // UID de Auth o fallback
            await setDoc(doc(db, 'USERS', docId), { ...user });
        }

        // Cerramos sesión para que el usuario pueda entrar manualmente
        await signOut(auth);

        console.log("Seed de Firebase Completado!");
        return { success: true };
    } catch (e) {
        console.error("Error en Seed Firebase:", e);
        return { success: false, error: e };
    }
}
