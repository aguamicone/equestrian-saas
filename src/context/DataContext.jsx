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
    const [healthRecords, setHealthRecords] = useState([]);
    const [healthBooklets, setHealthBooklets] = useState([]);
    const [tenantSettings, setTenantSettings] = useState(null);

    // Initial Load & Real-time Subscription via onSnapshot
    useEffect(() => {
        if (!currentTenant) {
            setSpaces([]); setHorses([]); setFinances([]); setLogs([]); setRequests([]);
            setRoutines([]); setPricingPlans([]); setShifts([]); setTenantUsers([]);
            setInventory([]); setInventoryLogs([]); setServicesCatalog([]); setPayrollAdvances([]);
            setEvents([]); setHealthRecords([]); setHealthBooklets([]);
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
                setFn(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
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
        unsubs.push(subscribe('HEALTH_RECORDS', setHealthRecords));
        unsubs.push(subscribe('HORSE_HEALTH_BOOKLETS', setHealthBooklets));
        unsubs.push(subscribe('USERS', setTenantUsers));

        if (currentUser) {
            // Notificaciones filtradas server-side para respetar Firestore rules
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

    const archiveHorse = async (horseId, reason = '') => {
        try {
            // 1. Buscar si el caballo está en algún espacio
            const horseSpace = spaces.find(s => s.horseId === horseId);

            // 2. Marcar caballo como archivado
            await updateDoc(doc(db, 'HORSES', horseId), {
                active: false,
                archivedAt: new Date().toISOString(),
                archivedReason: reason,
            });

            // 3. Si tenía espacio asignado, liberarlo
            if (horseSpace) {
                await updateDoc(doc(db, 'SPACES', horseSpace.id), {
                    status: 'available',
                    horseId: null,
                });
            }

            // 4. Log de auditoría
            await addDoc(collection(db, 'LOGS'), {
                tenantId: currentTenant.id,
                timestamp: new Date().toISOString(),
                staffName: currentUser?.displayName || 'Sistema',
                type: 'horse_archived',
                horseId,
                details: `Caballo dado de baja${reason ? ': ' + reason : ''}`,
            });

            notify('Caballo dado de baja correctamente', 'success');
            return { success: true };
        } catch (e) {
            console.error(e);
            notify('Error al dar de baja el caballo', 'error');
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

            // ¿El destino está ocupado? → enroque
            const isSwap = toSpace.status === 'occupied' && toSpace.horseId;
            const swappedHorseId = isSwap ? toSpace.horseId : null;

            // 1. Asignar caballo al destino
            await updateDoc(doc(db, 'SPACES', toSpaceId), {
                status: 'occupied',
                horseId,
            });

            // 2. Origen: si hay enroque, recibe al otro caballo; sino, queda libre
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

            // 3. Actualizar location del caballo según tipo de destino
            const newLocation = toSpace.type === 'box' ? 'box' : toSpace.type; // 'box' | 'corral' | 'paddock'
            await updateDoc(doc(db, 'HORSES', horseId), { location: newLocation });

            // Si fue enroque, también actualizar el caballo desplazado
            if (isSwap && fromSpace) {
                const swappedLocation = fromSpace.type === 'box' ? 'box' : fromSpace.type;
                await updateDoc(doc(db, 'HORSES', swappedHorseId), { location: swappedLocation });
            }

            // 4. Log de auditoría
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

            // 5. Notificaciones a clientes afectados
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
            // 1. Generar uid para el cliente nuevo (Firebase usa el email como doc ID en este proyecto)
            const clientDocId = client.email || `client-${Date.now()}`;

            // 2. Crear usuario cliente
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

            // 3. Crear caballo y obtener su ID real de Firestore
            const horseRef = await addDoc(collection(db, 'HORSES'), {
                tenantId: currentTenant.id,
                ownerId: clientDocId,
                active: true,
                location: 'box',
                ...horse,
            });

            // 4. Asignar al box (si se pasó spaceId)
            if (spaceId) {
                await updateDoc(doc(db, 'SPACES', spaceId), {
                    status: 'occupied',
                    horseId: horseRef.id,
                });
            }

            // 5. Log de auditoría
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

            // Actualizar location del caballo según tipo de espacio
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

    // --- Health Management ---
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
        try {
            await deleteDoc(doc(db, 'HEALTH_RECORDS', id));
            notify('Registro sanitario eliminado', 'success');
        } catch(e) { console.error(e); notify("Error al eliminar", "error"); }
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
                return 'vencido'; // El más severo gana
            }
            if (dueDate <= thirtyDaysFromNow) {
                status = 'proximo';
            }
        }
        return status;
    };

    const value = {
        spaces, horses, finances, logs, requests, routines, pricingPlans, shifts,
        tenantUsers, tenantSettings, inventory, inventoryLogs, servicesCatalog, payrollAdvances,
        notifications, events, healthRecords, healthBooklets,
        
        addHorse, assignHorseToSpace, updateSpaceStatus, updateBanner, addLog, addRequest,
        addRoutine, addPricingPlan, addShift, deleteShift, addPayment, addTenant, addUser, addSpace,
        addInventoryItem, logStockUsage, updateStock, updateUserSalary, addAdvance, addEvent,
        assignSpaceToStaff, updateHorseLocation, sendNotification, markAsRead, updateRow, deleteRow,
        getLogsForHorse, getFinanceForUser,
        
        releaseSpace, archiveHorse, moveHorseToSpace, createClientWithHorse, assignExistingHorseToSpace,
        
        createHealthRecord, updateHealthRecord, deleteHealthRecord, upsertHealthBooklet,
        getHealthRecordsByHorse, getHealthBookletByHorse, getHealthStatusByHorse
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
