import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getCollection } from '../../services/mockFirebase'; // Use dynamic collection
import { Search, UserCog, User, Shield, Plus, X } from 'lucide-react';
import AltaClienteCaballoModal from '../../components/users/modals/AltaClienteCaballoModal';

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

    // Use tenantUsers from context instead of local state for reactivity
    const filteredUsers = tenantUsers.filter(u =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <UserCog className="text-gold-500" /> Gestión de Usuarios
                </h2>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 hover:text-white" />
                <input
                    className="input-field pl-10"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="glass-card border border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-slate-200 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Rol Actual</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredUsers.map(user => (
                            <tr key={user.uid} className="hover:bg-slate-700/50 transition-colors">
                                <td className="p-4 font-bold text-slate-200 flex items-center gap-2">
                                    <div className="p-1 bg-slate-700 rounded-full">
                                        {user.role === 'staff' ? <Shield size={14} className="text-gold-500" /> : <User size={14} />}
                                    </div>
                                    <div>
                                        <div>{user.displayName}</div>
                                        {user.phoneNumber && <div className="text-xs text-slate-500">{user.phoneNumber}</div>}
                                    </div>
                                </td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'staff' ? 'bg-gold-500/20 text-gold-500 border border-gold-500/50' :
                                        user.role === 'tenantAdmin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                                            'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {user.role === 'client' ? (
                                        <button
                                            onClick={() => setClientToDelete(user)}
                                            className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-md border border-red-500/30 transition-all"
                                        >
                                            Eliminar
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-600">Editar (Próximamente)</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE USER MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-slate-700 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-white">Registrar Nuevo Usuario</h3>
                            <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Nombre Completo</label>
                                <input
                                    className="input-field"
                                    placeholder="Ej: Juan Perez"
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email (Usuario)</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="usuario@email.com"
                                    required
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder="11 1234 5678"
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Rol</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setShowAltaClienteCaballo(true);
                                        }}
                                        className={`p-3 rounded-lg border text-sm font-bold transition-all bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600`}
                                    >
                                        Cliente (Dueño)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewRole('staff')}
                                        className={`p-3 rounded-lg border text-sm font-bold transition-all ${newRole === 'staff' ? 'bg-gold-500/20 border-gold-500 text-gold-500' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                                    >
                                        Staff
                                    </button>
                                </div>
                            </div>
                            <div className="pt-2 text-xs text-slate-500 text-center">
                                Contraseña por defecto: <code>1234</code>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Crear Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
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
                    open={!!clientToDelete}
                    onClose={() => setClientToDelete(null)}
                    title={`¿Eliminar a ${clientToDelete.displayName}?`}
                    subtitle="Esta acción es irreversible y realizará un borrado en cascada."
                    size="md"
                    footer={
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setClientToDelete(null)}
                                className="btn-secondary"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteClient}
                                className="btn-danger"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-sm text-slate-300">
                        <p className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
                            ⚠️ Se eliminará la cuenta del cliente y todos los datos asociados listados a continuación. Los boxes que ocupen sus caballos quedarán libres automáticamente.
                        </p>
                        
                        <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-700 font-medium">
                            <div className="flex justify-between">
                                <span>Caballos asociados:</span>
                                <span className="text-white font-bold">
                                    {(horses || []).filter(h => h.ownerId === clientToDelete.uid).length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Equipamiento / Monturas:</span>
                                <span className="text-white font-bold">
                                    {(equipmentItems || []).filter(eq => eq.ownerId === clientToDelete.uid).length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Movimientos financieros (Cuenta corriente):</span>
                                <span className="text-white font-bold">
                                    {(finances || []).filter(f => f.clientId === clientToDelete.uid).length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Solicitudes registradas:</span>
                                <span className="text-white font-bold">
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
