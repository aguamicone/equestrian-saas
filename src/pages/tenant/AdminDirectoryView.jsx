import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PageHeader, Tabs } from '../../components/ui';
import { Phone, BookOpen, MapPin, Edit2, Trash2, UserPlus, Info } from 'lucide-react';
import DirectoryModal from '../../components/directory/DirectoryModal';
import { useNotification } from '../../context/NotificationContext';

export default function AdminDirectoryView() {
    const { directoryContacts, deleteContact } = useData();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState('veterinario');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, contact: null });

    const tabs = [
        { key: 'veterinario', label: 'Veterinarios' },
        { key: 'herrero', label: 'Herreros' },
        { key: 'clinica', label: 'Clínicas / Centros' }
    ];

    const filteredContacts = directoryContacts.filter(c => c.category === activeTab);

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseás eliminar este contacto?')) {
            const res = await deleteContact(id);
            if (res.success) {
                notify('Contacto eliminado', 'success');
            } else {
                notify('Error al eliminar contacto', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Directorio de Contactos"
                subtitle="Gestioná la agenda de profesionales y clínicas del haras"
                icon={BookOpen}
                actions={
                    <button 
                        onClick={() => setModalConfig({ isOpen: true, contact: null })}
                        className="btn-primary flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        <span>Nuevo Contacto</span>
                    </button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-ink-200 overflow-hidden">
                <div className="px-6 pt-3 border-b border-ink-100">
                    <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
                </div>

                <div className="p-6">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50">
                            <BookOpen className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-ink-900">No hay contactos</h3>
                            <p className="text-xs text-ink-500 mt-1">
                                No se encontraron registros en esta categoría.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredContacts.map(contact => (
                                <div key={contact.id} className="relative group bg-white border border-ink-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setModalConfig({ isOpen: true, contact })}
                                            className="p-1.5 text-ink-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(contact.id)}
                                            className="p-1.5 text-ink-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <h3 className="font-display font-medium text-ink-900 text-lg mb-1 pr-16">{contact.name}</h3>
                                    
                                    {contact.specialty && (
                                        <span className="inline-block px-2 py-1 bg-ink-100 text-ink-600 text-xs font-medium rounded-md mb-4">
                                            {contact.specialty}
                                        </span>
                                    )}

                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center gap-2 text-sm text-ink-700">
                                            <Phone size={16} className="text-ink-400 shrink-0" />
                                            <a href={`tel:${contact.phone}`} className="hover:text-primary-600 hover:underline">
                                                {contact.phone}
                                            </a>
                                        </div>
                                        
                                        {contact.location && (
                                            <div className="flex items-center gap-2 text-sm text-ink-700">
                                                <MapPin size={16} className="text-ink-400 shrink-0" />
                                                <span className="truncate">{contact.location}</span>
                                            </div>
                                        )}
                                        
                                        {contact.notes && (
                                            <div className="flex items-start gap-2 text-sm text-ink-600 bg-ink-50 p-2.5 rounded-lg mt-3">
                                                <Info size={16} className="text-ink-400 shrink-0 mt-0.5" />
                                                <p className="line-clamp-2">{contact.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalConfig.isOpen && (
                <DirectoryModal 
                    contact={modalConfig.contact} 
                    onClose={() => setModalConfig({ isOpen: false, contact: null })} 
                />
            )}
        </div>
    );
}
