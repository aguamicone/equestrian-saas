import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui';
import CalendarWidget from '../../components/routines/CalendarWidget';

export default function ClientRoutinesView() {
    const { routines, horses } = useData();
    const { currentUser } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());

    // El cliente solo ve sus caballos
    const myHorses = horses.filter(h => h.ownerId === currentUser.uid);
    const myHorseIds = myHorses.map(h => h.id);

    // Filtramos las rutinas que pertenezcan a los caballos del cliente
    const myRoutines = routines.filter(r => myHorseIds.includes(r.horseId));

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <PageHeader 
                title="Mi Calendario" 
                subtitle="Seguimiento de las rutinas y actividades programadas para tus caballos."
            />

            {myHorses.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-ink-200 text-center">
                    <p className="text-ink-500">No tienes caballos asignados a tu cuenta actualmente.</p>
                </div>
            ) : (
                <div className="flex-1 min-h-0">
                    <CalendarWidget 
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        events={myRoutines}
                        isClient={true} // Deshabilita interacciones de edición/creación
                    />
                </div>
            )}
        </div>
    );
}
