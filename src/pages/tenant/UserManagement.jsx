import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Search, UserCog, User, Shield, Plus } from 'lucide-react';
import AltaClienteCaballoModal from '../../components/users/modals/AltaClienteCaballoModal';
import { PageHeader, Card, Badge, Modal } from '../../components/ui';

export default function UserManagement() {
    const { currentUser } = useAuth();
    const { addUser, tenantUsers, deleteClientCascading, horses, equipmentItems, finances, requests } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showAltaClienteCaballo, setShowAltaClienteCaballo] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('staff');
    const [newPhone, setNewPhone] = useState('');

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

    // Filter
    const filteredUsers = tenantUsers.filter(u =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                kicker="Panel de administración"
                title="Gestión de Usuarios"
                subtitle="Control de accesos y perfiles de clientes y personal"
                icon={UserCog}
                actions={
                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={18} /> Nuevo Usuario
                    </button>
                }
            />

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                    className="input-field pl-9 py-2.5 text-sm w-full bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500 focus:ring-0"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Users Table */}
            <Card padding="none" className="overflow-hidden border-ink-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-ink-600 border-collapse">
                        <thead className="bg-ink-50 text-ink-500 uppercase font-bold text-[11px] tracking-wider border-b border-ink-200">
                            <tr>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Rol Actual</th>
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
                                filteredUsers.map(user => (
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
                                                user.role === 'staff' ? 'sky' :
                                                user.role === 'tenantAdmin' ? 'success' :
                                                'neutral'
                                            }>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            {user.role === 'client' ? (
                                                <button
                                                    onClick={() => setClientToDelete(user)}
                                                    className="text-xs text-danger-600 hover:text-danger-700 font-bold hover:underline bg-danger-50 hover:bg-danger-100 px-2.5 py-1.5 rounded-md border border-danger-200 transition-all"
                                                >
                                                    Eliminar
                                                </button>
                                            ) : (
                                                <span className="text-xs text-ink-400 italic">Editar (Próximamente)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* CREATE USER MODAL */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Registrar Nuevo Usuario"
                    size="md"
                    footer={
                        <div className="flex gap-3 w-full">
                            <button 
                                type="button" 
                                onClick={() => setShowModal(false)} 
                                className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                form="create-user-form" 
                                className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg"
                            >
                                Crear Usuario
                            </button>
                        </div>
                    }
                >
                    <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre Completo</label>
                            <input
                                className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500"
                                placeholder="Ej: Juan Perez"
                                required
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email (Usuario)</label>
                            <input
                                type="email"
                                className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500"
                                placeholder="usuario@email.com"
                                required
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono</label>
                            <input
                                type="tel"
                                className="input-field bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500"
                                placeholder="11 1234 5678"
                                value={newPhone}
                                onChange={e => setNewPhone(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Rol</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setShowAltaClienteCaballo(true);
                                    }}
                                    className="p-3 rounded-lg border text-sm font-bold transition-all bg-ink-50 border-ink-200 text-ink-700 hover:bg-ink-100 hover:border-ink-300"
                                >
                                    Cliente (Dueño)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewRole('staff')}
                                    className={`p-3 rounded-lg border text-sm font-bold transition-all ${newRole === 'staff' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-ink-50 border-ink-200 text-ink-700 hover:bg-ink-100 hover:border-ink-300'}`}
                                >
                                    Staff
                                </button>
                            </div>
                        </div>
                        <div className="pt-2 text-xs text-ink-500 text-center italic">
                            Contraseña por defecto: <code className="font-mono bg-ink-100 px-1.5 py-0.5 rounded text-ink-700 font-bold border border-ink-200">1234</code>
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
                            <button
                                onClick={() => setClientToDelete(null)}
                                className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteClient}
                                className="flex-1 py-2 text-sm font-medium bg-danger-600 text-white hover:bg-danger-700 rounded-lg disabled:opacity-50 transition-colors"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-sm text-ink-600">
                        <div className="bg-danger-50 border border-danger-200 text-danger-700 p-3.5 rounded-xl text-xs flex gap-2.5 items-start">
                            <span className="font-bold flex-shrink-0 text-base leading-none">⚠️</span>
                            <p className="leading-snug">
                                Se eliminará la cuenta del cliente y todos los datos asociados listados a continuación. Los boxes que ocupen sus caballos quedarán libres automáticamente.
                            </p>
                        </div>
                        
                        <div className="space-y-2 bg-ink-50 p-4 rounded-xl border border-ink-200 font-medium text-ink-700">
                            <div className="flex justify-between items-center">
                                <span>Caballos asociados:</span>
                                <span className="text-ink-900 font-bold font-mono">
                                    {(horses || []).filter(h => h.ownerId === clientToDelete.uid).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Equipamiento / Monturas:</span>
                                <span className="text-ink-900 font-bold font-mono">
                                    {(equipmentItems || []).filter(eq => eq.ownerId === clientToDelete.uid).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Movimientos financieros (Cuenta corriente):</span>
                                <span className="text-ink-900 font-bold font-mono">
                                    {(finances || []).filter(f => f.clientId === clientToDelete.uid).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Solicitudes registradas:</span>
                                <span className="text-ink-900 font-bold font-mono">
                                    {(requests || []).filter(r => r.clientId === clientToDelete.uid).length}
                                </span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
