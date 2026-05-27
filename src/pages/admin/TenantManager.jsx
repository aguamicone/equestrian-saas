import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Building2, Plus, User, Edit2, Mail, Key } from 'lucide-react';
import { PageHeader, Card, Badge, Modal } from '../../components/ui';
import { useNotification } from '../../context/NotificationContext';

export default function TenantManager() {
    const { addTenant, addUser } = useData();
    const { notify } = useNotification();
    const [showModal, setShowModal] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const [editingAdmin, setEditingAdmin] = useState(null);

    // Form State (Create)
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');

    // Real-time Data
    const [tenants, setTenants] = useState([]);
    const [tenantAdmins, setTenantAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch real-time data for SuperAdmin
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const unsubTenants = onSnapshot(collection(db, 'TENANTS'), (snap) => {
            if (isMounted) setTenants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => console.error(error));

        const qAdmins = query(collection(db, 'USERS'), where('role', '==', 'tenantAdmin'));
        const unsubAdmins = onSnapshot(qAdmins, (snap) => {
            if (isMounted) {
                setTenantAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            }
        }, (error) => console.error(error));

        return () => {
            isMounted = false;
            unsubTenants();
            unsubAdmins();
        };
    }, []);

    const handleCreate = (e) => {
        e.preventDefault();

        const tenantId = name.toLowerCase().replace(/\s+/g, '-');
        const adminId = `admin-${tenantId}`;

        addTenant({
            id: tenantId,
            name: name,
            domain: `${domain}.equestrian.app`,
            bannerText: `Bienvenido a ${name}`,
            bannerImage: null
        });

        addUser({
            uid: adminId,
            email: adminEmail,
            role: 'tenantAdmin',
            tenantId: tenantId,
            displayName: adminName
        });

        setShowModal(false);
        setName(''); setDomain(''); setAdminName(''); setAdminEmail('');
    };

    const openEditModal = (tenant) => {
        const admins = tenantAdmins.filter(u => u.tenantId === tenant.id);
        setEditingTenant({ ...tenant });
        // Si hay varios admins, para este MVP tomamos el primero para editar
        setEditingAdmin(admins.length > 0 ? { ...admins[0] } : null);
        setShowEditModal(true);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, 'TENANTS', editingTenant.id), {
                name: editingTenant.name,
                domain: editingTenant.domain
            });

            if (editingAdmin && editingAdmin.id) {
                await updateDoc(doc(db, 'USERS', editingAdmin.id), {
                    displayName: editingAdmin.displayName
                });
            }

            notify('Cambios guardados correctamente', 'success');
            setShowEditModal(false);
        } catch(e) {
            console.error(e);
            notify('Error al guardar cambios', 'error');
        }
    };

    const handleSendReset = async (email) => {
        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, email);
            notify(`Correo de reseteo enviado a ${email}`, 'success');
        } catch(e) {
            console.error(e);
            notify('Error al enviar correo (¿Email válido?)', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Gestión de Tenants"
                subtitle="Alta, control y configuración de caballerizas y haras del sistema"
                icon={Building2}
                actions={
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="btn-primary flex items-center gap-2 shadow-sm font-bold"
                    >
                        <Plus size={18} /> Nuevo Tenant
                    </button>
                }
            />

            <Card padding="none" className="overflow-hidden border-ink-200 shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-ink-500 font-medium">Cargando base de datos en vivo...</div>
                    ) : tenants.length === 0 ? (
                        <div className="p-8 text-center text-ink-500 font-medium">No hay tenants registrados.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-ink-600 border-collapse">
                            <thead className="bg-ink-50 text-ink-500 uppercase font-bold text-[11px] tracking-wider border-b border-ink-200">
                                <tr>
                                    <th className="p-4">Nombre del Tenant</th>
                                    <th className="p-4">Dominio</th>
                                    <th className="p-4">Admins</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100 bg-white">
                                {tenants.map(tenant => {
                                    const admins = tenantAdmins.filter(u => u.tenantId === tenant.id);
                                    return (
                                        <tr key={tenant.id} className="hover:bg-ink-50/50 transition-colors">
                                            <td className="p-4 font-bold text-ink-900 flex items-center gap-2.5">
                                                <Building2 size={16} className="text-primary-500" />
                                                {tenant.name}
                                            </td>
                                            <td className="p-4 text-sm text-ink-400 font-medium">{tenant.domain}</td>
                                            <td className="p-4">
                                                <div className="flex -space-x-1.5 overflow-hidden">
                                                    {admins.map(admin => (
                                                        <div 
                                                            key={admin.id || admin.uid} 
                                                            className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shadow-sm" 
                                                            title={admin.displayName}
                                                        >
                                                            {admin.displayName?.charAt(0) || 'A'}
                                                        </div>
                                                    ))}
                                                    {admins.length === 0 && <span className="text-ink-400 italic text-xs">Sin administradores</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge tone="success">
                                                    Activo
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => openEditModal(tenant)}
                                                    className="p-2 text-ink-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Editar Tenant"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* Modal de Alta */}
            <Modal 
                open={showModal} 
                onClose={() => setShowModal(false)}
                title="Alta de Nueva Caballeriza"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                        <button type="submit" form="create-tenant-form" className="btn-primary px-6 shadow-sm">Crear Tenant</button>
                    </div>
                }
            >
                <form id="create-tenant-form" onSubmit={handleCreate} className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-primary-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-ink-150 pb-2">
                            <Building2 size={14} /> Datos de la Caballeriza
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Nombre</label>
                                <input type="text" className="input-field bg-white" placeholder="Ej: Haras El Sol" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Subdominio</label>
                                <div className="flex items-center">
                                    <input type="text" className="input-field bg-white rounded-r-none" placeholder="haras-sol" value={domain} onChange={e => setDomain(e.target.value)} required />
                                    <span className="bg-ink-100 text-ink-500 px-3 py-2 rounded-r border border-l-0 border-ink-200 text-xs font-bold">.equestrian.app</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-ink-150">
                        <h4 className="text-primary-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-ink-150 pb-2">
                            <User size={14} /> Datos del Administrador
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Nombre Completo</label>
                                <input type="text" className="input-field bg-white" placeholder="Admin Name" value={adminName} onChange={e => setAdminName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Email</label>
                                <input type="email" className="input-field bg-white" placeholder="admin@haras.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
                            </div>
                        </div>
                        <p className="text-[10px] text-ink-400 font-semibold bg-ink-50 px-2.5 py-1 rounded-lg border border-ink-150 inline-block">
                            Contraseña por defecto: <code className="text-ink-800 font-bold">1234</code>
                        </p>
                    </div>
                </form>
            </Modal>

            {/* Modal de Edición */}
            <Modal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Caballeriza"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancelar</button>
                        <button type="submit" form="edit-tenant-form" className="btn-primary px-6 shadow-sm">Guardar Cambios</button>
                    </div>
                }
            >
                {editingTenant && (
                    <form id="edit-tenant-form" onSubmit={handleEditSave} className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-primary-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-ink-150 pb-2">
                                <Building2 size={14} /> Datos de la Caballeriza
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Nombre</label>
                                    <input 
                                        type="text" 
                                        className="input-field bg-white" 
                                        value={editingTenant.name} 
                                        onChange={e => setEditingTenant({...editingTenant, name: e.target.value})} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Dominio actual</label>
                                    <input 
                                        type="text" 
                                        className="input-field bg-white" 
                                        value={editingTenant.domain || ''} 
                                        onChange={e => setEditingTenant({...editingTenant, domain: e.target.value})} 
                                        required 
                                    />
                                    <p className="text-[10px] text-ink-400 mt-1">Podés escribir un dominio personalizado acá.</p>
                                </div>
                            </div>
                        </div>

                        {editingAdmin ? (
                            <div className="space-y-4 pt-4 border-t border-ink-150">
                                <h4 className="text-primary-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-ink-150 pb-2">
                                    <User size={14} /> Administrador Principal
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            className="input-field bg-white" 
                                            value={editingAdmin.displayName || ''} 
                                            onChange={e => setEditingAdmin({...editingAdmin, displayName: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Email de Acceso</label>
                                        <input 
                                            type="email" 
                                            className="input-field bg-ink-50 text-ink-500 cursor-not-allowed" 
                                            value={editingAdmin.email || ''} 
                                            disabled
                                            title="No se puede cambiar el email por razones de seguridad."
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => handleSendReset(editingAdmin.email)}
                                        className="btn-secondary text-primary-600 flex items-center gap-2 text-xs py-1.5 w-full justify-center border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
                                    >
                                        <Key size={14} />
                                        Enviar link de recuperación de clave
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl">
                                <p className="text-warning-800 text-sm font-medium">Este Haras no tiene administradores asignados.</p>
                            </div>
                        )}
                    </form>
                )}
            </Modal>
        </div>
    );
}
