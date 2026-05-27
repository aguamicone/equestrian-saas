import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PageHeader, Tabs } from '../../components/ui';
import { Phone, BookOpen, MapPin, Info, Users } from 'lucide-react';

export default function DirectoryView() {
    const { directoryContacts } = useData();
    const [activeTab, setActiveTab] = useState('veterinario');

    const tabs = [
        { key: 'veterinario', label: 'Veterinarios' },
        { key: 'herrero', label: 'Herreros' },
        { key: 'clinica', label: 'Clínicas / Centros' }
    ];

    const filteredContacts = directoryContacts.filter(c => c.category === activeTab);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Contactos Útiles"
                subtitle="Directorio de profesionales recomendados del haras"
                icon={BookOpen}
                color="indigo"
            />

            <div className="bg-white rounded-xl shadow-sm border border-ink-200 overflow-hidden">
                <div className="px-6 pt-3 border-b border-ink-100">
                    <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
                </div>

                <div className="p-6">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50">
                            <Users className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-ink-900">No hay contactos</h3>
                            <p className="text-xs text-ink-500 mt-1">
                                No hay profesionales registrados en esta categoría aún.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredContacts.map(contact => (
                                <div key={contact.id} className="bg-white border border-ink-200 rounded-xl p-5 hover:border-primary-300 transition-colors">
                                    <h3 className="font-display font-medium text-ink-900 text-lg mb-1">{contact.name}</h3>
                                    
                                    {contact.specialty && (
                                        <span className="inline-block px-2 py-1 bg-ink-100 text-ink-600 text-xs font-medium rounded-md mb-4">
                                            {contact.specialty}
                                        </span>
                                    )}

                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center gap-2 text-sm text-ink-700">
                                            <Phone size={16} className="text-primary-500 shrink-0" />
                                            <a href={`tel:${contact.phone}`} className="hover:text-primary-600 font-medium hover:underline">
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
                                    
                                    <a 
                                        href={`tel:${contact.phone}`} 
                                        className="mt-5 w-full btn-primary py-2 flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Phone size={16} /> Llamar ahora
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
