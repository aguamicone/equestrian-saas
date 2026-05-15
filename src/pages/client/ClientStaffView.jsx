import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Users, Phone, Clock, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

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
            <h2 className="text-2xl font-bold text-slate-100">Nuestro Personal</h2>
            <p className="text-slate-400 text-sm">Conoce los horarios y contactos de nuestro equipo para coordinar servicios.</p>

            <div className="grid grid-cols-1 gap-4">
                {staffMembers.map(staff => {
                    const isActive = isStaffActive(staff.uid);
                    const staffShifts = getStaffShifts(staff.uid);

                    return (
                        <div key={staff.uid} className="glass-card border border-slate-700 overflow-hidden shadow-lg">
                            <div className="p-4 flex items-center gap-4 border-b border-slate-700/50">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isActive ? 'bg-green-500/20 text-green-400 border-2 border-green-500' : 'bg-slate-700 text-slate-400'}`}>
                                    {staff.displayName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg flex items-center gap-2">
                                        {staff.displayName}
                                        {isActive && <span className="px-2 py-0.5 rounded-full bg-green-500 text-black text-[10px] font-bold uppercase tracking-wide">En Turno</span>}
                                    </div>
                                    <div className="text-slate-400 text-xs uppercase">{staff.role === 'staff' ? 'Staff / Caballerizo' : staff.role}</div>
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Contact Info */}
                                <div className="flex items-center gap-3 text-slate-300 bg-slate-750 p-3 rounded-lg border border-slate-700">
                                    <div className="p-2 bg-slate-700 rounded-full text-gold-500">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">WhatsApp / Teléfono</div>
                                        <div className="font-mono text-lg">{staff.phoneNumber || 'Sin número'}</div>
                                    </div>
                                </div>

                                {/* Schedule Summary */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                        <CalendarIcon size={14} />
                                        <span className="font-bold">Horarios Semanales</span>
                                    </div>
                                    <div className="space-y-1">
                                        {staffShifts.length > 0 ? (
                                            staffShifts.map(shift => (
                                                <div key={shift.id} className="text-xs flex justify-between items-center bg-slate-700/30 px-3 py-2 rounded text-slate-300">
                                                    <span className="font-medium text-white">{shift.day}</span>
                                                    <span className="font-mono">{shift.start} - {shift.end}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-slate-500 italic">Sin horarios asignados</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {staffMembers.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No hay personal registrado en esta nave.
                    </div>
                )}
            </div>
        </div>
    );
}
