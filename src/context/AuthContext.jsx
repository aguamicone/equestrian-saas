import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword as firebaseSignIn, signOut as firebaseSignOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTenant, setCurrentTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const { notify } = useNotification();

    useEffect(() => {
        const initTenant = async () => {
            // Priority 1: Subdomain (for production)
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            
            // Assuming production is 'equestrian.app' and staging is 'vercel.app'
            // For localhost, parts might be ['localhost'] or ['127', '0', '0', '1']
            let detectedTenantId = null;
            
            if (parts.length > 2 && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
                // If subdomain exists (e.g. haraspablo.equestrian.app)
                detectedTenantId = parts[0];
            } else {
                // Priority 2: Query Parameter (fallback/testing)
                const params = new URLSearchParams(window.location.search);
                detectedTenantId = params.get('tenant') || localStorage.getItem('equestrian_tenant_id');
            }

            if (detectedTenantId) {
                try {
                    const snap = await getDoc(doc(db, 'TENANTS', detectedTenantId));
                    if (snap.exists()) {
                        setCurrentTenant(snap.data());
                        localStorage.setItem('equestrian_tenant_id', detectedTenantId);
                    }
                } catch(e) {
                    console.error("Error loading detected tenant:", e);
                }
            }
        };
        initTenant();
    }, []);

    useEffect(() => {
        if (!auth || !db) {
            console.error("Firebase no se inicializó correctamente. ¿Reiniciaste el servidor Vite después de crear .env.local?");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch extended user details from Firestore
                    const userDocRef = doc(db, 'USERS', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const fullUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...userData
                        };
                        setCurrentUser(fullUser);

                        if (fullUser.tenantIds && fullUser.tenantIds.length > 0) {
                            // If current tenant is not in their allowed list, default to their first allowed tenant
                            const currentId = localStorage.getItem('equestrian_tenant_id');
                            if (!currentId || !fullUser.tenantIds.includes(currentId)) {
                                setTenant(fullUser.tenantIds[0]);
                            } else {
                                setTenant(currentId);
                            }
                        } else if (fullUser.tenantId) {
                            setTenant(fullUser.tenantId); // Fuerza el tenant del usuario (si es staff o admin)
                        }
                    } else {
                        // Usuario existe en Auth pero no en BDD
                        const fallbackUser = { uid: firebaseUser.uid, email: firebaseUser.email, role: 'superAdmin', displayName: 'Administrador' };
                        setCurrentUser(fallbackUser);
                    }
                } catch (error) {
                    console.error("Error obteniendo datos del usuario:", error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            return await firebaseSignIn(auth, email, password);
        } catch (error) {
            console.error(error);
            notify("Credenciales inválidas o error de red", "error");
            throw error;
        }
    };

    const register = async (email, password, additionalData) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Guardar en base de datos extendida (Firestore)
            await setDoc(doc(db, 'USERS', user.uid), {
                email: user.email,
                role: additionalData.role || 'client',
                tenantId: additionalData.tenantId || null,
                displayName: additionalData.displayName || 'Nuevo Usuario',
                ...additionalData
            });

            notify("Usuario registrado!", "success");
            return user;
        } catch (error) {
            console.error(error);
            notify("Error al registrar: " + error.message, "error");
            throw error;
        }
    }

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            setCurrentUser(null);
            localStorage.removeItem('equestrian_tenant_id'); // Opcional
        } catch (error) {
            console.error(error);
            notify("Error al cerrar sesión", "error");
        }
    };

    const setTenant = async (tenantId) => {
        if (tenantId === null) {
            setCurrentTenant(null);
            localStorage.removeItem('equestrian_tenant_id');
            return;
        }
        
        try {
            const snap = await getDoc(doc(db, 'TENANTS', tenantId));
            if (snap.exists()) {
                setCurrentTenant(snap.data());
                localStorage.setItem('equestrian_tenant_id', tenantId);
            }
        } catch(e) {
            console.error(e);
        }
    };

    const value = {
        currentUser,
        currentTenant,
        setTenant,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
