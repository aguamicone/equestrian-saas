import { useState } from 'react';
import { getTenants, getCollection } from '../../services/mockFirebase';
import { useData } from '../../context/DataContext';
import { Building2, Plus, User } from 'lucide-react';
import { PageHeader, Card, Badge, Modal } from '../../components/ui';

export default function TenantManager() {
    const { addTenant, addUser } = useData();
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');

    // Force re-render helper (since tenants are pulled directly from export, not state)
    const [refresh, setRefresh] = useState(0);

    const tenants = getTenants();

    const handleCreate = (e) => {
        e.preventDefault();

        // generated IDs
        const tenantId = name.toLowerCase().replace(/\s+/g, '-');
        const adminId = `admin-${tenantId}`;

        // Create Tenant
        addTenant({
            id: tenantId,
            name: name,
            domain: `${domain}.equestrian.app`,
            bannerText: `Bienvenido a ${name}`,
            bannerImage: null
        });

        // Create Admin User
        addUser({
            uid: adminId,
            email: adminEmail,
            password: '1234',
            role: 'tenantAdmin',
            tenantId: tenantId,
            displayName: adminName
        });

        setShowModal(false);
        setName('');
        setDomain('');
        setAdminName('');
        setAdminEmail('');
        setRefresh(r => r + 1); // Trigger re-render
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
                    <table className="w-full text-left text-sm text-ink-600 border-collapse">
                        <thead className="bg-ink-50 text-ink-500 uppercase font-bold text-[11px] tracking-wider border-b border-ink-200">
                            <tr>
                                <th className="p-4">Nombre del Tenant</th>
                                <th className="p-4">Dominio</th>
                                <th className="p-4">Admins</th>
                                <th className="p-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100 bg-white">
                            {Object.values(tenants).map(tenant => {
                                const admins = getCollection('USERS').filter(u => u.tenantId === tenant.id && u.role === 'tenantAdmin');
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
                                                        key={admin.uid} 
                                                        className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shadow-sm" 
                                                        title={admin.displayName}
                                                    >
                                                        {admin.displayName.charAt(0)}
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
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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
                                <input 
                                    type="text" 
                                    className="input-field bg-white border-ink-200 text-ink-800 focus:border-primary-500 focus:ring-0" 
                                    placeholder="Ej: Haras El Sol" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Subdominio</label>
                                <div className="flex items-center">
                                    <input 
                                        type="text" 
                                        className="input-field bg-white border-ink-200 text-ink-850 focus:border-primary-500 focus:ring-0 rounded-r-none" 
                                        placeholder="haras-sol" 
                                        value={domain} 
                                        onChange={e => setDomain(e.target.value)} 
                                        required 
                                    />
                                    <span className="bg-ink-100 text-ink-500 px-3 py-2 rounded-r border border-l-0 border-ink-200 text-xs font-bold tracking-tight">.equestrian.app</span>
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
                                <input 
                                    type="text" 
                                    className="input-field bg-white border-ink-200 text-ink-800 focus:border-primary-500 focus:ring-0" 
                                    placeholder="Admin Name" 
                                    value={adminName} 
                                    onChange={e => setAdminName(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Email</label>
                                <input 
                                    type="email" 
                                    className="input-field bg-white border-ink-200 text-ink-800 focus:border-primary-500 focus:ring-0" 
                                    placeholder="admin@haras.com" 
                                    value={adminEmail} 
                                    onChange={e => setAdminEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-ink-400 font-semibold bg-ink-50 px-2.5 py-1 rounded-lg border border-ink-150 inline-block">
                            Contraseña por defecto: <code className="text-ink-800 font-bold">1234</code>
                        </p>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
