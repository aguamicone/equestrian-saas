import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, MessageCircle, MapPin, Info, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui';

export default function PublicTenantView() {
    const { currentTenant } = useAuth();
    const navigate = useNavigate();
    const [spaces, setSpaces] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fallbackTenant, setFallbackTenant] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let targetTenantId = currentTenant?.id;

                // Fallback para localhost: si no hay tenant por subdominio, forzamos 'equus-fidei'
                if (!targetTenantId) {
                    const { getDoc, doc } = await import('firebase/firestore');
                    const equusDoc = await getDoc(doc(db, 'TENANTS', 'equus-fidei'));
                    if (equusDoc.exists()) {
                        targetTenantId = 'equus-fidei';
                    } else {
                        // Si por alguna razón no existe, buscamos el primero
                        const { getDocs, limit, query, collection } = await import('firebase/firestore');
                        const tenantsQuery = query(collection(db, 'TENANTS'), limit(1));
                        const tenantsSnap = await getDocs(tenantsQuery);
                        if (!tenantsSnap.empty) {
                            targetTenantId = tenantsSnap.docs[0].id;
                        }
                    }
                }

                if (!targetTenantId) {
                    setLoading(false);
                    return;
                }

                // Fetch SPACES
                const spacesQuery = query(collection(db, 'SPACES'), where('tenantId', '==', targetTenantId));
                const spacesSnap = await getDocs(spacesQuery);
                setSpaces(spacesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

                // Fetch PRICING_PLANS
                const plansQuery = query(collection(db, 'PRICING_PLANS'), where('tenantId', '==', targetTenantId));
                const plansSnap = await getDocs(plansQuery);
                setPricingPlans(plansSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                
                // Si usamos fallback, guardamos nombre del tenant para mostrar
                if (!currentTenant && targetTenantId) {
                     const { getDoc, doc } = await import('firebase/firestore');
                     const tDoc = await getDoc(doc(db, 'TENANTS', targetTenantId));
                     if(tDoc.exists()) {
                         setFallbackTenant(tDoc.data());
                     }
                }

            } catch (err) {
                console.error("Error loading public data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentTenant]);

    const activeTenant = currentTenant || fallbackTenant;

    if (!activeTenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ink-50 p-4">
                <Card padding="normal" className="text-center p-8 max-w-sm w-full">
                    <p className="text-ink-600 font-medium">Cargando club...</p>
                </Card>
            </div>
        );
    }

    const freeBoxes = spaces.filter(s => s.status === 'available').length;
    const totalBoxes = spaces.length;

    const contactClub = () => {
        // Fallback email or whatsapp
        const phone = activeTenant.contactPhone || '';
        if (phone) {
            window.open(`https://wa.me/${phone}?text=Hola, estoy interesado en los servicios de pensión para mi caballo.`, '_blank');
        } else {
            window.location.href = `mailto:${activeTenant.contactEmail || 'contacto@club.com'}?subject=Consulta de Pensión`;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-ink-800 pb-20">
            {/* Public Header */}
            <header className="bg-white/80 backdrop-blur-md p-4 border-b border-ink-200 sticky top-0 z-50 flex justify-between items-center shadow-sm">
                <button onClick={() => navigate('/login')} className="p-2 text-ink-500 hover:bg-ink-100 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="font-bold text-lg text-ink-900">{activeTenant.name}</div>
                <div className="w-9 h-9">
                    {/* Placeholder para alinear el título al centro */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 mt-4">
                
                {/* Hero Section */}
                <div className="text-center space-y-3 mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 drop-shadow-sm">
                        Instalaciones y Pensiones
                    </h1>
                    <p className="text-ink-500 max-w-lg mx-auto font-medium text-sm sm:text-base">
                        Descubrí la comodidad y seguridad que ofrecemos para tu caballo. Conocé nuestra disponibilidad en tiempo real y elegí el plan que mejor se adapte a tus necesidades.
                    </p>
                    <div className="pt-4">
                         <span className="inline-flex items-center gap-2 px-4 py-2 bg-success-50 text-success-700 border border-success-200 rounded-full text-sm font-bold uppercase tracking-widest shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
                            {freeBoxes} Boxes Disponibles
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-ink-400 font-medium animate-pulse">Cargando instalaciones...</div>
                ) : (
                    <>
                        {/* Space Availability Grid */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-ink-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-ink-800 leading-tight">Plano de Caballerizas</h2>
                                    <p className="text-xs font-medium text-ink-500">Vista en vivo de nuestra disponibilidad</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                {spaces.map(space => (
                                    <div 
                                        key={space.id} 
                                        className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm
                                            ${space.status === 'available' 
                                                ? 'bg-success-50 border-2 border-success-400 text-success-700 hover:bg-success-100 cursor-pointer' 
                                                : 'bg-ink-100 border border-ink-200 text-ink-400 cursor-not-allowed opacity-80'}`}
                                    >
                                        {space.name}
                                    </div>
                                ))}
                                {spaces.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-ink-500 font-medium">
                                        No hay información de boxes disponible.
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-ink-100">
                                <div className="flex items-center gap-2 text-xs font-bold text-ink-600 uppercase tracking-wider">
                                    <div className="w-3 h-3 rounded-full bg-success-400"></div> Disponible
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-ink-600 uppercase tracking-wider">
                                    <div className="w-3 h-3 rounded-full bg-ink-200"></div> Ocupado
                                </div>
                            </div>
                        </section>

                        {/* Pricing Plans */}
                        <section className="space-y-6 pt-4">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-ink-800">Nuestros Planes</h2>
                                <p className="text-sm text-ink-500 mt-1">Soluciones pensadas para el bienestar equino.</p>
                            </div>

                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {pricingPlans.length > 0 ? pricingPlans.map((plan, index) => (
                                    <div key={plan.id} className={`bg-white rounded-3xl p-6 sm:p-8 shadow-card border relative flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 ${index === 1 ? 'border-primary-400 ring-4 ring-primary-50' : 'border-ink-100'}`}>
                                        {index === 1 && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                                                Recomendado
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-ink-900 mb-2">{plan.name}</h3>
                                            <div className="mb-4">
                                                <span className="text-3xl font-extrabold text-ink-900">${plan.amount}</span>
                                                <span className="text-ink-500 font-medium text-sm"> / mes</span>
                                            </div>
                                            <p className="text-sm text-ink-600 mb-6 min-h-[40px]">{plan.description}</p>
                                            
                                            <ul className="space-y-3 mb-8">
                                                <li className="flex items-start gap-2 text-sm text-ink-700">
                                                    <CheckCircle2 size={16} className="text-success-500 shrink-0 mt-0.5"/>
                                                    <span>Box {plan.spaceType === 'corral' ? 'en Piquete/Corral' : 'Estándar'}</span>
                                                </li>
                                                <li className="flex items-start gap-2 text-sm text-ink-700">
                                                    <CheckCircle2 size={16} className="text-success-500 shrink-0 mt-0.5"/>
                                                    <span>Incluye Ración y Cama</span>
                                                </li>
                                                <li className="flex items-start gap-2 text-sm text-ink-700">
                                                    <CheckCircle2 size={16} className="text-success-500 shrink-0 mt-0.5"/>
                                                    <span>Acceso a Pista</span>
                                                </li>
                                                {index > 0 && (
                                                    <li className="flex items-start gap-2 text-sm text-ink-700">
                                                        <CheckCircle2 size={16} className="text-success-500 shrink-0 mt-0.5"/>
                                                        <span className="font-medium">Limpieza Extra Premium</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <button onClick={contactClub} className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${index === 1 ? 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95' : 'bg-ink-100 text-ink-800 hover:bg-ink-200 active:scale-95'}`}>
                                            <MessageCircle size={18}/> Me Interesa
                                        </button>
                                    </div>
                                )) : (
                                    <div className="col-span-full bg-white border border-ink-100 rounded-2xl p-8 text-center shadow-sm">
                                        <Info className="mx-auto text-ink-400 mb-2" size={24}/>
                                        <p className="text-ink-500 font-medium">Los planes se publicarán a la brevedad.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
