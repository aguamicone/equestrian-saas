import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, ChevronRight, MapPin, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, EmptyState, PageHeader } from '../../components/ui';

export default function MyHorses() {
    const { horses, addHorse, pricingPlans, loading } = useData();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    // New Horse Form
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [color, setColor] = useState('');
    const [photo, setPhoto] = useState(''); // Text URL for now

    // Filter owned horses
    const myHorses = (horses || []).filter(h => h.ownerId === currentUser?.uid);

    const handleSubmit = (e) => {
        e.preventDefault();
        addHorse({
            name, breed, age, color, photo,
            ownerId: currentUser?.uid,
            documents: [],
            sanity: []
        });
        setShowModal(false);
        setName(''); setBreed('');
    };

    return (
        <div>
            <PageHeader
                title="Mis Caballos"
                subtitle="Tus compañeros equinos"
                action={{
                    label: "Agregar",
                    icon: Plus,
                    onClick: () => setShowModal(true)
                }}
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl h-24 border border-ink-200"></div>
                    ))}
                </div>
            ) : myHorses.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    message="No tenés caballos asignados"
                    description="Cuando se te asigne un caballo, vas a poder verlo y gestionarlo desde acá. Si querés agregar uno, hacé click en Agregar."
                    action={<button className="btn-primary" onClick={() => setShowModal(true)}>+ Agregar Caballo</button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myHorses.map(horse => {
                        const activePlans = pricingPlans.filter(p => horse.assignedPlanIds?.includes(p.id));

                        return (
                            <Card 
                                key={horse.id} 
                                onClick={() => navigate(`/client/horses/${horse.id}`)} 
                                variant="hover"
                                padding="none"
                                className="flex relative group active:scale-95 transition-transform duration-200 cursor-pointer overflow-hidden"
                            >
                                <div className="w-24 h-24 bg-ink-100 flex-shrink-0 border-r border-ink-100">
                                    {horse.photo ? (
                                        <img src={horse.photo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🐴</div>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex justify-between items-center min-w-0">
                                    <div className="min-w-0 pr-2">
                                        <h3 className="font-bold text-ink-800 text-lg truncate">{horse.name}</h3>
                                        <p className="text-sm text-ink-500 truncate">{horse.breed} • {horse.age} años</p>
                                        
                                        {activePlans.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {activePlans.map(plan => (
                                                    <Badge 
                                                        key={plan.id} 
                                                        variant={plan.type === 'membership' ? 'gold' : 'primary'} 
                                                        size="sm"
                                                    >
                                                        {plan.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${(!horse.location || horse.location === 'box') ? 'text-ink-400' : horse.location === 'piquete' ? 'text-success-600' : 'text-gold-600'}`}>
                                            <MapPin size={12}/> {(!horse.location || horse.location === 'box') ? 'En Box' : horse.location === 'piquete' ? 'En Piquete' : 'En Circular'}
                                        </p>
                                    </div>
                                    <ChevronRight className="text-ink-400 group-hover:text-primary-600 transition flex-shrink-0" />
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-ink-800 mb-4">Alta de Caballo</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm text-ink-700 font-medium block mb-1">Nombre</label>
                                    <input className="input-field" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-ink-700 font-medium block mb-1">Raza</label>
                                        <input className="input-field" value={breed} onChange={e => setBreed(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="text-sm text-ink-700 font-medium block mb-1">Edad</label>
                                        <input type="number" className="input-field" value={age} onChange={e => setAge(e.target.value)} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-700 font-medium block mb-1">Pelaje (Color)</label>
                                    <input className="input-field" value={color} onChange={e => setColor(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-sm text-ink-700 font-medium block mb-1">Foto (URL)</label>
                                    <input className="input-field" placeholder="https://..." value={photo} onChange={e => setPhoto(e.target.value)} />
                                    <p className="text-xs text-ink-400 mt-1">Pega una URL de Unsplash o similar.</p>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-ink-500 hover:text-ink-700 font-medium transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-1 btn-primary">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
