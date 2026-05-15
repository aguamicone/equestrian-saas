import { useState } from 'react';
import { getTenants, getCollection } from '../../services/mockFirebase';
import { useData } from '../../context/DataContext';
import { Building2, Plus, X, User } from 'lucide-react';

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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100">Gestión de Tenants</h2>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nuevo Tenant
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700/50 text-slate-400">
                        <tr>
                            <th className="p-4">Nombre del Tenant</th>
                            <th className="p-4">Dominio</th>
                            <th className="p-4">Admins</th>
                            <th className="p-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-slate-200">
                        {Object.values(tenants).map(tenant => {
                            const admins = getCollection('USERS').filter(u => u.tenantId === tenant.id && u.role === 'tenantAdmin');
                            return (
                                <tr key={tenant.id} className="hover:bg-slate-700/30">
                                    <td className="p-4 font-bold flex items-center gap-2">
                                        <Building2 size={16} className="text-gold-500" />
                                        {tenant.name}
                                    </td>
                                    <td className="p-4 text-sm text-slate-400">{tenant.domain}</td>
                                    <td className="p-4">
                                        <div className="flex -space-x-2">
                                            {admins.map(admin => (
                                                <div key={admin.uid} className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center border-2 border-slate-800 text-xs" title={admin.displayName}>
                                                    {admin.displayName.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                                            Activo
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-lg animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Alta de Nueva Caballeriza</h3>
                            <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-gold-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Building2 size={14} /> Datos de la Caballeriza
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-2">Nombre</label>
                                        <input type="text" className="input-field" placeholder="Ej: Haras El Sol" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-2">Subdominio</label>
                                        <div className="flex items-center">
                                            <input type="text" className="input-field rounded-r-none" placeholder="haras-sol" value={domain} onChange={e => setDomain(e.target.value)} required />
                                            <span className="bg-slate-700 text-slate-400 px-3 py-2 rounded-r border border-l-0 border-slate-600 text-xs">.app</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-700">
                                <h4 className="text-gold-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} /> Datos del Administrador
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-2">Nombre Completo</label>
                                        <input type="text" className="input-field" placeholder="Admin Name" value={adminName} onChange={e => setAdminName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-2">Email</label>
                                        <input type="email" className="input-field" placeholder="admin@haras.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">Contraseña por defecto: <code>1234</code></p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Crear Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
