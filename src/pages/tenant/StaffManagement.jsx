import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Calendar, Users, Clock, Plus, Trash, Wallet, MapPin, Edit, CheckCircle, Search } from 'lucide-react';

export default function StaffManagement() {
    const { 
        shifts, tenantUsers, addShift, deleteShift, 
        spaces, assignSpaceToStaff,
        payrollAdvances, updateUserSalary, addAdvance 
    } = useData();

    const staffMembers = tenantUsers.filter(u => u.role === 'staff');
    const [activeTab, setActiveTab] = useState('turnos');

    return (
        <div className="space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 font-display">Capital Humano</h2>
                    <p className="text-slate-400">Gestión de RRHH y Operaciones</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
                <div className="bg-slate-800 px-6 py-4 rounded-xl border border-slate-700 flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{staffMembers.length}</div>
                        <div className="text-sm text-slate-400">Staff Activo</div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 border-b border-slate-700 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('turnos')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${activeTab === 'turnos' ? 'text-gold-500 border-b-2 border-gold-500 bg-gold-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Calendar size={18}/> Cronograma
                </button>
                <button
                    onClick={() => setActiveTab('boxes')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${activeTab === 'boxes' ? 'text-gold-500 border-b-2 border-gold-500 bg-gold-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <MapPin size={18}/> Asignación de Sectores
                </button>
                <button
                    onClick={() => setActiveTab('nomina')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${activeTab === 'nomina' ? 'text-gold-500 border-b-2 border-gold-500 bg-gold-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Wallet size={18}/> Nómina y Adelantos
                </button>
            </div>

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
            <div className="flex justify-between items-center glass-card p-4">
                <span className="text-slate-300 font-medium">Asigna y revisa la cobertura semanal del personal.</span>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Turno Manual
                </button>
            </div>

            <div className="glass-card border border-slate-700 overflow-hidden shadow-lg">
                <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-900/50">
                    {weekDays.map(d => (
                        <div key={d} className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 divide-x divide-slate-700">
                    {weekDays.map(d => {
                        const dayShifts = shifts.filter(s => s.day === d);
                        return (
                            <div key={d} className="min-h-[200px] p-2 space-y-2 bg-slate-800 hover:bg-slate-800/80 transition-colors">
                                {dayShifts.map(s => {
                                    const staff = staffMembers.find(st => st.uid === s.staffId);
                                    return (
                                        <div key={s.id} className="bg-slate-900/50 p-2 rounded-lg text-xs border-l-2 border-blue-500 group relative">
                                            <div className="font-bold text-white">{staff?.displayName || 'Desconocido'}</div>
                                            <div className="text-slate-400 flex items-center gap-1 mt-1">
                                                <Clock size={10} /> {s.start} - {s.end}
                                            </div>
                                            <button onClick={() => deleteShift(s.id)} className="absolute top-1 right-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Turnos */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl scale-in-center">
                        <div className="p-6 border-b border-slate-700"><h3 className="text-xl font-bold text-white">Nuevo Turno</h3></div>
                        <form onSubmit={handleAddShift} className="p-6 space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Empleado</label>
                                <select className="input-field" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} required>
                                    <option value="">Seleccionar...</option>
                                    {staffMembers.map(s => <option key={s.uid} value={s.uid}>{s.displayName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Día de la Semana</label>
                                <select className="input-field" value={day} onChange={e => setDay(e.target.value)}>
                                    {weekDays.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Hora Inicio</label>
                                    <input type="time" className="input-field" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Hora Fin</label>
                                    <input type="time" className="input-field" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
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

    const boxes = spaces.filter(s => s.type === 'box' && s.name.toLowerCase().includes(filter.toLowerCase()));

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
             <div className="glass-card p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                     <h3 className="text-white font-bold mb-1">Mapeo Rápido de Sectores</h3>
                     <p className="text-slate-400 text-sm">Selecciona uno o más boxes para asignarlos al petisero responsable de ese pasillo/sector.</p>
                 </div>
                 <div className="relative w-full md:w-64">
                     <Search size={16} className="absolute left-3 top-3 text-slate-500"/>
                     <input type="text" placeholder="Buscar box..." className="input-field pl-10" value={filter} onChange={e=>setFilter(e.target.value)} />
                 </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                 {boxes.map(s => {
                     const isSelected = selectedSpaces.includes(s.id);
                     const assigneeName = staffMembers.find(st => st.uid === s.staffId)?.displayName;

                     return (
                         <div 
                             key={s.id} onClick={() => toggleSpace(s.id)} 
                             className={`relative p-4 rounded-xl border cursor-pointer transition-all select-none hover:-translate-y-1 ${isSelected ? 'border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/10' : 'border-slate-700 bg-slate-800'}`}
                         >
                              {assigneeName && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"></div>}
                              <div className={`font-bold ${isSelected ? 'text-gold-500' : 'text-slate-200'}`}>{s.name}</div>
                              <div className="text-xs text-slate-500 mt-2">A cargo de:</div>
                              <div className={`text-sm font-medium ${assigneeName ? 'text-blue-400' : 'text-slate-400 italic'}`}>{assigneeName || 'Sin asignar'}</div>
                         </div>
                     );
                 })}
             </div>

             {/* Action Bar Floating Bottom */}
             {selectedSpaces.length > 0 && (
                 <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-gold-500/50 p-3 pr-4 rounded-full flex flex-col md:flex-row items-center gap-4 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom">
                     <span className="text-gold-500 font-bold px-4 whitespace-nowrap">{selectedSpaces.length} Boxes seleccionados</span>
                     <div className="w-px h-6 bg-slate-700 hidden md:block"></div>
                     <select className="bg-slate-800 border-none text-white focus:outline-none focus:ring-0 rounded-lg py-2 px-3" value={targetStaff} onChange={e=>setTargetStaff(e.target.value)}>
                         <option value="">-- Elige un petisero --</option>
                         <option value="none">Quitar asignación</option>
                         {staffMembers.map(st => <option key={st.uid} value={st.uid}>{st.displayName}</option>)}
                     </select>
                     <button onClick={handleAssign} disabled={!targetStaff} className="btn-primary py-2 px-6 rounded-full disabled:opacity-50 whitespace-nowrap">
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
             <div className="glass-card p-4">
                 <p className="text-slate-300">Visualizando periodo: <span className="font-bold text-white capitalize">{monthName}</span></p>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {staffMembers.map(staff => {
                    const monthAdvances = payrollAdvances.filter(a => a.staffId === staff.uid && new Date(a.date).getMonth() === currentMonth);
                    const totalAdvances = monthAdvances.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
                    const salary = Number(staff.salary || 0);
                    const remaining = salary - totalAdvances;

                    return (
                        <div key={staff.uid} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col justify-between shadow-lg">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                            <Users size={20}/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{staff.displayName}</div>
                                            <div className="text-xs text-slate-400">Personal de Campo</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAdvanceModal(staff.uid)} className="text-xs bg-gold-500/10 text-gold-500 border border-gold-500/20 px-3 py-1.5 rounded-full font-bold hover:bg-gold-500 hover:text-slate-900 transition-colors">
                                        Entregar Efectivo
                                    </button>
                                </div>

                                <div className="space-y-3 border-t border-slate-700/50 pt-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Sueldo Base:</span>
                                        {editingSalaryFor === staff.uid ? (
                                            <div className="flex gap-2">
                                                <input type="number" className="bg-slate-900 border border-gold-500 text-white w-28 px-2 py-1 rounded" autoFocus value={editingSalaryValue} onChange={e=>setEditingSalaryValue(e.target.value)} />
                                                <button onClick={saveSalary} className="text-green-500 hover:text-green-400"><CheckCircle size={20}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 items-center font-medium text-slate-200 group">
                                                ${salary.toLocaleString()}
                                                <button onClick={() => startEditingSalary(staff)} className="text-slate-600 group-hover:text-slate-300 transition-colors"><Edit size={14}/></button>
                                            </div>
                                        )}
                                    </div>

                                    {monthAdvances.length > 0 && (
                                         <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10 mt-2">
                                              <div className="text-xs font-bold text-red-400 mb-2 border-b border-red-500/10 pb-1">Movimientos del mes</div>
                                              <div className="space-y-1">
                                                  {monthAdvances.map(a => (
                                                      <div key={a.id} className="flex justify-between text-xs text-slate-400">
                                                          <span>• {a.reason || 'Adelanto'} ({new Date(a.date).toLocaleDateString()})</span>
                                                          <span className="text-red-400 font-medium">-${a.amount.toLocaleString()}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                         </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-end font-bold text-lg pt-4 mt-4 border-t border-slate-700">
                                <span className="text-white text-sm">Saldo a Pagar a fin de mes:</span>
                                <span className={remaining > 0 ? 'text-green-400 text-xl' : remaining < 0 ? 'text-red-500 text-xl' : 'text-slate-400 text-xl'}>
                                    ${remaining.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Adelantos */}
            {showAdvanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl scale-in-center">
                        <div className="p-6 border-b border-slate-700"><h3 className="text-xl font-bold text-white">Registrar Adelanto</h3></div>
                        <form onSubmit={submitAdvance} className="p-6 space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Monto en Efectivo/Transferencia ($)</label>
                                <input type="number" className="input-field text-xl font-bold font-mono" placeholder="15000" value={advanceAmount} onChange={e=>setAdvanceAmount(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Motivo/Detalle</label>
                                <input type="text" className="input-field" placeholder="Quincena, compra de materiales..." value={advanceReason} onChange={e=>setAdvanceReason(e.target.value)} required />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAdvanceModal(null)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary bg-gold-500 text-slate-900">Registrar Entrega</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
