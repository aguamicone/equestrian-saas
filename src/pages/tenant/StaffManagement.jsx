import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Clock, Plus, Trash, Wallet, MapPin, Edit, CheckCircle, Search, User } from 'lucide-react';
import { PageHeader, Card, Badge, Tabs, Modal } from '../../components/ui';

export default function StaffManagement() {
    const { 
        shifts, tenantUsers, addShift, deleteShift, 
        spaces, assignSpaceToStaff,
        payrollAdvances, updateUserSalary, addAdvance 
    } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('turnos');

    const staffMembers = useMemo(() => {
        return (tenantUsers || []).filter(u => u.role === 'staff');
    }, [tenantUsers]);

    // Stats
    const totalItems = staffMembers.length;
    const itemsByOwner = useMemo(() => {
        const counts = {};
        (shifts || []).forEach(item => {
            counts[item.staffId] = (counts[item.staffId] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.map(([uid, count]) => {
            const user = staffMembers.find(u => u.uid === uid);
            return { uid, name: user?.displayName || 'Desconocido', count };
        });
    }, [shifts, staffMembers]);

    return (
        <div className="space-y-6 pb-24">
            <PageHeader 
                kicker="RRHH y Operaciones"
                title="Capital Humano"
                subtitle="Gestión de cronogramas, asignaciones de boxes y nómina del personal"
                icon={Users}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="normal" className="flex items-center gap-4 border-ink-200 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center shrink-0 border border-primary-100">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-ink-900">{totalItems}</div>
                        <div className="text-sm text-ink-500">Staff Activo</div>
                    </div>
                </Card>
                
                <Card padding="normal" className="flex flex-col justify-center border-ink-200 shadow-sm">
                    <div className="text-xs text-ink-450 uppercase tracking-wider font-bold mb-2">Turnos por empleado</div>
                    <div className="flex flex-wrap gap-2">
                        {itemsByOwner.length === 0 && <span className="text-xs text-ink-450 italic">Sin turnos registrados</span>}
                        {itemsByOwner.slice(0, 5).map(owner => (
                            <span key={owner.uid} className="bg-ink-50 text-ink-700 px-2.5 py-1 rounded-lg text-xs border border-ink-200 font-medium">
                                <strong className="text-ink-900">{owner.name}:</strong> {owner.count}
                            </span>
                        ))}
                        {itemsByOwner.length > 5 && <span className="text-xs text-ink-500 py-1 font-medium">+{itemsByOwner.length - 5} más</span>}
                    </div>
                </Card>
            </div>

            {/* Tabs Navigation */}
            <Tabs 
                tabs={[
                    { key: 'turnos', label: 'Cronograma', icon: Calendar },
                    { key: 'boxes', label: 'Asignación de Sectores', icon: MapPin },
                    { key: 'nomina', label: 'Nómina y Adelantos', icon: Wallet }
                ]}
                value={activeTab}
                onChange={setActiveTab}
                className="mt-2"
            />

            {/* Tab Contents */}
            {activeTab === 'turnos' && <TabTurnos staffMembers={staffMembers} shifts={shifts} addShift={addShift} deleteShift={deleteShift} />}
            {activeTab === 'boxes' && <TabBoxes staffMembers={staffMembers} spaces={spaces} assignSpaceToStaff={assignSpaceToStaff} />}
            {activeTab === 'nomina' && <TabNomina staffMembers={staffMembers} payrollAdvances={payrollAdvances} updateUserSalary={updateUserSalary} addAdvance={addAdvance} />}
        </div>
    );
}

// ==========================================
// PESTAÑA 1: Turnos (Cronograma)
// ==========================================
function TabTurnos({ staffMembers, shifts, addShift, deleteShift }) {
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const [selectedStaff, setSelectedStaff] = useState('');
    const [day, setDay] = useState('Lunes');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('16:00');
    const [showModal, setShowModal] = useState(false);

    const handleAddShift = (e) => {
        e.preventDefault();
        addShift({ staffId: selectedStaff, day: day, start: startTime, end: endTime });
        setShowModal(false);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <Card padding="normal" className="flex justify-between items-center bg-ink-50/20 border-ink-200 shadow-sm">
                <span className="text-ink-600 font-medium text-sm">Asigna y revisa la cobertura semanal del personal.</span>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={16} /> Turno Manual
                </button>
            </Card>

            <Card padding="none" className="overflow-hidden border-ink-200 shadow-sm">
                <div className="grid grid-cols-7 border-b border-ink-200 bg-ink-50">
                    {weekDays.map(d => (
                        <div key={d} className="p-4 text-center text-xs font-bold text-ink-500 uppercase tracking-wider">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 divide-x divide-ink-200 border-b border-ink-100">
                    {weekDays.map(d => {
                        const dayShifts = shifts.filter(s => s.day === d);
                        return (
                            <div key={d} className="min-h-[220px] p-2 space-y-2 bg-white hover:bg-ink-50/30 transition-colors">
                                {dayShifts.map(s => {
                                    const staff = staffMembers.find(st => st.uid === s.staffId);
                                    return (
                                        <div key={s.id} className="bg-ink-50 p-2.5 rounded-lg text-xs border-l-2 border-primary-500 group relative border border-ink-200/60 shadow-sm">
                                            <div className="font-bold text-ink-900">{staff?.displayName || 'Desconocido'}</div>
                                            <div className="text-ink-500 flex items-center gap-1 mt-1 font-medium">
                                                <Clock size={10} /> {s.start} - {s.end}
                                            </div>
                                            <button onClick={() => deleteShift(s.id)} className="absolute top-1 right-1 p-1 text-ink-400 hover:text-danger-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-danger-50" title="Eliminar turno">
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Modal Turnos */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Nuevo Turno"
                    size="md"
                    footer={
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors">Cancelar</button>
                            <button type="submit" form="add-shift-form" className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg">Guardar</button>
                        </div>
                    }
                >
                    <form id="add-shift-form" onSubmit={handleAddShift} className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Empleado</label>
                            <select className="input-field bg-white border-ink-200 text-ink-700 focus:border-primary-500" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} required>
                                <option value="" disabled>Seleccionar...</option>
                                {staffMembers.map(s => <option key={s.uid} value={s.uid}>{s.displayName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Día de la Semana</label>
                            <select className="input-field bg-white border-ink-200 text-ink-700 focus:border-primary-500" value={day} onChange={e => setDay(e.target.value)}>
                                {weekDays.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1.5">Hora Inicio</label>
                                <input type="time" className="input-field bg-white border-ink-200 text-ink-700 focus:border-primary-500" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1.5">Hora Fin</label>
                                <input type="time" className="input-field bg-white border-ink-200 text-ink-700 focus:border-primary-500" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ==========================================
// PESTAÑA 2: Boxes y Asignaciones
// ==========================================
function TabBoxes({ staffMembers, spaces, assignSpaceToStaff }) {
    const [selectedSpaces, setSelectedSpaces] = useState([]);
    const [targetStaff, setTargetStaff] = useState('');
    const [filter, setFilter] = useState('');

    const boxes = useMemo(() => {
        return (spaces || []).filter(s => s.type === 'box' && s.name.toLowerCase().includes(filter.toLowerCase()));
    }, [spaces, filter]);

    const toggleSpace = (id) => {
        if (selectedSpaces.includes(id)) setSelectedSpaces(selectedSpaces.filter(s => s !== id));
        else setSelectedSpaces([...selectedSpaces, id]);
    };

    const handleAssign = () => {
        if (!targetStaff) return;
        selectedSpaces.forEach(spaceId => assignSpaceToStaff(spaceId, targetStaff === 'none' ? null : targetStaff));
        setSelectedSpaces([]);
        setTargetStaff('');
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
             <Card padding="normal" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm border-ink-200 bg-ink-50/20">
                 <div>
                     <h3 className="text-ink-900 font-bold mb-1 text-base">Mapeo Rápido de Sectores</h3>
                     <p className="text-ink-500 text-xs font-medium">Selecciona uno o más boxes para asignarlos al petisero responsable de ese pasillo/sector.</p>
                 </div>
                 <div className="relative w-full md:w-64 flex-shrink-0">
                     <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
                     <input type="text" placeholder="Buscar box..." className="input-field pl-9 py-2 text-sm w-full bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500" value={filter} onChange={e=>setFilter(e.target.value)} />
                 </div>
             </Card>

             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                 {boxes.map(s => {
                     const isSelected = selectedSpaces.includes(s.id);
                     const assigneeName = staffMembers.find(st => st.uid === s.staffId)?.displayName;

                     return (
                         <div 
                             key={s.id} onClick={() => toggleSpace(s.id)} 
                             className={`relative p-4 rounded-xl border cursor-pointer transition-all select-none hover:-translate-y-0.5 shadow-sm ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50/40'}`}
                         >
                              {assigneeName && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary-500" title={`Asignado a ${assigneeName}`}></div>}
                              <div className={`font-bold text-base ${isSelected ? 'text-primary-700' : 'text-ink-900'}`}>{s.name}</div>
                              <div className="text-[10px] text-ink-500 uppercase tracking-wider font-bold mt-3">A cargo de:</div>
                              <div className={`text-xs font-semibold ${assigneeName ? 'text-primary-700' : 'text-ink-400 italic'}`}>{assigneeName || 'Sin asignar'}</div>
                         </div>
                     );
                 })}
             </div>

             {/* Action Bar Floating Bottom */}
             {selectedSpaces.length > 0 && (
                 <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-primary-200 p-2.5 pr-4 rounded-full flex flex-col md:flex-row items-center gap-3 shadow-2xl animate-in slide-in-from-bottom z-40">
                     <span className="text-primary-700 font-bold text-xs px-4 whitespace-nowrap">{selectedSpaces.length} boxes seleccionados</span>
                     <div className="w-px h-6 bg-ink-200 hidden md:block"></div>
                     <select className="bg-ink-50 border border-ink-200 text-ink-700 font-semibold text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:border-primary-500 cursor-pointer" value={targetStaff} onChange={e=>setTargetStaff(e.target.value)}>
                         <option value="">-- Seleccionar petisero --</option>
                         <option value="none">Quitar asignación</option>
                         {staffMembers.map(st => <option key={st.uid} value={st.uid}>{st.displayName}</option>)}
                     </select>
                     <button onClick={handleAssign} disabled={!targetStaff} className="btn-primary py-2 px-5 text-xs rounded-full font-bold disabled:opacity-50 whitespace-nowrap">
                         Aplicar Cambios
                     </button>
                 </div>
             )}
        </div>
    );
}

// ==========================================
// PESTAÑA 3: Nómina y Adelantos
// ==========================================
function TabNomina({ staffMembers, payrollAdvances, updateUserSalary, addAdvance }) {
    const currentMonth = new Date().getMonth();
    const monthName = new Date().toLocaleString('es-ES', { month: 'long' });

    const [editingSalaryFor, setEditingSalaryFor] = useState(null);
    const [editingSalaryValue, setEditingSalaryValue] = useState(0);
    const [showAdvanceModal, setShowAdvanceModal] = useState(null);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [advanceReason, setAdvanceReason] = useState('');

    const startEditingSalary = (staff) => {
        setEditingSalaryFor(staff.uid);
        setEditingSalaryValue(staff.salary || 0);
    };

    const saveSalary = () => {
        updateUserSalary(editingSalaryFor, editingSalaryValue);
        setEditingSalaryFor(null);
    };

    const submitAdvance = (e) => {
        e.preventDefault();
        addAdvance({ staffId: showAdvanceModal, amount: Number(advanceAmount), reason: advanceReason });
        setShowAdvanceModal(null);
        setAdvanceAmount('');
        setAdvanceReason('');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
             <Card padding="tight" className="bg-ink-50/50 border-ink-200">
                 <p className="text-ink-700 text-sm font-medium">Período de nómina actual: <span className="font-bold text-ink-950 capitalize">{monthName}</span></p>
             </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {staffMembers.map(staff => {
                    const monthAdvances = payrollAdvances.filter(a => a.staffId === staff.uid && new Date(a.date).getMonth() === currentMonth);
                    const totalAdvances = monthAdvances.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
                    const salary = Number(staff.salary || 0);
                    const remaining = salary - totalAdvances;

                    return (
                        <Card key={staff.uid} variant="hover" padding="normal" className="flex flex-col justify-between h-full border-ink-200 shadow-sm">
                            <div>
                                <div className="flex justify-between items-start mb-6 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-ink-50 text-ink-500 flex items-center justify-center flex-shrink-0 border border-ink-200/50">
                                            <User size={18}/>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-ink-900 text-base leading-tight truncate">{staff.displayName}</div>
                                            <div className="text-xs text-ink-500 font-medium mt-0.5">Personal de Campo</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAdvanceModal(staff.uid)} className="text-[11px] bg-gold-50 text-gold-600 border border-gold-200 px-3 py-1.5 rounded-full font-bold hover:bg-gold-500 hover:text-slate-900 transition-colors flex-shrink-0">
                                        Adelanto
                                    </button>
                                </div>

                                <div className="space-y-3 border-t border-ink-150 pt-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-ink-500 font-medium">Sueldo Base:</span>
                                        {editingSalaryFor === staff.uid ? (
                                            <div className="flex gap-2">
                                                <input type="number" className="bg-white border border-primary-500 text-ink-900 w-28 px-2.5 py-1 text-sm rounded-lg focus:outline-none focus:ring-0 font-mono font-bold" autoFocus value={editingSalaryValue} onChange={e=>setEditingSalaryValue(e.target.value)} />
                                                <button onClick={saveSalary} className="text-success-600 hover:text-success-700" title="Guardar sueldo"><CheckCircle size={20}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 items-center font-semibold text-ink-800 group">
                                                ${salary.toLocaleString()}
                                                <button onClick={() => startEditingSalary(staff)} className="text-ink-400 hover:text-ink-700 transition-colors" title="Editar sueldo"><Edit size={14}/></button>
                                            </div>
                                        )}
                                    </div>

                                    {monthAdvances.length > 0 && (
                                         <div className="bg-danger-50/50 p-3 rounded-xl border border-danger-100 mt-2">
                                              <div className="text-[10px] font-bold text-danger-700 mb-2 border-b border-danger-100/50 pb-1 uppercase tracking-wider">Adelantos entregados</div>
                                              <div className="space-y-1.5">
                                                  {monthAdvances.map(a => (
                                                      <div key={a.id} className="flex justify-between text-xs text-ink-600 font-medium">
                                                          <span className="truncate max-w-[150px]">• {a.reason || 'Adelanto'}</span>
                                                          <span className="text-danger-600 font-semibold font-mono flex-shrink-0">-${a.amount.toLocaleString()}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                         </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center font-bold text-sm pt-4 mt-6 border-t border-ink-150">
                                <span className="text-ink-700">A pagar a fin de mes:</span>
                                <span className={`text-base font-bold font-mono ${remaining > 0 ? 'text-success-600' : remaining < 0 ? 'text-danger-600' : 'text-ink-500'}`}>
                                    ${remaining.toLocaleString()}
                                </span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Modal Adelantos */}
            {showAdvanceModal && (
                <Modal
                    isOpen={!!showAdvanceModal}
                    onClose={() => setShowAdvanceModal(null)}
                    title="Registrar Adelanto"
                    size="sm"
                    footer={
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowAdvanceModal(null)} className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors">Cancelar</button>
                            <button type="submit" form="add-advance-form" className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg">Registrar</button>
                        </div>
                    }
                >
                    <form id="add-advance-form" onSubmit={submitAdvance} className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Monto en Efectivo/Transferencia ($)</label>
                            <input 
                                type="number" 
                                className="input-field text-lg font-bold font-mono bg-white border-ink-200 text-ink-700 focus:border-primary-500" 
                                placeholder="15000" 
                                value={advanceAmount} 
                                onChange={e=>setAdvanceAmount(e.target.value)} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Motivo / Detalle</label>
                            <input 
                                type="text" 
                                className="input-field bg-white border-ink-200 text-ink-700 focus:border-primary-500" 
                                placeholder="Ej: Quincena, compra de materiales..." 
                                value={advanceReason} 
                                onChange={e=>setAdvanceReason(e.target.value)} 
                                required 
                            />
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
