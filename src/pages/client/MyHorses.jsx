import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, ChevronRight, FileText, Activity, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyHorses() {
    const { horses, addHorse, pricingPlans } = useData();
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
    const myHorses = horses.filter(h => h.ownerId === currentUser.uid);

    const handleSubmit = (e) => {
        e.preventDefault();
        addHorse({
            name, breed, age, color, photo,
            ownerId: currentUser.uid,
            documents: [],
            sanity: []
        });
        setShowModal(false);
        setName(''); setBreed('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">Mis Caballos</h2>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={16} /> Agregar
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {myHorses.map(horse => {
                    const activePlans = pricingPlans.filter(p => horse.assignedPlanIds?.includes(p.id));

                    return (
                        <div key={horse.id} onClick={() => navigate(`/client/horses/${horse.id}`)} className="glass-card flex active:scale-95 transition-transform relative group">

                            {/* Membership Badge */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                {activePlans.map(plan => (
                                    <span key={plan.id} className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider ${plan.type === 'membership' ? 'bg-gold-500 text-black' : 'bg-blue-900 text-blue-200 border border-blue-700'
                                        }`}>
                                        {plan.name}
                                    </span>
                                ))}
                            </div>

                            <div className="w-24 h-24 bg-slate-700">
                                {horse.photo ? (
                                    <img src={horse.photo} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">🐴</div>
                                )}
                            </div>
                            <div className="p-4 flex-1 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{horse.name}</h3>
                                    <p className="text-sm text-slate-400">{horse.breed} • {horse.age} años</p>
                                    <p className={`text-xs mt-1.5 font-bold flex items-center gap-1 ${(!horse.location || horse.location === 'box') ? 'text-slate-400' : horse.location === 'piquete' ? 'text-green-400' : 'text-orange-400'}`}>
                                        <MapPin size={12}/> {(!horse.location || horse.location === 'box') ? 'En Box' : horse.location === 'piquete' ? 'En Piquete' : 'En Circular'}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="glass-panel w-full max-w-md p-6 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-white mb-4">Alta de Caballo</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400">Nombre</label>
                                    <input className="input-field" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-slate-400">Raza</label>
                                        <input className="input-field" value={breed} onChange={e => setBreed(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Edad</label>
                                        <input type="number" className="input-field" value={age} onChange={e => setAge(e.target.value)} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Pelaje (Color)</label>
                                    <input className="input-field" value={color} onChange={e => setColor(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Foto (URL)</label>
                                    <input className="input-field" placeholder="https://..." value={photo} onChange={e => setPhoto(e.target.value)} />
                                    <p className="text-xs text-slate-500 mt-1">Pega una URL de Unsplash o similar.</p>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-400">Cancelar</button>
                                    <button type="submit" className="flex-1 btn-primary">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
