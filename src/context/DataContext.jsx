import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

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
    const [tenantSettings, setTenantSettings] = useState(null);

    // Initial Load & Real-time Subscription via onSnapshot
    useEffect(() => {
        if (!currentTenant) {
            setSpaces([]); setHorses([]); setFinances([]); setLogs([]); setRequests([]);
            setRoutines([]); setPricingPlans([]); setShifts([]); setTenantUsers([]);
            setInventory([]); setInventoryLogs([]); setServicesCatalog([]); setPayrollAdvances([]);
            setEvents([]);
            setTenantSettings(null);
            setNotifications([]);
            return;
        }

        if (!db) {
            console.error("Firestore database no inicializada (db es undefined).");
            return;
        }

        setTenantSettings(currentTenant);

        const tenantQuery = (coll) => query(collection(db, coll), where("tenantId", "==", currentTenant.id));
        const unsubs = [];

        const subscribe = (collName, setFn) => {
            return onSnapshot(tenantQuery(collName), snap => {
                setFn(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        };

        unsubs.push(subscribe('SPACES', setSpaces));
        unsubs.push(subscribe('HORSES', setHorses));
        unsubs.push(subscribe('FINANCES', setFinances));
        unsubs.push(subscribe('LOGS', setLogs));
        unsubs.push(subscribe('REQUESTS', setRequests));
        unsubs.push(subscribe('ROUTINES', setRoutines));
        unsubs.push(subscribe('PRICING_PLANS', setPricingPlans));
        unsubs.push(subscribe('SHIFTS', setShifts));
        unsubs.push(subscribe('INVENTORY', setInventory));
        unsubs.push(subscribe('INVENTORY_LOGS', setInventoryLogs));
        unsubs.push(subscribe('SERVICES_CATALOG', setServicesCatalog));
        unsubs.push(subscribe('PAYROLL_ADVANCES', setPayrollAdvances));
        unsubs.push(subscribe('EVENTS', setEvents));
        unsubs.push(subscribe('USERS', setTenantUsers));

        if (currentUser) {
            // Notificaciones filtradas por userId o admins
            const notifQ = query(collection(db, 'NOTIFICATIONS'));
            unsubs.push(onSnapshot(notifQ, snap => {
                const allNotifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setNotifications(allNotifs.filter(n => 
                    n.recipientId === currentUser.uid || 
                    (n.recipientId === 'ALL_ADMINS' && ['tenantAdmin', 'superAdmin'].includes(currentUser.role))
                ));
            }));
        }

        return () => unsubs.forEach(unsub => unsub());
    }, [currentTenant?.id, currentUser?.uid, currentUser?.role]);

    // --- Actions (Firebase Writes) ---

    const addHorse = async (horseData) => {
        try {
            await addDoc(collection(db, 'HORSES'), { tenantId: currentTenant.id, ...horseData });
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

    const addRequest = async (requestData) => {
        await addDoc(collection(db, 'REQUESTS'), {
            tenantId: currentTenant.id,
            date: new Date().toISOString(),
            status: 'pending',
            ...requestData
        });
        sendNotification('ALL_ADMINS', `Nuevo pedido de insumos de ${currentUser?.displayName || 'Personal'}`, 'info');
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
            status: 'paid', // Instant
            ...paymentData
        });
        notify('Pago registrado', 'success');
    };

    const addTenant = async (tenantData) => {
        await setDoc(doc(db, 'TENANTS', tenantData.id), tenantData);
        notify('Tenant creado exitosamente', 'success');
    };

    const addUser = async (userData) => {
        // En un caso real tendrías un auth trigger o similar. Aquí grabamos info perfil.
        await setDoc(doc(db, 'USERS', userData.uid || userData.email), userData);
        notify('Usuario añadido a BDD', 'success');
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
        return finances.filter(f => f.clientId === userId || !f.clientId).sort((a, b) => new Date(b.date) - new Date(a.date));
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

    const value = {
        spaces, horses, finances, logs, requests, routines, pricingPlans, shifts,
        tenantUsers, tenantSettings, inventory, inventoryLogs, servicesCatalog, payrollAdvances,
        notifications, events,
        
        addHorse, assignHorseToSpace, updateSpaceStatus, updateBanner, addLog, addRequest,
        addRoutine, addPricingPlan, addShift, deleteShift, addPayment, addTenant, addUser, addSpace,
        addInventoryItem, logStockUsage, updateStock, updateUserSalary, addAdvance, addEvent,
        assignSpaceToStaff, updateHorseLocation, sendNotification, markAsRead, updateRow, deleteRow,
        getLogsForHorse, getFinanceForUser
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
