import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, deleteDoc, writeBatch, arrayUnion, arrayRemove, serverTimestamp, getDoc, deleteField } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { secondaryAuth } from '../services/secondaryApp';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { MONTHLY_DUE_DAY } from '../services/config';

const DataContext = createContext();

export function useData() {
    return useContext(DataContext);
}

export function DataProvider({ children }) {
    const { currentTenant, currentUser } = useAuth();
    const { notify } = useNotification();

    const [spaces, setSpaces] = useState([]);
    const [horses, setHorses] = useState([]);
    const [finances, setFinances] = useState([]);
    const [logs, setLogs] = useState([]);
    const [requests, setRequests] = useState([]);
    const [routines, setRoutines] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [tenantUsers, setTenantUsers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [inventoryLogs, setInventoryLogs] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [servicesCatalog, setServicesCatalog] = useState([]);
    const [payrollAdvances, setPayrollAdvances] = useState([]);
    const [events, setEvents] = useState([]);
    const [healthRecords, setHealthRecords] = useState([]);
    const [healthBooklets, setHealthBooklets] = useState([]);
    const [directoryContacts, setDirectoryContacts] = useState([]);
    const [tenantSettings, setTenantSettings] = useState(null);
    const [equipmentItems, setEquipmentItems] = useState([]);
    const [tenantRoles, setTenantRoles] = useState([]);

    // Initial Load & Real-time Subscription via onSnapshot
    useEffect(() => {
        if (!currentTenant) {
            setSpaces([]); setHorses([]); setFinances([]); setLogs([]); setRequests([]);
            setRoutines([]); setPricingPlans([]); setShifts([]); setTenantUsers([]);
            setInventory([]); setInventoryLogs([]); setServicesCatalog([]); setPayrollAdvances([]);
            setEvents([]); setHealthRecords([]); setHealthBooklets([]); setDirectoryContacts([]);
            setTenantSettings(null);
            setEquipmentItems([]);
            setTenantRoles([]);
            setNotifications([]);
            return;
        }

        if (!db) {
            console.error("Firestore database no inicializada (db es undefined).");
            return;
        }

        if (!currentUser) {
            setSpaces([]); setHorses([]); setFinances([]); setLogs([]); setRequests([]);
            setLoading(false);
            return;
        }

        if (!db || !currentUser) {
            setLoading(false);
            return;
        }

        setTenantSettings(currentTenant);
        setLoading(true);

        let isMounted = true;
        const unsubs = [];

        let hLoaded = false;
        let sLoaded = false;
        const checkLoad = () => {
            if (hLoaded && sLoaded && isMounted) setLoading(false);
        };

        const subscribe = (collName, setFn, extraConstraints = [], onFirstLoad = null) => {
            const q = query(collection(db, collName), where("tenantId", "==", currentTenant.id), ...extraConstraints);
            return onSnapshot(q, snap => {
                setFn(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                if (onFirstLoad) {
                    onFirstLoad();
                    onFirstLoad = null;
                }
            }, (error) => {
                console.error(`Error subscribing to ${collName}:`, error);
                if (onFirstLoad) { onFirstLoad(); onFirstLoad = null; }
            });
        };

        unsubs.push(subscribe('SPACES', setSpaces, [], () => { sLoaded = true; checkLoad(); }));
        unsubs.push(subscribe('HORSES', setHorses, [], () => { hLoaded = true; checkLoad(); }));
        
        if (currentUser?.role === 'client') {
            unsubs.push(subscribe('FINANCES', setFinances, [where('clientId', '==', currentUser.uid)]));
        } else {
            unsubs.push(subscribe('FINANCES', setFinances));
        }
        unsubs.push(subscribe('LOGS', setLogs));
        if (currentUser?.role === 'client') {
            unsubs.push(subscribe('REQUESTS', setRequests, [where('clientId', '==', currentUser.uid)]));
        } else {
            unsubs.push(subscribe('REQUESTS', setRequests));
        }
        unsubs.push(subscribe('ROUTINES', setRoutines));
        unsubs.push(subscribe('PRICING_PLANS', setPricingPlans));
        unsubs.push(subscribe('SHIFTS', setShifts));
        unsubs.push(subscribe('INVENTORY', setInventory));
        unsubs.push(subscribe('INVENTORY_LOGS', setInventoryLogs));
        unsubs.push(subscribe('SERVICES_CATALOG', setServicesCatalog));
        
        if (currentUser.role === 'staff') {
            unsubs.push(subscribe('PAYROLL_ADVANCES', setPayrollAdvances, [where("staffId", "==", currentUser.uid)]));
        } else if (currentUser.role !== 'client') {
            unsubs.push(subscribe('PAYROLL_ADVANCES', setPayrollAdvances));
        }

        unsubs.push(subscribe('EVENTS', setEvents));
        unsubs.push(subscribe('HEALTH_RECORDS', setHealthRecords));
        unsubs.push(subscribe('HORSE_HEALTH_BOOKLETS', setHealthBooklets));
        unsubs.push(subscribe('DIRECTORY', setDirectoryContacts));
        unsubs.push(subscribe('USERS', setTenantUsers));
        unsubs.push(subscribe('TENANT_ROLES', setTenantRoles));
        if (currentUser?.role !== 'client') {
            unsubs.push(subscribe('EQUIPMENT_ITEMS', setEquipmentItems));
        }

        if (currentUser) {
            const validRecipients = [currentUser.uid];
            if (['tenantAdmin', 'superAdmin'].includes(currentUser.role)) {
                validRecipients.push('ALL_ADMINS');
            }

            const notifQ = query(
                collection(db, 'NOTIFICATIONS'),
                where('recipientId', 'in', validRecipients)
            );
            unsubs.push(onSnapshot(notifQ, snap => {
                setNotifications(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            }));
        }

        return () => {
            isMounted = false;
            unsubs.forEach(unsub => unsub());
        };
    }, [currentTenant?.id, currentUser?.uid, currentUser?.role]);

    // Suscripción específica de EQUIPMENT_ITEMS para clientes
    useEffect(() => {
        if (!currentTenant?.id || !currentUser?.uid || currentUser.role !== 'client') return;
        
        const adminUids = tenantUsers.filter(u => u.role === 'tenantAdmin').map(u => u.uid);
        const allowedUids = [currentUser.uid, ...adminUids].slice(0, 10);
        
        const q = query(
            collection(db, 'EQUIPMENT_ITEMS'),
            where("tenantId", "==", currentTenant.id),
            where("ownerId", "in", allowedUids)
        );
        
        const unsub = onSnapshot(q, snap => {
            setEquipmentItems(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
        
        return () => unsub();
    }, [currentTenant?.id, currentUser?.uid, currentUser?.role, tenantUsers]);

    // --- Actions (Firebase Writes) ---

    const addHorse = async (horseData) => {
        try {
            await addDoc(collection(db, 'HORSES'), {
                tenantId: currentTenant.id,
                archived: false,
                status: 'activo',
                ...horseData
            });
            notify('Caballo registrado exitosamente', 'success');
        } catch(e) { console.error(e); notify("Error", "error"); }
    };

    const assignHorseToSpace = async (spaceId, horseId) => {
        await updateDoc(doc(db, 'SPACES', spaceId), { status: 'occupied', horseId });
        notify('Caballo asignado al espacio', 'success');
    };

    const updateSpaceStatus = async (spaceId, status) => {
        await updateDoc(doc(db, 'SPACES', spaceId), { status });
    };

    const updateBanner = async (text, imageUrl) => {
        if (!currentTenant) return;
        await updateDoc(doc(db, 'TENANTS', currentTenant.id), { bannerText: text, bannerImage: imageUrl });
        notify('Configuración actualizada', 'success');
    };

    const addLog = async (logData, customMsg) => {
        await addDoc(collection(db, 'LOGS'), {
            tenantId: currentTenant.id,
            timestamp: new Date().toISOString(),
            staffName: currentUser?.displayName || 'Unknown Staff',
            ...logData
        });
        notify(customMsg || 'Registro guardado exitosamente', 'success');
    };

    const createServiceRequest = async ({ clientId, horseId, serviceId, serviceName, category, details, timeRequested, price, autoApprove }) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        if (!clientId || !horseId || !serviceId) return { success: false, error: 'Datos incompletos.' };
        
        try {
            const status = autoApprove ? 'pending_staff' : 'pending_admin';
            
            const requestRef = await addDoc(collection(db, 'REQUESTS'), {
                tenantId: currentTenant.id,
                clientId,
                horseId,
                type: serviceName,
                serviceId,
                category,
                details: details || '',
                timeRequested: timeRequested || '',
                price: Number(price || 0),
                assigneeId: null,
                status,
                autoApprove,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString()
            });
            
            const staffList = tenantUsers.filter(u => u.role === 'staff');
            const horse = horses.find(h => h.id === horseId);
            const horseName = horse?.name || 'tu caballo';
            
            const notifPromises = staffList.map(staff => 
                sendNotification(
                    staff.uid,
                    `Nueva solicitud: ${serviceName} para ${horseName}`,
                    'service_request'
                )
            );
            await Promise.all(notifPromises);
            
            notify('Solicitud de servicio enviada', 'success');
            
            return { success: true, requestId: requestRef.id };
        } catch (error) {
            console.error('Error al crear service request:', error);
            return { success: false, error: error.code || error.message };
        }
    };

    const getActiveRequestsForClient = (clientId) => {
        return requests
            .filter(r => r.clientId === clientId && (r.status === 'pending_staff' || r.status === 'pending_admin' || r.status === 'in_progress'))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const cancelServiceRequest = async (requestId) => {
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };
        
        try {
            const reqRef = doc(db, 'REQUESTS', requestId);
            const reqSnap = await getDoc(reqRef);
            if (!reqSnap.exists()) return { success: false, error: 'Solicitud no encontrada.' };
            
            const data = reqSnap.data();
            
            if (data.status !== 'pending_staff' && data.status !== 'pending_admin') {
                return { success: false, error: 'No se puede cancelar una solicitud ya en progreso.' };
            }
            
            if (data.clientId !== currentUser.uid) {
                return { success: false, error: 'No autorizado.' };
            }
            
            await updateDoc(reqRef, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: currentUser.uid
            });
            
            notify('Solicitud cancelada', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error cancelar:', error);
            return { success: false, error: error.code || error.message };
        }
    };

    const createSupplyRequest = async (requestData) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        
        try {
            await addDoc(collection(db, 'REQUESTS'), {
                tenantId: currentTenant.id,
                date: new Date().toISOString(),
                status: 'pending',
                ...requestData
            });
            
            const adminList = tenantUsers.filter(u => u.role === 'tenantAdmin');
            const notifPromises = adminList.map(admin =>
                sendNotification(
                    admin.uid,
                    `Nuevo pedido de insumos de ${currentUser?.displayName || 'Personal'}`,
                    'info'
                )
            );
            await Promise.all(notifPromises);
            
            notify('Pedido de insumos enviado', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error al crear supply request:', error);
            return { success: false, error: error.code || error.message };
        }
    };

    const [healthAlertsChecked, setHealthAlertsChecked] = useState(false);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'tenantAdmin') return;
        if (healthRecords.length === 0 || horses.length === 0 || healthAlertsChecked) return;

        let sentAny = false;

        healthRecords.forEach(record => {
            if (record.nextDueDate) {
                const dueDate = new Date(record.nextDueDate);
                const now = new Date();
                const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays <= 7) {
                    const horse = horses.find(h => h.id === record.horseId);
                    if (horse && !horse.archived) {
                        const typeName = record.type ? record.type.replace('_', ' ') : 'evento';
                        const formattedDate = record.nextDueDate.split('-').reverse().join('/');
                        const message = `Alerta Sanitaria: ${typeName} de ${horse.name} vence en ${diffDays === 0 ? 'hoy' : `${diffDays} días`} (${formattedDate})`;
                        
                        const alreadySentAdmin = notifications.some(n => n.message === message && n.recipientId === 'ALL_ADMINS');
                        
                        if (!alreadySentAdmin) {
                            sendNotification('ALL_ADMINS', message, 'warning');
                            if (horse.ownerId) {
                                sendNotification(horse.ownerId, message, 'warning');
                            }
                            sentAny = true;
                        }
                    }
                }
            }
        });

        setHealthAlertsChecked(true);
        
    }, [healthRecords, horses, notifications, currentUser, healthAlertsChecked]);

    const createEquipmentItem = async ({ name, type, brand, condition, usage, notes }) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };
        if (!name || !type || !condition || !usage) return { success: false, error: 'Campos obligatorios faltantes.' };
        
        try {
            const itemRef = await addDoc(collection(db, 'EQUIPMENT_ITEMS'), {
                tenantId: currentTenant.id,
                ownerId: currentUser.uid,
                name: name.trim(),
                type,
                brand: brand?.trim() || null,
                condition,
                usage,
                photoUrl: null,
                photoPath: null,
                notes: notes?.trim() || null,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                updatedAt: null
            });
            
            notify('Item agregado', 'success');
            return { success: true, itemId: itemRef.id };
        } catch (error) {
            console.error('Error al crear equipment item:', error);
            return { success: false, error: error.code || error.message };
        }
    };

    const updateEquipmentItem = async (itemId, updates) => {
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };
        
        try {
            const itemRef = doc(db, 'EQUIPMENT_ITEMS', itemId);
            const itemSnap = await getDoc(itemRef);
            if (!itemSnap.exists()) return { success: false, error: 'Item no encontrado.' };
            
            const data = itemSnap.data();
            if (data.ownerId !== currentUser.uid) return { success: false, error: 'No autorizado.' };
            
            const safeUpdates = { ...updates };
            delete safeUpdates.ownerId;
            delete safeUpdates.tenantId;
            delete safeUpdates.createdAt;
            delete safeUpdates.createdBy;
            
            if (safeUpdates.brand !== undefined) safeUpdates.brand = safeUpdates.brand?.trim() || null;
            if (safeUpdates.notes !== undefined) safeUpdates.notes = safeUpdates.notes?.trim() || null;
            if (safeUpdates.name !== undefined) safeUpdates.name = safeUpdates.name.trim();
            
            safeUpdates.updatedAt = serverTimestamp();
            
            await updateDoc(itemRef, safeUpdates);
            notify('Item actualizado', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar equipment item:', error);
            return { success: false, error: error.code || error.message };
        }
    };

    const deleteEquipmentItem = async (itemId) => {
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };
        
        try {
            const itemRef = doc(db, 'EQUIPMENT_ITEMS', itemId);
            const itemSnap = await getDoc(itemRef);
            if (!itemSnap.exists()) return { success: false, error: 'Item no encontrado.' };
            
            const data = itemSnap.data();
            if (data.ownerId !== currentUser.uid) return { success: false, error: 'No autorizado.' };
            
            await deleteDoc(itemRef);
            notify('Item eliminado', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar equipment item:', error);
            return { success: false, error: error.code || error.message };
        }
    };

    const getMyEquipmentItems = () => {
        if (!currentUser?.uid) return [];
        return equipmentItems
            .filter(item => item.ownerId === currentUser.uid)
            .sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
                const timeB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
                return timeB - timeA;
            });
    };

    const getEquipmentItemsByTenantAdmins = () => {
        const adminUids = tenantUsers.filter(u => u.role === 'tenantAdmin').map(u => u.uid);
        return equipmentItems
            .filter(item => adminUids.includes(item.ownerId))
            .sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
                const timeB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
                return timeB - timeA;
            });
    };

    const addRequest = async (requestData) => {
        await addDoc(collection(db, 'REQUESTS'), {
            tenantId: currentTenant.id,
            date: new Date().toISOString(),
            status: 'pending',
            ...requestData
        });
        const adminList = tenantUsers.filter(u => u.role === 'tenantAdmin');
        const notifPromises = adminList.map(admin =>
            sendNotification(
                admin.uid,
                `Nuevo pedido de insumos de ${currentUser?.displayName || 'Personal'}`,
                'info'
            )
        );
        await Promise.all(notifPromises);
        notify('Solicitud enviada exitosamente', 'success');
    };

    const addRoutine = async (routineData) => {
        await addDoc(collection(db, 'ROUTINES'), {
            tenantId: currentTenant.id,
            ...routineData
        });
        notify('Rutina creada', 'success');
    };

    const addPricingPlan = async (planData) => {
        await addDoc(collection(db, 'PRICING_PLANS'), {
            tenantId: currentTenant.id,
            ...planData
        });
        notify('Plan de precios creado', 'success');
    };

    const addEvent = async (eventData) => {
        await addDoc(collection(db, 'EVENTS'), {
            tenantId: currentTenant.id,
            ...eventData
        });
        notify('Evento creado exitosamente', 'success');
    };

    const addShift = async (shiftData) => {
        await addDoc(collection(db, 'SHIFTS'), {
            tenantId: currentTenant.id,
            ...shiftData
        });
        notify('Turno asignado correctamente', 'success');
    };

    const deleteShift = async (shiftId) => {
        await deleteDoc(doc(db, 'SHIFTS', shiftId));
        notify('Turno eliminado', 'success');
    };

    const deleteRow = async (coll, id) => {
        try {
            await deleteDoc(doc(db, coll, id));
            notify('Registro eliminado correctamente', 'success');
        } catch (e) {
            console.error(e);
            notify('Error al eliminar', 'error');
        }
    };

    const addPayment = async (paymentData) => {
        await addDoc(collection(db, 'FINANCES'), {
            tenantId: currentTenant.id,
            date: new Date().toISOString(),
            type: 'income',
            status: 'paid',
            ...paymentData
        });
        notify('Pago registrado', 'success');
    };

    const addTenant = async (tenantData) => {
        await setDoc(doc(db, 'TENANTS', tenantData.id), tenantData);
        notify('Tenant creado exitosamente', 'success');
    };

    const addUser = async (userData) => {
        await setDoc(doc(db, 'USERS', userData.uid || userData.email), userData);
        notify('Usuario añadido a BDD', 'success');
    };

    const updateUser = async (uid, updates) => {
        try {
            await updateDoc(doc(db, 'USERS', uid), updates);
            notify('Usuario actualizado', 'success');
        } catch (e) {
            console.error(e);
            notify('Error al actualizar usuario', 'error');
        }
    };

    const addRole = async (roleData) => {
        try {
            await addDoc(collection(db, 'TENANT_ROLES'), {
                tenantId: currentTenant.id,
                ...roleData
            });
            notify('Rol creado exitosamente', 'success');
        } catch (e) {
            console.error(e);
            notify('Error al crear rol', 'error');
        }
    };

    const updateRole = async (roleId, updates) => {
        try {
            await updateDoc(doc(db, 'TENANT_ROLES', roleId), updates);
            notify('Rol actualizado', 'success');
        } catch (e) {
            console.error(e);
            notify('Error al actualizar rol', 'error');
        }
    };

    const setRole = async (roleId, roleData) => {
        try {
            await setDoc(doc(db, 'TENANT_ROLES', roleId), {
                tenantId: currentTenant.id,
                ...roleData
            });
            notify('Rol guardado exitosamente', 'success');
        } catch (e) {
            console.error(e);
            notify('Error al configurar rol', 'error');
        }
    };

    const deleteRole = async (roleId) => {
        try {
            await deleteDoc(doc(db, 'TENANT_ROLES', roleId));
            notify('Rol eliminado', 'success');
        } catch (e) {
            console.error(e);
            notify('Error al eliminar rol', 'error');
        }
    };

    const addSpace = async (spaceData) => {
        await addDoc(collection(db, 'SPACES'), {
            tenantId: currentTenant.id,
            status: 'available',
            type: 'box',
            ...spaceData
        });
        notify('Espacio creado correctamente', 'success');
    };

    const addInventoryItem = async (itemData) => {
        await addDoc(collection(db, 'INVENTORY'), {
            tenantId: currentTenant.id,
            stock: 0,
            ...itemData
        });
        notify('Item de inventario creado', 'success');
    };

    const logStockUsage = async (itemId, quantity, reason, userName) => {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'Item no encontrado' };

        const oldStock = Number(item.stock);
        const newStock = Math.max(0, oldStock - Number(quantity));

        await updateDoc(doc(db, 'INVENTORY', itemId), { stock: newStock });

        await addDoc(collection(db, 'INVENTORY_LOGS'), {
            tenantId: currentTenant.id,
            itemId,
            itemName: item.name,
            quantity: Number(quantity),
            userId: userName,
            reason,
            date: new Date().toISOString(),
            remainingStock: newStock
        });

        if (newStock <= (item.minStock || 0)) {
            sendNotification('ALL_ADMINS', `🚨 Alerta: Stock crítico de ${item.name} (${newStock} restantes)`, 'warning');
        }

        return { success: true, oldStock, newStock, itemName: item.name };
    };

    const updateStock = async (itemId, newStock, reason = 'Ajuste manual') => {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        const oldStock = Number(item.stock);
        const diff = Number(newStock) - oldStock;

        await updateDoc(doc(db, 'INVENTORY', itemId), { stock: Number(newStock) });
        
        await addDoc(collection(db, 'INVENTORY_LOGS'), {
            tenantId: currentTenant.id,
            itemId,
            itemName: item.name,
            quantity: Math.abs(diff),
            type: diff > 0 ? 'restock' : 'usage',
            userId: currentUser?.displayName || 'Admin',
            reason,
            date: new Date().toISOString(),
            remainingStock: Number(newStock)
        });

        notify('Stock actualizado y registrado', 'success');
    };

    const getLogsForHorse = (horseId) => {
        return logs.filter(l => l.horseId === horseId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const getFinanceForUser = (userId) => {
        return finances
            .filter(f => f.clientId === userId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const getPendingChargesForUser = (userId) => {
        return finances
            .filter(f => f.clientId === userId && f.status === 'pending')
            .sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
    };

    const getPaidChargesForUser = (userId) => {
        return finances
            .filter(f => f.clientId === userId && f.status === 'paid')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const sendNotification = async (recipientId, message, type = 'info') => {
        await addDoc(collection(db, 'NOTIFICATIONS'), {
            recipientId,
            message,
            type,
            read: false,
            timestamp: new Date().toISOString(),
            tenantId: currentTenant ? currentTenant.id : null
        });
    };

    const markAsRead = async (notifId) => {
        await updateDoc(doc(db, 'NOTIFICATIONS', notifId), { read: true });
    };

    const updateUserSalary = async (userId, newSalary) => {
        await updateDoc(doc(db, 'USERS', userId), { salary: Number(newSalary) });
        notify('Sueldo actualizado exitosamente', 'success');
    };

    const addAdvance = async (advanceData) => {
        await addDoc(collection(db, 'PAYROLL_ADVANCES'), {
            tenantId: currentTenant.id,
            date: new Date().toISOString(),
            ...advanceData
        });
        sendNotification(advanceData.staffId, `Se te ha registrado un adelanto de sueldo por $${advanceData.amount}`, 'info');
        notify('Adelanto procesado y notificado', 'success');
    };

    const assignSpaceToStaff = async (spaceId, staffId) => {
        await updateDoc(doc(db, 'SPACES', spaceId), { staffId: staffId || null });
    };

    const updateHorseLocation = async (horseId, location) => {
        await updateDoc(doc(db, 'HORSES', horseId), { location });
    };

    const updateRow = async (coll, id, data) => {
        await updateDoc(doc(db, coll, id), data);
    };

    const releaseSpace = async (spaceId) => {
        try {
            await updateDoc(doc(db, 'SPACES', spaceId), {
                status: 'available',
                horseId: null,
            });
            notify('Espacio liberado', 'success');
            return { success: true };
        } catch (e) {
            console.error(e);
            notify('Error al liberar el espacio', 'error');
            return { success: false, error: e };
        }
    };

    const archiveHorse = async (horseId, archived, reason = '') => {
        try {
            const batch = writeBatch(db);
            const horseRef = doc(db, 'HORSES', horseId);
            const logRef = doc(collection(db, 'LOGS'));

            if (archived) {
                const horseSpace = spaces.find(s => s.horseId === horseId);
                batch.update(horseRef, {
                    archived: true,
                    archivedAt: new Date().toISOString(),
                    archivedReason: reason || null,
                });

                if (horseSpace) {
                    batch.update(doc(db, 'SPACES', horseSpace.id), {
                        status: 'available',
                        horseId: null,
                    });
                }

                batch.set(logRef, {
                    tenantId: currentTenant.id,
                    timestamp: new Date().toISOString(),
                    staffName: currentUser?.displayName || 'Sistema',
                    type: 'horse_archived',
                    horseId,
                    details: `Caballo archivado${reason ? ': ' + reason : ''}`,
                });
            } else {
                batch.update(horseRef, {
                    archived: false,
                    archivedAt: null,
                    archivedReason: null,
                });

                batch.set(logRef, {
                    tenantId: currentTenant.id,
                    timestamp: new Date().toISOString(),
                    staffName: currentUser?.displayName || 'Sistema',
                    type: 'horse_unarchived',
                    horseId,
                    details: 'Caballo desarchivado (reactivado)',
                });
            }

            await batch.commit();

            notify(
                archived ? 'Caballo archivado correctamente' : 'Caballo reactivado correctamente',
                'success'
            );
            return { success: true };
        } catch (e) {
            console.error(e);
            notify(
                archived ? 'Error al archivar el caballo' : 'Error al reactivar el caballo',
                'error'
            );
            return { success: false, error: e };
        }
    };

    const updateHorseStatus = async (horseId, status) => {
        try {
            const batch = writeBatch(db);
            const horseRef = doc(db, 'HORSES', horseId);
            const logRef = doc(collection(db, 'LOGS'));

            batch.update(horseRef, {
                status,
            });

            batch.set(logRef, {
                tenantId: currentTenant.id,
                timestamp: new Date().toISOString(),
                staffName: currentUser?.displayName || 'Sistema',
                type: 'horse_status_changed',
                horseId,
                details: `Estado del caballo cambiado a ${status}`,
            });

            await batch.commit();
            notify(`Estado actualizado a ${status}`, 'success');
            return { success: true };
        } catch (e) {
            console.error(e);
            notify('Error al actualizar el estado del caballo', 'error');
            return { success: false, error: e };
        }
    };
    
    const assignPlanToHorse = async (horseId, planId) => {
        if (!horseId || !planId) {
            return { success: false, error: new Error('horseId y planId no pueden estar vacíos') };
        }
        const plan = (pricingPlans || []).find(p => p.id === planId);
        if (!plan) {
            return { success: false, error: new Error(`El plan con ID ${planId} no existe para este tenant`) };
        }

        try {
            const batch = writeBatch(db);
            const horseRef = doc(db, 'HORSES', horseId);
            const logRef = doc(collection(db, 'LOGS'));

            batch.update(horseRef, {
                assignedPlanIds: arrayUnion(planId),
                [`planPricesSnapshot.${planId}`]: plan.price,
                updatedAt: serverTimestamp()
            });

            batch.set(logRef, {
                tenantId: currentTenant.id,
                horseId,
                planId,
                type: 'horse_plan_assigned',
                by: currentUser.uid,
                staffName: currentUser?.displayName || 'Sistema',
                timestamp: serverTimestamp(),
                details: `Plan asignado: ${plan.name}`
            });

            await batch.commit();
            notify(`Plan "${plan.name}" asignado correctamente`, 'success');
            return { success: true };
        } catch (e) {
            console.error('[D2 assignPlanToHorse] Error:', e);
            notify('Error al asignar el plan', 'error');
            return { success: false, error: e };
        }
    };

    const removePlanFromHorse = async (horseId, planId) => {
        if (!horseId || !planId) {
            return { success: false, error: new Error('horseId y planId no pueden estar vacíos') };
        }
        const plan = (pricingPlans || []).find(p => p.id === planId);

        try {
            const batch = writeBatch(db);
            const horseRef = doc(db, 'HORSES', horseId);
            const logRef = doc(collection(db, 'LOGS'));

            batch.update(horseRef, {
                assignedPlanIds: arrayRemove(planId),
                [`planPricesSnapshot.${planId}`]: deleteField(),
                updatedAt: serverTimestamp()
            });

            batch.set(logRef, {
                tenantId: currentTenant.id,
                horseId,
                planId,
                type: 'horse_plan_unassigned',
                by: currentUser.uid,
                staffName: currentUser?.displayName || 'Sistema',
                timestamp: serverTimestamp(),
                details: `Plan quitado: ${plan?.name || planId}`
            });

            await batch.commit();
            notify(`Plan "${plan?.name || planId}" quitado correctamente`, 'success');
            return { success: true };
        } catch (e) {
            console.error('[D2 removePlanFromHorse] Error:', e);
            notify('Error al quitar el plan', 'error');
            return { success: false, error: e };
        }
    };


    const moveHorseToSpace = async (horseId, fromSpaceId, toSpaceId) => {
        try {
            const fromSpace = spaces.find(s => s.id === fromSpaceId);
            const toSpace = spaces.find(s => s.id === toSpaceId);

            if (!toSpace) {
                notify('Espacio destino no encontrado', 'error');
                return { success: false };
            }

            const isSwap = toSpace.status === 'occupied' && toSpace.horseId;
            const swappedHorseId = isSwap ? toSpace.horseId : null;

            await updateDoc(doc(db, 'SPACES', toSpaceId), {
                status: 'occupied',
                horseId,
            });

            if (fromSpaceId) {
                if (isSwap) {
                    await updateDoc(doc(db, 'SPACES', fromSpaceId), {
                        status: 'occupied',
                        horseId: swappedHorseId,
                    });
                } else {
                    await updateDoc(doc(db, 'SPACES', fromSpaceId), {
                        status: 'available',
                        horseId: null,
                    });
                }
            }

            const newLocation = toSpace.type === 'box' ? 'box' : toSpace.type;
            await updateDoc(doc(db, 'HORSES', horseId), { location: newLocation });

            if (isSwap && fromSpace) {
                const swappedLocation = fromSpace.type === 'box' ? 'box' : fromSpace.type;
                await updateDoc(doc(db, 'HORSES', swappedHorseId), { location: swappedLocation });
            }

            const fromName = fromSpace?.name || 'sin asignar';
            const toName = toSpace.name;
            const logDetails = isSwap
                ? `Enroque: ${fromName} ↔ ${toName}`
                : `Movido de ${fromName} a ${toName}`;

            await addDoc(collection(db, 'LOGS'), {
                tenantId: currentTenant.id,
                timestamp: new Date().toISOString(),
                staffName: currentUser?.displayName || 'Sistema',
                type: 'horse_moved',
                horseId,
                details: logDetails,
            });

            const horse = horses.find(h => h.id === horseId);
            if (horse?.ownerId) {
                await addDoc(collection(db, 'NOTIFICATIONS'), {
                    tenantId: currentTenant.id,
                    recipientId: horse.ownerId,
                    timestamp: new Date().toISOString(),
                    message: `Tu caballo ${horse.name} fue movido a ${toName}`,
                    type: 'horse_moved',
                    read: false,
                });
            }

            if (isSwap) {
                const swappedHorse = horses.find(h => h.id === swappedHorseId);
                if (swappedHorse?.ownerId) {
                    await addDoc(collection(db, 'NOTIFICATIONS'), {
                        tenantId: currentTenant.id,
                        recipientId: swappedHorse.ownerId,
                        timestamp: new Date().toISOString(),
                        message: `Tu caballo ${swappedHorse.name} fue movido a ${fromName}`,
                        type: 'horse_moved',
                        read: false,
                    });
                }
            }

            notify(
                isSwap ? `Enroque realizado: ${fromName} ↔ ${toName}` : `Caballo movido a ${toName}`,
                'success'
            );
            return { success: true, isSwap };
        } catch (e) {
            console.error(e);
            notify('Error al mover el caballo', 'error');
            return { success: false, error: e };
        }
    };

    const createClientWithHorse = async ({ client, horse, spaceId }) => {
        try {
            const clientDocId = client.email || `client-${Date.now()}`;

            await setDoc(doc(db, 'USERS', clientDocId), {
                uid: clientDocId,
                email: client.email,
                displayName: client.displayName,
                phoneNumber: client.phoneNumber || '',
                role: 'client',
                tenantId: currentTenant.id,
                tenantIds: [currentTenant.id],
                createdAt: new Date().toISOString(),
            });

            const horseRef = await addDoc(collection(db, 'HORSES'), {
                tenantId: currentTenant.id,
                ownerId: clientDocId,
                archived: false,
                status: 'activo',
                location: 'box',
                ...horse,
            });

            if (spaceId) {
                await updateDoc(doc(db, 'SPACES', spaceId), {
                    status: 'occupied',
                    horseId: horseRef.id,
                });
            }

            await addDoc(collection(db, 'LOGS'), {
                tenantId: currentTenant.id,
                timestamp: new Date().toISOString(),
                staffName: currentUser?.displayName || 'Sistema',
                type: 'horse_admitted',
                horseId: horseRef.id,
                details: `Alta de ${horse.name} (dueño: ${client.displayName})`,
            });

            notify('Caballo y cliente registrados correctamente', 'success');
            return { success: true, horseId: horseRef.id, clientId: clientDocId };
        } catch (e) {
            console.error(e);
            notify('Error al registrar caballo', 'error');
            return { success: false, error: e };
        }
    };

    const assignExistingHorseToSpace = async (spaceId, horseId) => {
        try {
            const targetSpace = spaces.find(s => s.id === spaceId);
            if (!targetSpace) {
                notify('Espacio no encontrado', 'error');
                return { success: false };
            }

            await updateDoc(doc(db, 'SPACES', spaceId), {
                status: 'occupied',
                horseId,
            });

            const newLocation = targetSpace.type === 'box' ? 'box' : targetSpace.type;
            await updateDoc(doc(db, 'HORSES', horseId), { location: newLocation });

            notify('Caballo asignado al espacio', 'success');
            return { success: true };
        } catch (e) {
            console.error(e);
            notify('Error al asignar caballo', 'error');
            return { success: false, error: e };
        }
    };

    const createHealthRecord = async (data) => {
        try {
            await addDoc(collection(db, 'HEALTH_RECORDS'), {
                tenantId: currentTenant.id,
                createdAt: new Date().toISOString(),
                createdBy: currentUser?.uid || 'unknown',
                ...data
            });
            notify('Registro sanitario creado', 'success');
        } catch(e) { console.error(e); notify("Error al crear registro", "error"); }
    };

    const updateHealthRecord = async (id, data) => {
        try {
            await updateDoc(doc(db, 'HEALTH_RECORDS', id), data);
            notify('Registro sanitario actualizado', 'success');
        } catch(e) { console.error(e); notify("Error al actualizar", "error"); }
    };

    const deleteHealthRecord = async (id) => {
        if (!currentTenant?.id) return;
        try {
            await deleteDoc(doc(db, 'HEALTH_RECORDS', id));
        } catch (error) {
            console.error('Error in deleteHealthRecord:', error);
            throw error;
        }
    };

    const createContact = async (data) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        try {
            const newDoc = await addDoc(collection(db, 'DIRECTORY'), {
                ...data,
                tenantId: currentTenant.id,
                createdAt: new Date().toISOString()
            });
            return { success: true, id: newDoc.id };
        } catch (error) {
            console.error('Error in createContact:', error);
            return { success: false, error: error.message };
        }
    };

    const updateContact = async (id, data) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        try {
            await updateDoc(doc(db, 'DIRECTORY', id), data);
            return { success: true };
        } catch (error) {
            console.error('Error in updateContact:', error);
            return { success: false, error: error.message };
        }
    };

    const deleteContact = async (id) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        try {
            await deleteDoc(doc(db, 'DIRECTORY', id));
            return { success: true };
        } catch (error) {
            console.error('Error in deleteContact:', error);
            return { success: false, error: error.message };
        }
    };

    const upsertHealthBooklet = async (horseId, data) => {
        try {
            const existing = healthBooklets.find(b => b.horseId === horseId);
            if (existing) {
                await updateDoc(doc(db, 'HORSE_HEALTH_BOOKLETS', existing.id), {
                    ...data,
                    updatedAt: new Date().toISOString()
                });
                notify('Libreta actualizada', 'success');
            } else {
                await addDoc(collection(db, 'HORSE_HEALTH_BOOKLETS'), {
                    tenantId: currentTenant.id,
                    horseId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ...data
                });
                notify('Libreta creada', 'success');
            }
        } catch(e) { console.error(e); notify("Error al guardar libreta", "error"); }
    };

    const createOneTimeCharge = async ({ horse, amount, description, planId, date, markAsPaid }) => {
        if (!horse || !horse.id) return { success: false, error: 'Caballo inválido' };
        if (typeof amount !== 'number' || amount <= 0) return { success: false, error: 'Importe inválido' };
        if (!description || !description.trim()) return { success: false, error: 'Descripción obligatoria' };
        if (!date || typeof date !== 'string') return { success: false, error: 'Fecha inválida' };

        const clientId = horse.ownerId || null;
        const createdBy = currentUser?.uid || 'Unknown';
        
        try {
            const batch = writeBatch(db);
            
            const newChargeRef = doc(collection(db, 'FINANCES'));
            const chargeData = {
                tenantId: currentTenant.id,
                horseId: horse.id,
                clientId,
                type: 'income',
                status: markAsPaid ? 'paid' : 'pending',
                category: 'one-time',
                amount: Number(amount),
                description: description.trim(),
                planId: planId || null,
                date,
                createdAt: serverTimestamp(),
                paidAt: markAsPaid ? serverTimestamp() : null,
                createdBy,
            };
            batch.set(newChargeRef, chargeData);

            let paymentId = null;
            if (markAsPaid) {
                const newPaymentRef = doc(collection(db, 'FINANCES'));
                paymentId = newPaymentRef.id;
                batch.set(newPaymentRef, {
                    tenantId: currentTenant.id,
                    horseId: horse.id,
                    clientId,
                    type: 'payment',
                    status: 'paid',
                    amount: Number(amount),
                    description: `Pago: ${description.trim()}`,
                    category: 'Pago',
                    date,
                    paidAt: serverTimestamp(),
                    relatedChargeId: newChargeRef.id,
                    createdAt: serverTimestamp(),
                    createdBy,
                });
            }

            const newLogRef = doc(collection(db, 'LOGS'));
            if (markAsPaid) {
                batch.set(newLogRef, {
                    type: 'charge_created_paid',
                    tenantId: currentTenant.id,
                    horseId: horse.id,
                    chargeId: newChargeRef.id,
                    paymentId,
                    amount: Number(amount),
                    description: description.trim(),
                    planId: planId || null,
                    by: createdBy,
                    timestamp: serverTimestamp(),
                });
            } else {
                batch.set(newLogRef, {
                    type: 'charge_created',
                    tenantId: currentTenant.id,
                    horseId: horse.id,
                    chargeId: newChargeRef.id,
                    amount: Number(amount),
                    description: description.trim(),
                    planId: planId || null,
                    by: createdBy,
                    timestamp: serverTimestamp(),
                });
            }

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error al crear cargo único:', error);
            return { success: false, error: error.message };
        }
    };

    const settlePendingCharge = async (chargeId, note = '') => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };

        const charge = finances.find(f => f.id === chargeId);
        if (!charge) return { success: false, error: 'Cargo no encontrado.' };

        try {
            const nowIso = new Date().toISOString();
            const createdBy = currentUser.uid;
            const batch = writeBatch(db);

            const newPaymentRef = doc(collection(db, 'FINANCES'));
            const newPaymentId = newPaymentRef.id;

            batch.set(newPaymentRef, {
                type: 'payment',
                status: 'paid',
                amount: Number(charge.amount || 0),
                clientId: charge.clientId || null,
                horseId: charge.horseId || null,
                relatedChargeId: charge.id,
                description: `Pago: ${charge.description || charge.category || 'Cargo'}`,
                category: 'Pago',
                date: nowIso.slice(0, 10),
                paidAt: serverTimestamp(),
                note: note.trim() || null,
                tenantId: currentTenant.id,
                createdAt: serverTimestamp(),
                createdBy,
            });

            const chargeRef = doc(db, 'FINANCES', charge.id);
            batch.update(chargeRef, {
                status: 'paid',
                paidAt: serverTimestamp(),
                paidByPaymentId: newPaymentId,
            });

            const newLogRef = doc(collection(db, 'LOGS'));
            batch.set(newLogRef, {
                type: 'charge_settled',
                tenantId: currentTenant.id,
                horseId: charge.horseId || null,
                chargeId: charge.id,
                paymentId: newPaymentId,
                amount: Number(charge.amount || 0),
                description: charge.description || '',
                by: createdBy,
                staffName: currentUser.displayName || 'Administrador',
                timestamp: serverTimestamp(),
                note: note.trim() || null
            });

            if (charge.clientId) {
                const newNotifRef = doc(collection(db, 'NOTIFICATIONS'));
                batch.set(newNotifRef, {
                    recipientId: charge.clientId,
                    message: `Se ha registrado el pago de: ${charge.description || 'Cargo'} por valor de $${Number(charge.amount).toLocaleString()}`,
                    type: 'info',
                    read: false,
                    timestamp: new Date().toISOString(),
                    tenantId: currentTenant.id
                });
            }

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error al registrar cobro:', error);
            return { success: false, error: error.message };
        }
    };

    const settleMultiplePendingCharges = async (chargeIds, note = '') => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };
        if (!Array.isArray(chargeIds) || chargeIds.length === 0) return { success: false, error: 'Sin cargos seleccionados.' };

        try {
            const nowIso = new Date().toISOString();
            const createdBy = currentUser.uid;
            const batch = writeBatch(db);

            for (const chargeId of chargeIds) {
                const charge = finances.find(f => f.id === chargeId);
                if (!charge) continue;

                const newPaymentRef = doc(collection(db, 'FINANCES'));
                const newPaymentId = newPaymentRef.id;

                batch.set(newPaymentRef, {
                    type: 'payment',
                    status: 'paid',
                    amount: Number(charge.amount || 0),
                    clientId: charge.clientId || null,
                    horseId: charge.horseId || null,
                    relatedChargeId: charge.id,
                    description: `Pago: ${charge.description || charge.category || 'Cargo'}`,
                    category: 'Pago',
                    date: nowIso.slice(0, 10),
                    paidAt: serverTimestamp(),
                    note: note.trim() || null,
                    tenantId: currentTenant.id,
                    createdAt: serverTimestamp(),
                    createdBy,
                });

                const chargeRef = doc(db, 'FINANCES', charge.id);
                batch.update(chargeRef, {
                    status: 'paid',
                    paidAt: serverTimestamp(),
                    paidByPaymentId: newPaymentId,
                });

                const newLogRef = doc(collection(db, 'LOGS'));
                batch.set(newLogRef, {
                    type: 'charge_settled',
                    tenantId: currentTenant.id,
                    horseId: charge.horseId || null,
                    chargeId: charge.id,
                    paymentId: newPaymentId,
                    amount: Number(charge.amount || 0),
                    description: charge.description || '',
                    by: createdBy,
                    staffName: currentUser.displayName || 'Administrador',
                    timestamp: serverTimestamp(),
                    note: note.trim() || null
                });

                if (charge.clientId) {
                    const newNotifRef = doc(collection(db, 'NOTIFICATIONS'));
                    batch.set(newNotifRef, {
                        recipientId: charge.clientId,
                        message: `Se ha registrado el pago de: ${charge.description || 'Cargo'} por valor de $${Number(charge.amount).toLocaleString()}`,
                        type: 'info',
                        read: false,
                        timestamp: new Date().toISOString(),
                        tenantId: currentTenant.id
                    });
                }
            }

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error al registrar cobros múltiples:', error);
            return { success: false, error: error.message };
        }
    };


    const createClientWithHorses = async ({ client, horses }) => {
        if (!currentTenant?.id) {
            return { success: false, error: 'Tenant no detectado. Reiniciá sesión.' };
        }
        if (!currentUser?.uid) {
            return { success: false, error: 'Sesión inválida. Reiniciá sesión.' };
        }

        if (!client || !client.email || !client.password || !client.displayName || !client.phoneNumber) {
            return { success: false, error: 'Datos de cliente incompletos' };
        }
        if (!horses || horses.length === 0) {
            return { success: false, error: 'Debe ingresar al menos un caballo' };
        }
        for (const h of horses) {
            if (!h.name || !h.breed || h.age === undefined || h.age === '' || isNaN(Number(h.age)) || Number(h.age) < 0) {
                return { success: false, error: 'Datos de caballo incompletos o edad inválida' };
            }
        }

        let newAuthUser = null;

        try {
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, client.email, client.password);
            newAuthUser = userCred.user;
            const clientUid = newAuthUser.uid;

            await signOut(secondaryAuth);

            const batch = writeBatch(db);

            const userRef = doc(db, 'USERS', clientUid);
            batch.set(userRef, {
                uid: clientUid,
                email: client.email,
                displayName: client.displayName,
                phoneNumber: client.phoneNumber,
                role: 'client',
                tenantId: currentTenant.id,
                archived: false,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid
            });

            const horseIds = [];
            for (const h of horses) {
                const horseRef = doc(collection(db, 'HORSES'));
                horseIds.push(horseRef.id);
                batch.set(horseRef, {
                    tenantId: currentTenant.id,
                    name: h.name,
                    breed: h.breed,
                    age: Number(h.age),
                    ownerId: clientUid,
                    assignedPlanIds: [],
                    archived: false,
                    status: 'activo',
                    createdAt: serverTimestamp(),
                    createdBy: currentUser.uid
                });
            }

            const logRef = doc(collection(db, 'LOGS'));
            batch.set(logRef, {
                type: 'client_onboarded',
                tenantId: currentTenant.id,
                clientUid,
                clientEmail: client.email,
                horseIds,
                horseCount: horses.length,
                by: currentUser.uid,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            return { success: true, clientUid, horseIds };
        } catch (error) {
            console.error('Error al crear cliente con caballos:', error);
            
            if (newAuthUser) {
                try {
                    await deleteUser(newAuthUser);
                } catch (cleanupError) {
                    console.error('Error al limpiar Auth user tras fallo de Firestore:', cleanupError);
                    return { success: false, error: 'partial-failure', authUid: newAuthUser.uid };
                }
            }
            
            return { success: false, error: error.code || error.message };
        }
    };

    const deleteClientCascading = async (clientUid) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };

        try {
            const batch = writeBatch(db);

            batch.delete(doc(db, 'USERS', clientUid));

            const clientEquipment = equipmentItems.filter(item => item.ownerId === clientUid);
            clientEquipment.forEach(item => {
                batch.delete(doc(db, 'EQUIPMENT_ITEMS', item.id));
            });

            const clientRequests = requests.filter(req => req.clientId === clientUid);
            clientRequests.forEach(req => {
                batch.delete(doc(db, 'REQUESTS', req.id));
            });

            const clientFinances = finances.filter(fin => fin.clientId === clientUid);
            clientFinances.forEach(fin => {
                batch.delete(doc(db, 'FINANCES', fin.id));
            });

            const clientNotifications = notifications.filter(notif => notif.recipientId === clientUid);
            clientNotifications.forEach(notif => {
                batch.delete(doc(db, 'NOTIFICATIONS', notif.id));
            });

            const clientHorses = horses.filter(h => h.ownerId === clientUid);
            clientHorses.forEach(horse => {
                const space = spaces.find(s => s.horseId === horse.id);
                if (space) {
                    batch.update(doc(db, 'SPACES', space.id), {
                        status: 'available',
                        horseId: null
                    });
                }

                batch.delete(doc(db, 'HORSES', horse.id));

                const records = healthRecords.filter(r => r.horseId === horse.id);
                records.forEach(r => {
                    batch.delete(doc(db, 'HEALTH_RECORDS', r.id));
                });

                const booklet = healthBooklets.find(b => b.horseId === horse.id);
                if (booklet) {
                    batch.delete(doc(db, 'HORSE_HEALTH_BOOKLETS', booklet.id));
                }

                const horseLogs = logs.filter(l => l.horseId === horse.id);
                horseLogs.forEach(l => {
                    batch.delete(doc(db, 'LOGS', l.id));
                });
            });

            const logRef = doc(collection(db, 'LOGS'));
            batch.set(logRef, {
                tenantId: currentTenant.id,
                timestamp: new Date().toISOString(),
                staffName: currentUser?.displayName || 'Sistema',
                type: 'client_deleted_cascade',
                clientUid,
                details: `Baja de cliente ${clientUid} con borrado en cascada de equipamiento (${clientEquipment.length} items), caballos (${clientHorses.length}) y registros financieros/solicitudes.`
            });

            await batch.commit();
            notify('Cliente y todos sus datos relacionados eliminados', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error en baja en cascada de cliente:', error);
            notify('Error al eliminar el cliente y sus datos', 'error');
            return { success: false, error: error.message };
        }
    };

    const generateMonthlyCharges = async ({ month }) => {
        if (!currentTenant?.id) return { success: false, error: 'Tenant no detectado.' };
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return { success: false, error: 'Formato de mes inválido' };
        }

        try {
            const dateString = `${month}-01`;
            const dueDateString = `${month}-${String(MONTHLY_DUE_DAY).padStart(2, '0')}`;
            
            const monthDate = parse(month, "yyyy-MM", new Date());
            const monthName = format(monthDate, "MMMM yyyy", { locale: es });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            const ops = [];
            const activeHorses = horses.filter(h => !h.archived && h.assignedPlanIds?.length > 0);
            
            const monthlyPlanMap = {};
            pricingPlans.forEach(p => {
                if (p.frequency === 'monthly' && !p.archived) {
                    monthlyPlanMap[p.id] = p;
                }
            });

            activeHorses.forEach(horse => {
                horse.assignedPlanIds.forEach(planId => {
                    const plan = monthlyPlanMap[planId];
                    if (plan) {
                        ops.push({
                            horseId: horse.id,
                            planId: plan.id,
                            planName: plan.name,
                            planPrice: horse.planPricesSnapshot?.[plan.id] ?? plan.price,
                            ownerId: horse.ownerId || null
                        });
                    }
                });
            });

            if (ops.length === 0) {
                return { success: true, chargeCount: 0, skippedCount: 0, message: "No hay caballos con planes mensuales para generar." };
            }

            const existingCharges = finances.filter(f => f.date === dateString && f.category === 'plan');
            const existingKeys = new Set(existingCharges.map(f => `${f.horseId}|${f.planId}`));

            const batch = writeBatch(db);
            const chargeIds = [];
            const skipped = [];

            for (const op of ops) {
                const key = `${op.horseId}|${op.planId}`;
                if (existingKeys.has(key)) {
                    skipped.push(key);
                } else {
                    const chargeRef = doc(collection(db, 'FINANCES'));
                    batch.set(chargeRef, {
                        tenantId: currentTenant.id,
                        horseId: op.horseId,
                        clientId: op.ownerId,
                        type: 'income',
                        status: 'pending',
                        category: 'plan',
                        amount: Number(op.planPrice),
                        description: `${op.planName} - ${capitalizedMonth}`,
                        planId: op.planId,
                        date: dateString,
                        dueDate: dueDateString,
                        createdAt: serverTimestamp(),
                        createdBy: currentUser.uid,
                    });
                    chargeIds.push(chargeRef.id);
                }
            }

            if (chargeIds.length === 0) {
                return { success: true, chargeCount: 0, skippedCount: skipped.length, message: "Todos los cargos ya existen." };
            }

            const logRef = doc(collection(db, 'LOGS'));
            batch.set(logRef, {
                type: 'monthly_charges_generated',
                tenantId: currentTenant.id,
                monthGenerated: month,
                chargeIds,
                chargeCount: chargeIds.length,
                skippedCount: skipped.length,
                by: currentUser.uid,
                timestamp: serverTimestamp(),
            });

            await batch.commit();

            return { success: true, chargeCount: chargeIds.length, skippedCount: skipped.length, chargeIds, month };

        } catch (error) {
            console.error('Error al generar cargos mensuales:', error);
            return { success: false, error: error.code || error.message };
        }
    };

    const getHealthRecordsByHorse = (horseId) => {
        return healthRecords.filter(r => r.horseId === horseId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getHealthBookletByHorse = (horseId) => {
        return healthBooklets.find(b => b.horseId === horseId) || null;
    };

    const getHealthStatusByHorse = (horseId) => {
        const records = getHealthRecordsByHorse(horseId);
        if (records.length === 0) return 'sin_registros';
        
        let status = 'al_dia';
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        for (const record of records) {
            if (!record.nextDueDate) continue;
            const dueDate = new Date(record.nextDueDate);
            if (dueDate < now) {
                return 'vencido';
            }
            if (dueDate <= thirtyDaysFromNow) {
                status = 'proximo';
            }
        }
        return status;
    };

    const editPendingCharge = async (chargeId, { amount, description }) => {
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };
        try {
            const chargeRef = doc(db, 'FINANCES', chargeId);
            const chargeSnap = await getDoc(chargeRef);
            if (!chargeSnap.exists()) return { success: false, error: 'Cargo no encontrado.' };

            const data = chargeSnap.data();
            if (data.status !== 'pending' && data.status !== 'overdue') {
                return { success: false, error: 'Solo se pueden editar cargos pendientes.' };
            }

            const batch = writeBatch(db);
            batch.update(chargeRef, {
                amount: Number(amount),
                description: description.trim(),
                updatedAt: serverTimestamp(),
                updatedBy: currentUser.uid
            });

            const logRef = doc(collection(db, 'LOGS'));
            batch.set(logRef, {
                type: 'charge_edited',
                tenantId: currentTenant.id,
                chargeId,
                oldAmount: data.amount,
                newAmount: Number(amount),
                oldDescription: data.description,
                newDescription: description.trim(),
                by: currentUser.uid,
                staffName: currentUser.displayName || 'Administrador',
                timestamp: serverTimestamp()
            });

            await batch.commit();
            notify('Cargo actualizado', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error al editar cargo:', error);
            return { success: false, error: error.message };
        }
    };

    const deletePendingCharge = async (chargeId) => {
        if (!currentUser?.uid) return { success: false, error: 'Sesión inválida.' };
        try {
            const chargeRef = doc(db, 'FINANCES', chargeId);
            const chargeSnap = await getDoc(chargeRef);
            if (!chargeSnap.exists()) return { success: false, error: 'Cargo no encontrado.' };

            const data = chargeSnap.data();
            if (data.status !== 'pending' && data.status !== 'overdue') {
                return { success: false, error: 'Solo se pueden eliminar cargos pendientes.' };
            }

            const batch = writeBatch(db);
            batch.delete(chargeRef);

            const logRef = doc(collection(db, 'LOGS'));
            batch.set(logRef, {
                type: 'charge_deleted',
                tenantId: currentTenant.id,
                chargeId,
                amount: data.amount,
                description: data.description,
                horseId: data.horseId || null,
                by: currentUser.uid,
                staffName: currentUser.displayName || 'Administrador',
                timestamp: serverTimestamp()
            });

            await batch.commit();
            notify('Cargo eliminado', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar cargo:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        spaces, horses, finances, logs, requests, routines, pricingPlans, shifts,
        tenantUsers, tenantSettings, inventory, servicesCatalog, inventoryLogs, payrollAdvances,
        notifications, events, healthRecords, healthBooklets, directoryContacts, equipmentItems, tenantRoles,
        loading,
        
        createEquipmentItem, updateEquipmentItem, deleteEquipmentItem,
        getMyEquipmentItems, getEquipmentItemsByTenantAdmins,
        
        addHorse, assignHorseToSpace, updateSpaceStatus, updateBanner, addLog, addRequest, createServiceRequest, createSupplyRequest, cancelServiceRequest, getActiveRequestsForClient,
        addRoutine, addPricingPlan, addShift, deleteShift, addPayment, addTenant, addUser, updateUser, addRole, updateRole, setRole, deleteRole, addSpace,
        addInventoryItem, logStockUsage, updateStock, updateUserSalary, addAdvance, addEvent,
        assignSpaceToStaff, updateHorseLocation, sendNotification, markAsRead, updateRow, deleteRow,
        getLogsForHorse, getFinanceForUser, getPendingChargesForUser, getPaidChargesForUser,
        
        releaseSpace, archiveHorse, updateHorseStatus, moveHorseToSpace, createClientWithHorse, createClientWithHorses, assignExistingHorseToSpace,
        assignPlanToHorse, removePlanFromHorse, createOneTimeCharge, generateMonthlyCharges, deleteClientCascading,
        settlePendingCharge, settleMultiplePendingCharges, editPendingCharge, deletePendingCharge,
        
        createHealthRecord, updateHealthRecord, deleteHealthRecord, upsertHealthBooklet,
        getHealthRecordsByHorse, getHealthBookletByHorse, getHealthStatusByHorse,
        createContact, updateContact, deleteContact
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
