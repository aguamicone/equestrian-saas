import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Search, UserCog, User, Shield, Plus, Edit, Trash, CheckCircle } from 'lucide-react';
import AltaClienteCaballoModal from '../../components/users/modals/AltaClienteCaballoModal';
import { PageHeader, Card, Badge, Modal, Tabs } from '../../components/ui';

const MODULES = [
    { id: 'dashboard', label: 'Dashboard Principal' },
    { id: 'horses', label: 'Caballerizas' },
    { id: 'health', label: 'Sanidad y Fichas' },
    { id: 'finances', label: 'Finanzas y Cobros' },
    { id: 'staff', label: 'RRHH y Nómina' },
    { id: 'requests', label: 'Solicitudes / Tareas' },
    { id: 'inventory', label: 'Inventario / Insumos' },
    { id: 'users', label: 'Gestión de Usuarios' },
    { id: 'settings', label: 'Configuración' }
];

export default function UserManagement() {
    const { currentUser } = useAuth();
    const { addUser, updateUser, tenantUsers, deleteClientCascading, horses, equipmentItems, finances, requests, tenantRoles, addRole, updateRole, setRole, deleteRole } = useData();
    
    const [activeTab, setActiveTab] = useState('usuarios');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showAltaClienteCaballo, setShowAltaClienteCaballo] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // User Edit State
    const [userToEdit, setUserToEdit] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editRole, setEditRole] = useState('');

    // New User State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('staff');
    const [newPhone, setNewPhone] = useState('');

    // Roles State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    
    const [roleToEdit, setRoleToEdit] = useState(null);
    const [editRoleName, setEditRoleName] = useState('');

    const confirmDeleteClient = async () => {
        if (!clientToDelete) return;
        setIsDeleting(true);
        try {
            await deleteClientCascading(clientToDelete.uid);
            setClientToDelete(null);
        } catch (err) {
            console.error('Error al borrar cliente:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        addUser({
            uid: `user-${Date.now()}`,
            email: newEmail,
            password: '1234', // Default password
            role: newRole,
            tenantId: currentUser.tenantId,
            displayName: newName,
            phoneNumber: newPhone
        });
        setShowModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewRole('staff');
    };

    const handleEditUser = (e) => {
        e.preventDefault();
        if (!userToEdit) return;
        updateUser(userToEdit.uid, {
            displayName: editName,
            phoneNumber: editPhone,
            role: editRole
        });
        setUserToEdit(null);
    };

    const openEditUser = (user) => {
        setUserToEdit(user);
        setEditName(user.displayName || '');
        setEditPhone(user.phoneNumber || '');
        setEditRole(user.role || 'staff');
    };

    const handleCreateRole = (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        addRole({
            name: newRoleName,
            permissions: []
        });
        setShowRoleModal(false);
        setNewRoleName('');
    };

    const openEditRole = (role) => {
        setRoleToEdit(role);
        setEditRoleName(role.name);
    };

    const handleEditRole = (e) => {
        e.preventDefault();
        if (!editRoleName.trim() || !roleToEdit) return;
        updateRole(roleToEdit.id, { name: editRoleName });
        setRoleToEdit(null);
    };

    const togglePermission = (roleId, moduleId, currentPermissions) => {
        const perms = currentPermissions || [];
        const newPerms = perms.includes(moduleId) 
            ? perms.filter(p => p !== moduleId)
            : [...perms, moduleId];
        updateRole(roleId, { permissions: newPerms });
    };

    const toggleStaffPermission = (moduleId) => {
        const staffRole = tenantRoles.find(r => r.id === 'staff');
        const currentPerms = staffRole ? (staffRole.permissions || []) : ['horses', 'requests', 'inventory'];
        
        const newPerms = currentPerms.includes(moduleId)
            ? currentPerms.filter(p => p !== moduleId)
            : [...currentPerms, moduleId];
            
        if (staffRole) {
            updateRole('staff', { permissions: newPerms });
        } else {
            setRole('staff', { name: 'Staff (Base)', permissions: newPerms });
        }
    };

    // Filter
    const filteredUsers = tenantUsers.filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const customRoles = tenantRoles.filter(r => r.id !== 'staff');

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                kicker="Panel de administración"
                title="Gestión de Usuarios y Accesos"
                subtitle="Control de roles, permisos y perfiles de clientes y personal"
                icon={UserCog}
                actions={
                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={18} /> Nuevo Usuario
                    </button>
                }
            />

            <Tabs 
                tabs={[
                    { key: 'usuarios', label: 'Directorio de Usuarios', icon: User },
                    { key: 'roles', label: 'Roles y Permisos', icon: Shield }
                ]}
                value={activeTab}
                onChange={setActiveTab}
                className="mt-2"
            />

            {activeTab === 'usuarios' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                        <input
                            className="input-field pl-9 py-2.5 text-sm w-full bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500 focus:ring-0"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Card padding="none" className="overflow-hidden border-ink-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-ink-600 border-collapse">
                                <thead className="bg-ink-50 text-ink-500 uppercase font-bold text-[11px] tracking-wider border-b border-ink-200">
                                    <tr>
                                        <th className="p-4">Usuario</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Rol Asignado</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-100">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-ink-400 italic">
                                                No se encontraron usuarios
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => {
                                            const roleName = user.role === 'tenantAdmin' ? 'Administrador' :
                                                             user.role === 'client' ? 'Cliente' :
                                                             user.role === 'staff' ? 'Staff' :
                                                             customRoles.find(r => r.id === user.role)?.name || user.role;

                                            return (
                                                <tr key={user.uid} className="hover:bg-ink-50/50 transition-colors">
                                                    <td className="p-4 font-bold text-ink-900 flex items-center gap-2">
                                                        <div className="p-2 bg-ink-50 text-ink-500 rounded-full shrink-0">
                                                            {user.role === 'staff' ? <Shield size={14} className="text-primary-500" /> : <User size={14} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-ink-850">{user.displayName}</div>
                                                            {user.phoneNumber && <div className="text-xs text-ink-500 font-normal">{user.phoneNumber}</div>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-ink-700">{user.email}</td>
                                                    <td className="p-4">
                                                        <Badge variant={
                                                            user.role === 'tenantAdmin' ? 'success' :
                                                            user.role === 'client' ? 'neutral' : 'sky'
                                                        }>
                                                            {roleName}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditUser(user)}
                                                                className="text-xs text-primary-600 hover:text-primary-700 font-bold hover:underline bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-md border border-primary-200 transition-all flex items-center gap-1"
                                                            >
                                                                <Edit size={12} /> Editar
                                                            </button>
                                                            {user.role === 'client' && (
                                                                <button
                                                                    onClick={() => setClientToDelete(user)}
                                                                    className="text-xs text-danger-600 hover:text-danger-700 font-bold hover:underline bg-danger-50 hover:bg-danger-100 px-2.5 py-1.5 rounded-md border border-danger-200 transition-all flex items-center gap-1"
                                                                >
                                                                    <Trash size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'roles' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <Card padding="normal" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm border-ink-200 bg-ink-50/20">
                        <div>
                            <h3 className="text-ink-900 font-bold mb-1 text-base">Matriz de Permisos</h3>
                            <p className="text-ink-500 text-xs font-medium">Configura qué módulos puede ver y editar cada rol. Los administradores siempre tienen acceso total.</p>
                        </div>
                        <button onClick={() => setShowRoleModal(true)} className="btn-primary flex items-center gap-2 text-sm shrink-0">
                            <Plus size={16} /> Crear Rol Personalizado
                        </button>
                    </Card>

                    <Card padding="none" className="overflow-hidden border-ink-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-ink-600 border-collapse">
                                <thead className="bg-ink-50 text-ink-500 font-bold text-xs tracking-wider border-b border-ink-200">
                                    <tr>
                                        <th className="p-4 uppercase">Módulo / Sección</th>
                                        <th className="p-4 text-center">Administrador</th>
                                        <th className="p-4 text-center">Cliente</th>
                                        <th className="p-4 text-center">Staff (Base)</th>
                                        {customRoles.map(r => (
                                            <th key={r.id} className="p-4 text-center relative group min-w-[120px]">
                                                {r.name}
                                                <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-ink-50 p-0.5 rounded border border-ink-200 shadow-sm">
                                                    <button onClick={() => openEditRole(r)} className="p-1 text-ink-400 hover:text-primary-600 hover:bg-white rounded" title="Editar Nombre del Rol">
                                                        <Edit size={12} />
                                                    </button>
                                                    <button onClick={() => deleteRole(r.id)} className="p-1 text-ink-400 hover:text-danger-600 hover:bg-white rounded" title="Eliminar Rol">
                                                        <Trash size={12} />
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-100">
                                    {MODULES.map(mod => (
                                        <tr key={mod.id} className="hover:bg-ink-50/50 transition-colors">
                                            <td className="p-4 font-bold text-ink-900">{mod.label}</td>
                                            {/* Admin: Always checked & disabled */}
                                            <td className="p-4 text-center">
                                                <input type="checkbox" checked disabled className="rounded text-primary-600 opacity-50 cursor-not-allowed" />
                                            </td>
                                            {/* Client: Specific hardcoded access */}
                                            <td className="p-4 text-center">
                                                <input type="checkbox" checked={['horses', 'health', 'finances', 'requests'].includes(mod.id)} disabled className="rounded text-ink-600 opacity-50 cursor-not-allowed" title="Los clientes ven su propia información en estos módulos" />
                                            </td>
                                            {/* Staff Base */}
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={tenantRoles.find(r => r.id === 'staff') ? (tenantRoles.find(r => r.id === 'staff').permissions || []).includes(mod.id) : ['horses', 'requests', 'inventory'].includes(mod.id)} 
                                                    onChange={() => toggleStaffPermission(mod.id)}
                                                    className="rounded text-primary-600 cursor-pointer focus:ring-primary-500" 
                                                />
                                            </td>
                                            {/* Custom Roles */}
                                            {customRoles.map(r => {
                                                const hasAccess = (r.permissions || []).includes(mod.id);
                                                return (
                                                    <td key={r.id} className="p-4 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={hasAccess} 
                                                            onChange={() => togglePermission(r.id, mod.id, r.permissions)}
                                                            className="rounded text-primary-600 cursor-pointer focus:ring-primary-500" 
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* CREATE USER MODAL */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Registrar Nuevo Usuario"
                    size="md"
                    footer={
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors">Cancelar</button>
                            <button type="submit" form="create-user-form" className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg">Crear Usuario</button>
                        </div>
                    }
                >
                    <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre Completo</label>
                            <input className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" placeholder="Ej: Juan Perez" required value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email (Usuario)</label>
                            <input type="email" className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" placeholder="usuario@email.com" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono</label>
                            <input type="tel" className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" placeholder="11 1234 5678" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Rol</label>
                            <select className="input-field bg-white border-ink-200 text-ink-700 focus:border-primary-500" value={newRole} onChange={e => {
                                if (e.target.value === 'client-flow') {
                                    setShowModal(false);
                                    setShowAltaClienteCaballo(true);
                                } else {
                                    setNewRole(e.target.value);
                                }
                            }}>
                                <option value="tenantAdmin">Administrador</option>
                                <option value="staff">Staff (Base)</option>
                                {customRoles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} (Custom)</option>
                                ))}
                                <option value="client-flow">Cliente Dueño (+ Registrar Caballo)</option>
                            </select>
                        </div>
                        <div className="pt-2 text-xs text-ink-500 text-center italic">
                            Contraseña por defecto: <code className="font-mono bg-ink-100 px-1.5 py-0.5 rounded text-ink-700 font-bold border border-ink-200">1234</code>
                        </div>
                    </form>
                </Modal>
            )}

            {/* EDIT USER MODAL */}
            {userToEdit && (
                <Modal
                    isOpen={!!userToEdit}
                    onClose={() => setUserToEdit(null)}
                    title="Editar Usuario"
                    size="md"
                    footer={
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setUserToEdit(null)} className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors">Cancelar</button>
                            <button type="submit" form="edit-user-form" className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg">Guardar Cambios</button>
                        </div>
                    }
                >
                    <form id="edit-user-form" onSubmit={handleEditUser} className="space-y-4 py-2">
                        <div className="bg-ink-50 p-3 rounded-lg border border-ink-200 text-sm">
                            <span className="text-ink-500 font-medium">Email: </span>
                            <span className="text-ink-900 font-bold">{userToEdit.email}</span>
                            <div className="text-xs text-ink-400 mt-1 italic">El email no se puede cambiar por razones de seguridad.</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre Completo</label>
                            <input className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" required value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono</label>
                            <input type="tel" className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Rol de Acceso</label>
                            <select className="input-field bg-white border-ink-200 text-ink-700 focus:border-primary-500" value={editRole} onChange={e => setEditRole(e.target.value)}>
                                <option value="tenantAdmin">Administrador</option>
                                <option value="client">Cliente Dueño</option>
                                <option value="staff">Staff (Base)</option>
                                {customRoles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} (Custom)</option>
                                ))}
                            </select>
                        </div>
                    </form>
                </Modal>
            )}

            {/* CREATE ROLE MODAL */}
            {showRoleModal && (
                <Modal
                    isOpen={showRoleModal}
                    onClose={() => setShowRoleModal(false)}
                    title="Nuevo Rol Personalizado"
                    size="sm"
                    footer={
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors">Cancelar</button>
                            <button type="submit" form="create-role-form" className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg">Crear Rol</button>
                        </div>
                    }
                >
                    <form id="create-role-form" onSubmit={handleCreateRole} className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre del Rol</label>
                            <input className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" placeholder="Ej: Veterinario, Contador..." required value={newRoleName} onChange={e => setNewRoleName(e.target.value)} autoFocus />
                        </div>
                        <p className="text-xs text-ink-500 italic mt-2">Una vez creado, podrás configurar sus permisos desde la Matriz.</p>
                    </form>
                </Modal>
            )}

            {/* EDIT ROLE MODAL */}
            {roleToEdit && (
                <Modal
                    isOpen={!!roleToEdit}
                    onClose={() => setRoleToEdit(null)}
                    title="Editar Nombre del Rol"
                    size="sm"
                    footer={
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setRoleToEdit(null)} className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors">Cancelar</button>
                            <button type="submit" form="edit-role-form" className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg">Guardar</button>
                        </div>
                    }
                >
                    <form id="edit-role-form" onSubmit={handleEditRole} className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre del Rol</label>
                            <input className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" required value={editRoleName} onChange={e => setEditRoleName(e.target.value)} autoFocus />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Nuevo Cliente + Caballos Modal */}
            {showAltaClienteCaballo && (
                <AltaClienteCaballoModal
                    isOpen={showAltaClienteCaballo}
                    onClose={() => setShowAltaClienteCaballo(false)}
                />
            )}

            {/* Modal de confirmación de eliminación en cascada */}
            {clientToDelete && (
                <Modal
                    isOpen={!!clientToDelete}
                    onClose={() => setClientToDelete(null)}
                    title={`¿Eliminar a ${clientToDelete.displayName}?`}
                    subtitle="Esta acción es irreversible y realizará un borrado en cascada."
                    size="md"
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <button onClick={() => setClientToDelete(null)} className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors" disabled={isDeleting}>Cancelar</button>
                            <button onClick={confirmDeleteClient} className="flex-1 py-2 text-sm font-medium bg-danger-600 text-white hover:bg-danger-700 rounded-lg disabled:opacity-50 transition-colors" disabled={isDeleting}>
                                {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-sm text-ink-600">
                        <div className="bg-danger-50 border border-danger-200 text-danger-700 p-3.5 rounded-xl text-xs flex gap-2.5 items-start">
                            <span className="font-bold flex-shrink-0 text-base leading-none">⚠️</span>
                            <p className="leading-snug">Se eliminará la cuenta del cliente y todos los datos asociados listados a continuación. Los boxes que ocupen sus caballos quedarán libres automáticamente.</p>
                        </div>
                        <div className="space-y-2 bg-ink-50 p-4 rounded-xl border border-ink-200 font-medium text-ink-700">
                            <div className="flex justify-between items-center"><span>Caballos asociados:</span><span className="text-ink-900 font-bold font-mono">{(horses || []).filter(h => h.ownerId === clientToDelete.uid).length}</span></div>
                            <div className="flex justify-between items-center"><span>Equipamiento / Monturas:</span><span className="text-ink-900 font-bold font-mono">{(equipmentItems || []).filter(eq => eq.ownerId === clientToDelete.uid).length}</span></div>
                            <div className="flex justify-between items-center"><span>Movimientos financieros:</span><span className="text-ink-900 font-bold font-mono">{(finances || []).filter(f => f.clientId === clientToDelete.uid).length}</span></div>
                            <div className="flex justify-between items-center"><span>Solicitudes registradas:</span><span className="text-ink-900 font-bold font-mono">{(requests || []).filter(r => r.clientId === clientToDelete.uid).length}</span></div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
