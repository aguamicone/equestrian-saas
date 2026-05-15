/**
 * Mock Firebase Service with LocalStorage Persistence
 * Simulates a persistent database for the prototype.
 */

// Initial Seed Data (Used if LocalStorage is empty or Reset)
export const INITIAL_DATA = {
    TENANTS: {
        'haras-test': {
            id: 'haras-test',
            name: 'Haras Test',
            domain: 'haras-test.equestrian.app',
            bannerText: 'Bienvenido a Haras Test',
            bannerImage: null
        },
        'equus-fidei': {
            id: 'equus-fidei',
            name: 'Equus Fidei Nave 7',
            domain: 'equus-fidei.equestrian.app',
            bannerText: 'Equus Fidei (Nave 7) - Excelencia Ecuestre',
            bannerImage: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200'
        },
        'nave-6': {
            id: 'nave-6',
            name: 'Equus Fidei Nave 6',
            domain: 'nave-6.equestrian.app',
            bannerText: 'Equus Fidei Nave 6 - Centro de Alto Rendimiento',
            bannerImage: 'https://images.unsplash.com/photo-1534008779944-79fa26829738?auto=format&fit=crop&w=1200'
        }
    },
    SPACES: [
        // Nave 7 Boxes
        ...Array.from({ length: 15 }, (_, i) => ({ id: `ef-box-${i + 1}`, tenantId: 'equus-fidei', name: `Box ${i + 1}`, type: 'box', status: 'occupied', horseId: `h-${i + 1}`, price: 1300000 })),
        ...Array.from({ length: 5 }, (_, i) => ({ id: `ef-box-${16 + i}`, tenantId: 'equus-fidei', name: `Box ${16 + i}`, type: 'box', status: 'available', horseId: null, price: 1300000 })),
        // Nave 6 Boxes (10 Boxes)
        ...Array.from({ length: 10 }, (_, i) => ({ id: `n6-box-${i + 1}`, tenantId: 'nave-6', name: `Box N6-${i + 1}`, type: 'box', status: i < 5 ? 'occupied' : 'available', horseId: i < 5 ? `h-n6-${i + 1}` : null, price: 1200000 })),
        // Haras Test
        { id: 'ht-1', tenantId: 'haras-test', name: 'Box A1', type: 'box', status: 'available' }
    ],
    PRICING_PLANS: [
        // Nave 7 Plans
        { id: 'plan-1', tenantId: 'equus-fidei', name: 'Pensión Completa', price: 450000, type: 'membership', frequency: 'monthly', description: 'Alojamiento, alimentación y cuidados básicos.' },
        { id: 'plan-2', tenantId: 'equus-fidei', name: 'Entrenamiento Deportivo', price: 150000, type: 'service', frequency: 'monthly', description: 'Entrenamiento profesional 3 veces por semana.' },
        { id: 'plan-3', tenantId: 'equus-fidei', name: 'Corte de Pelo', price: 15000, type: 'service', frequency: 'one-time', description: 'Servicio de peluquería equina completa.' },
        { id: 'plan-4', tenantId: 'equus-fidei', name: 'Herrería', price: 25000, type: 'service', frequency: 'one-time', description: 'Servicio de herrado completo.' },
        // Nave 6 Plans
        { id: 'plan-n6-1', tenantId: 'nave-6', name: 'Pensión Standard', price: 400000, type: 'membership', frequency: 'monthly', description: 'Cuidado básico y alimentación.' },
        { id: 'plan-n6-2', tenantId: 'nave-6', name: 'Pensión Premium', price: 600000, type: 'membership', frequency: 'monthly', description: 'Incluye suplementos y cama de viruta especial.' }
    ],
    HORSES: [
        // Nave 7 Horses
        { id: 'h-1', tenantId: 'equus-fidei', name: 'Queca', ownerId: 'user-agustin', breed: 'Pura Sangre', color: 'Zaino', age: 5, photo: '/horse-queca.jpg', assignedPlanIds: ['plan-1'] },
        { id: 'h-2', tenantId: 'equus-fidei', name: 'Osiris', ownerId: 'user-farid', breed: 'Árabe', color: 'Tordillo', age: 7, assignedPlanIds: ['plan-1', 'plan-2'] },
        { id: 'h-3', tenantId: 'equus-fidei', name: 'Pensa', ownerId: 'user-antonella', breed: 'Cuarto de Milla', color: 'Alazán', age: 4, assignedPlanIds: ['plan-1'] },
        { id: 'h-4', tenantId: 'equus-fidei', name: 'Astro Noy', ownerId: 'user-farid', breed: 'Silla Argentino', color: 'Zaino', age: 6, assignedPlanIds: ['plan-1', 'plan-2'] },
        { id: 'h-5', tenantId: 'equus-fidei', name: 'Cervantina', ownerId: 'user-agustin', breed: 'Pura Sangre', color: 'Bayo', age: 8, pedigree: '/pedigree-cervantina.png', assignedPlanIds: ['plan-1'] },
        { id: 'h-6', tenantId: 'equus-fidei', name: 'Calito', ownerId: 'user-roberta', breed: 'Pony', color: 'Manchado', age: 10, assignedPlanIds: ['plan-1'] },
        { id: 'h-7', tenantId: 'equus-fidei', name: 'Chamorro', ownerId: 'user-roberta', breed: 'Criollo', color: 'Gateado', age: 12, assignedPlanIds: ['plan-1'] },
        { id: 'h-8', tenantId: 'equus-fidei', name: 'Patrick', ownerId: 'user-jacquelline', breed: 'Frisón', color: 'Negro', age: 5, assignedPlanIds: ['plan-1'] },
        ...Array.from({ length: 7 }, (_, i) => ({ id: `h-${9 + i}`, tenantId: 'equus-fidei', name: `Caballo ${9 + i} (Demo)`, ownerId: 'user-demo', breed: 'Mestizo', assignedPlanIds: ['plan-1'] })),
        // Nave 6 Horses
        { id: 'h-n6-1', tenantId: 'nave-6', name: 'Trueno', ownerId: 'client-n6-1', breed: 'Mustang', color: 'Overo', age: 6, assignedPlanIds: ['plan-n6-1'] },
        { id: 'h-n6-2', tenantId: 'nave-6', name: 'Rayo', ownerId: 'client-n6-2', breed: 'Árabe', color: 'Blanco', age: 4, assignedPlanIds: ['plan-n6-2'] },
        { id: 'h-n6-3', tenantId: 'nave-6', name: 'Sombra', ownerId: 'client-n6-1', breed: 'Frisón', color: 'Negro', age: 8, assignedPlanIds: ['plan-n6-1'] },
        { id: 'h-n6-4', tenantId: 'nave-6', name: 'Viento', ownerId: 'client-n6-3', breed: 'Criollo', color: 'Lobuno', age: 10, assignedPlanIds: ['plan-n6-2'] },
        { id: 'h-n6-5', tenantId: 'nave-6', name: 'Fuego', ownerId: 'client-n6-2', breed: 'Anglo Árabe', color: 'Alazán', age: 5, assignedPlanIds: ['plan-n6-1'] }
    ],
    SHIFTS: [
        // Initial Shifts will be empty or seeded for testing
        // { id: 's1', tenantId: 'equus-fidei', staffId: 'staff-rodrigo', day: 'Monday', start: '08:00', end: '16:00' }
    ],
    INVENTORY: [
        { id: 'inv1', name: 'Fardo de Alfalfa', category: 'Alimentación', stock: 100, unit: 'unidades', tenantId: 'equus-fidei', minStock: 20 },
        { id: 'inv2', name: 'Bolsa de Avena', category: 'Alimentación', stock: 50, unit: 'bolsas', tenantId: 'equus-fidei', minStock: 10 },
        { id: 'inv3', name: 'Viruta (Cama)', category: 'Cama', stock: 200, unit: 'bolsas', tenantId: 'equus-fidei', minStock: 50 },
        { id: 'inv4', name: 'Ivermectina', category: 'Veterinaria', stock: 15, unit: 'dosis', tenantId: 'equus-fidei', minStock: 5 }
    ],
    INVENTORY_LOGS: [],
    NOTIFICATIONS: [], // New Notifications Collection
    FINANCES: [
        { id: 'f1', tenantId: 'equus-fidei', clientId: 'user-agustin', amount: 1300000, type: 'income', status: 'pending', description: 'Pensión Marzo - Queca', category: 'Pensión', date: '2024-03-01' },
        { id: 'f2', tenantId: 'equus-fidei', clientId: 'user-farid', amount: 2600000, type: 'income', status: 'paid', description: 'Pensión Marzo - Osiris & Astro Noy', category: 'Pensión', date: '2024-03-05' }
    ],
    LOGS: [],
    PAYROLL_ADVANCES: [],
    SERVICES_CATALOG: [
        { id: 'sc1', tenantId: 'equus-fidei', name: 'Preparar para Montar', category: 'quick_action', price: 0, autoApprove: true, icon: 'saddle' },
        { id: 'sc2', tenantId: 'equus-fidei', name: 'Baño Completo', category: 'quick_action', price: 0, autoApprove: true, icon: 'droplets' },
        { id: 'sc3', tenantId: 'equus-fidei', name: 'Vareo (Cuerda)', category: 'quick_action', price: 15000, autoApprove: true, icon: 'activity' },
        { id: 'sc4', tenantId: 'equus-fidei', name: 'Ración Extra (Avena)', category: 'upgrade', price: 5000, autoApprove: false, icon: 'wheat' },
        { id: 'sc5', tenantId: 'equus-fidei', name: 'Bolsa Zanahorias', category: 'upgrade', price: 3000, autoApprove: false, icon: 'carrot' },
        { id: 'sc6', tenantId: 'equus-fidei', name: 'Visita Veterinaria', category: 'professional', price: 0, autoApprove: false, icon: 'stethoscope' },
        { id: 'sc7', tenantId: 'equus-fidei', name: 'Herrador', category: 'professional', price: 0, autoApprove: false, icon: 'hammer' }
    ],
    REQUESTS: [],
    ROUTINES: [
        { id: 'rt1', tenantId: 'equus-fidei', name: 'Limpieza General', time: '08:00', frequency: 'Diaria' },
        { id: 'rt2', tenantId: 'equus-fidei', name: 'Cama Viruta', time: '17:00', frequency: 'Diaria' }
    ],
    USERS: [
        { uid: 'super-admin', email: 'super@admin.com', password: '1234', role: 'superAdmin', displayName: 'Super Admin' },
        // Equus Fidei Users (Nave 7)
        { uid: 'user-farid-admin', email: 'admin@equus.com', password: '1234', role: 'tenantAdmin', tenantIds: ['equus-fidei', 'nave-6'], displayName: 'Farid Bogonos' },
        { uid: 'user-agustin', email: 'agustin@mail.com', password: '1234', role: 'tenantAdmin', tenantIds: ['haras-test'], displayName: 'Agustin Amicone' },
        { uid: 'user-farid', email: 'farid@mail.com', password: '1234', role: 'client', tenantId: 'equus-fidei', displayName: 'Farid (Cliente)' },
        { uid: 'user-antonella', email: 'antonella@mail.com', password: '1234', role: 'client', tenantId: 'equus-fidei', displayName: 'Antonella' },
        { uid: 'user-roberta', email: 'roberta@mail.com', password: '1234', role: 'client', tenantId: 'equus-fidei', displayName: 'Roberta' },
        { uid: 'user-jacquelline', email: 'jacquelline@mail.com', password: '1234', role: 'client', tenantId: 'equus-fidei', displayName: 'Jacquelline' },
        // Staff Nave 7
        { uid: 'staff-rodrigo', email: 'rodrigo@equus.com', password: '1234', role: 'staff', tenantId: 'equus-fidei', displayName: 'Roro', phoneNumber: '1134541568', salary: 500000 },
        { uid: 'staff-farid-groom', email: 'huguito@equus.com', password: '1234', role: 'staff', tenantId: 'equus-fidei', displayName: 'Huguito (Caballerizo)', phoneNumber: '1134541568', salary: 450000 },
        { uid: 'staff-alan', email: 'alan@equus.com', password: '1234', role: 'staff', tenantId: 'equus-fidei', displayName: 'Alan (Caballerizo)', phoneNumber: '1134541568', salary: 450000 },
        // Nave 6 Users
        { uid: 'admin-nave6', email: 'admin@nave6.com', password: '1234', role: 'tenantAdmin', tenantId: 'nave-6', displayName: 'Admin Nave 6' },
        { uid: 'staff-juan', email: 'juan@nave6.com', password: '1234', role: 'staff', tenantId: 'nave-6', displayName: 'Juan (Petisero)', salary: 450000 },
        { uid: 'client-n6-1', email: 'pedro@mail.com', password: '1234', role: 'client', tenantId: 'nave-6', displayName: 'Pedro' },
        { uid: 'client-n6-2', email: 'ana@mail.com', password: '1234', role: 'client', tenantId: 'nave-6', displayName: 'Ana' },
        { uid: 'client-n6-3', email: 'luis@mail.com', password: '1234', role: 'client', tenantId: 'nave-6', displayName: 'Luis' },
        // Haras Test
        { uid: 'admin-haras', email: 'admin@haras.com', password: '1234', role: 'tenantAdmin', tenantId: 'haras-test', displayName: 'Admin Haras Test' }
    ]
};

// --- Persistence Helpers ---
const DB_KEY = 'eques_db_v7'; // Incremented to V7 to include horse locations

const getDB = () => {
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) {
        localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DATA));
        return INITIAL_DATA;
    }
    return JSON.parse(stored);
};

const saveDB = (data) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
};

export const resetDB = () => {
    localStorage.removeItem(DB_KEY);
    window.location.reload();
};

// --- Exports ---
export const getCollection = (collection) => getDB()[collection] || [];
export const getTenants = () => getDB().TENANTS;

// Legacy export for compatibility (Dynamic now)
export const USERS = []; // Deprecated, use getCollection('USERS')

// --- Auth Simulation ---
let currentUser = null;
const authListeners = [];

export const auth = {
    signInWithEmailAndPassword: async (email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = getCollection('USERS');
                const user = users.find(u => u.email === email && u.password === password);
                if (user) {
                    currentUser = { ...user };
                    notifyListeners();
                    resolve({ user: currentUser });
                } else {
                    reject({ code: 'auth/invalid-credentials', message: 'Credenciales inválidas' });
                }
            }, 300);
        });
    },
    signOut: async () => {
        return new Promise((resolve) => {
            currentUser = null;
            notifyListeners();
            resolve();
        });
    },
    onAuthStateChanged: (callback) => {
        authListeners.push(callback);
        callback(currentUser);
        return () => { };
    }
};

function notifyListeners() {
    authListeners.forEach(l => l(currentUser));
}

// --- Actions ---
export const dbActions = {
    add: (collection, item) => {
        const db = getDB();
        if (!db[collection]) db[collection] = [];
        db[collection].push(item);
        saveDB(db);
        return item;
    },
    update: (collection, itemId, data) => {
        const db = getDB();
        const idx = db[collection].findIndex(i => i.id === itemId || i.uid === itemId);
        if (idx > -1) {
            db[collection][idx] = { ...db[collection][idx], ...data };
            saveDB(db);
        }
    },
    updateTenant: (tenantId, data) => {
        const db = getDB();
        if (db.TENANTS[tenantId]) {
            db.TENANTS[tenantId] = { ...db.TENANTS[tenantId], ...data };
            saveDB(db);
        }
    },
    delete: (collection, itemId) => {
        const db = getDB();
        if (db[collection]) {
            db[collection] = db[collection].filter(i => i.id !== itemId);
            saveDB(db);
        }
    },
    addTenant: (tenant) => {
        const db = getDB();
        if (db.TENANTS) {
            db.TENANTS[tenant.id] = tenant;
            saveDB(db);
        }
    }
};
