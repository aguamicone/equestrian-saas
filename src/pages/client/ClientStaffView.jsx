import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Users, Phone, Clock } from 'lucide-react';
import { PageHeader, Card, Badge } from '../../components/ui';

export default function ClientStaffView() {
    const { shifts, tenantUsers } = useData();

    // Filter only staff members
    const staffMembers = tenantUsers.filter(u => u.role === 'staff');

    // Helper to get active status
    const isStaffActive = (staffId) => {
        const now = new Date();
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        return shifts.some(s =>
            s.staffId === staffId &&
            s.day === currentDay &&
            s.start <= currentTime &&
            s.end >= currentTime
        );
    };

    // Group shifts by staff
    const getStaffShifts = (staffId) => {
        return shifts.filter(s => s.staffId === staffId);
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                title="Nuestro Personal"
                subtitle="Conoce los horarios y contactos de nuestro equipo para coordinar servicios"
                icon={Users}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                {staffMembers.map(staff => {
                    const isActive = isStaffActive(staff.uid);
                    const staffShifts = getStaffShifts(staff.uid);

                    return (
                        <Card key={staff.uid} padding="none" className="overflow-hidden border-ink-200 shadow-sm bg-white hover:border-ink-300 transition-all duration-200">
                            <div className="p-5 flex items-center gap-4 border-b border-ink-150 bg-ink-50/20">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border transition-colors ${
                                    isActive 
                                    ? 'bg-success-50 text-success-700 border-success-200' 
                                    : 'bg-ink-100 text-ink-600 border-ink-200'
                                }`}>
                                    {staff.displayName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-ink-900 text-lg flex items-center gap-2">
                                        {staff.displayName}
                                        {isActive && <Badge tone="success" size="sm">En Turno</Badge>}
                                    </div>
                                    <div className="text-ink-450 text-[10px] font-bold uppercase tracking-wider">
                                        {staff.role === 'staff' ? 'Staff / Caballerizo' : staff.role}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4 bg-white">
                                {/* Contact Info */}
                                <div className="flex items-center gap-3 bg-ink-50/50 p-3.5 rounded-xl border border-ink-150">
                                    <div className="p-2 bg-white rounded-full text-primary-600 border border-ink-150 shadow-sm">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-ink-500 uppercase font-bold tracking-wider">WhatsApp / Teléfono</div>
                                        <div className="font-mono text-lg text-ink-900 font-bold leading-tight">{staff.phoneNumber || 'Sin número'}</div>
                                    </div>
                                </div>

                                {/* Schedule Summary */}
                                <div>
                                    <div className="flex items-center gap-2 text-xs uppercase font-bold text-ink-500 mb-2.5 tracking-wider">
                                        <Clock size={13} className="text-primary-500" />
                                        <span>Horarios Semanales</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {staffShifts.length > 0 ? (
                                            staffShifts.map(shift => (
                                                <div key={shift.id} className="text-xs flex justify-between items-center bg-ink-50/30 border border-ink-150 px-3.5 py-2.5 rounded-xl text-ink-700">
                                                    <span className="font-semibold text-ink-900">{shift.day}</span>
                                                    <span className="font-mono font-medium text-ink-600">{shift.start} - {shift.end}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-ink-450 italic p-1">Sin horarios asignados</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {staffMembers.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white border border-ink-200 rounded-2xl shadow-sm">
                        <Users size={48} className="text-ink-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-ink-900">Sin personal</h3>
                        <p className="text-ink-500 text-sm mt-1">No hay personal registrado en este haras.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
