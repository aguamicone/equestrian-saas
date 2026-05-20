import { useState } from 'react';
import { X, Plus, Activity, Syringe, Pill, Stethoscope, Scissors, CalendarCheck, FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Modal, Tabs, Badge } from '../../ui';
import { useData } from '../../../context/DataContext';
import CreateHealthRecordModal from './CreateHealthRecordModal';
import EditHealthBookletModal from './EditHealthBookletModal';

const getTypeIcon = (type) => {
  switch(type) {
    case 'vacuna': return <Syringe className="w-5 h-5 text-emerald-500" />;
    case 'desparasitacion': return <Pill className="w-5 h-5 text-rose-500" />;
    case 'control_veterinario': return <Stethoscope className="w-5 h-5 text-sky-500" />;
    case 'herrado': return <Scissors className="w-5 h-5 text-amber-500" />;
    case 'dental': return <Activity className="w-5 h-5 text-purple-500" />;
    default: return <FileText className="w-5 h-5 text-ink-500" />;
  }
};

const getStatusBadge = (record) => {
  if (!record.nextDueDate) return null; // No expira
  
  const dueDate = new Date(record.nextDueDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  if (dueDate < now) return <Badge variant="danger">Vencido</Badge>;
  if (dueDate <= thirtyDaysFromNow) return <Badge variant="warning">Próximo</Badge>;
  return <Badge variant="success">Al día</Badge>;
};

export default function HealthRecordModal({ horse, onClose }) {
  const { tenantUsers, getHealthRecordsByHorse, getHealthBookletByHorse } = useData();
  const [activeTab, setActiveTab] = useState('historia');
  
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [showEditBooklet, setShowEditBooklet] = useState(false);

  const owner = tenantUsers?.find(u => (u.uid || u.id) === horse.ownerId);
  const records = getHealthRecordsByHorse(horse.id);
  const booklet = getHealthBookletByHorse(horse.id);

  const tabs = [
    { key: 'historia', label: 'Historia clínica' },
    { key: 'libreta', label: 'Libreta sanitaria' },
    { key: 'info', label: 'Info del caballo' }
  ];

  return (
    <>
      <Modal isOpen={true} onClose={onClose} size="lg" hideDefaultHeader>
        {/* Header (Pattern from HorseDetailModal) */}
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-gradient-to-br from-rose-50 to-white">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-display text-xl font-medium flex-shrink-0">
              {horse.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg font-medium text-ink-900 truncate">
                {horse.name}
              </div>
              <div className="text-xs text-ink-500 truncate">
                {horse.breed || 'Raza no especificada'} · {owner?.displayName || 'Sin dueño'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/80 text-ink-500 hover:text-ink-800 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-ink-100">
          <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {activeTab === 'historia' && (
            <HistoriaTab 
              records={records} 
              onAdd={() => setShowCreateRecord(true)} 
            />
          )}
          {activeTab === 'libreta' && (
            <LibretaTab 
              booklet={booklet} 
              onEdit={() => setShowEditBooklet(true)} 
            />
          )}
          {activeTab === 'info' && (
            <InfoTab horse={horse} owner={owner} />
          )}
        </div>
      </Modal>

      {/* Sub-modals */}
      {showCreateRecord && (
        <CreateHealthRecordModal 
          horse={horse} 
          onClose={() => setShowCreateRecord(false)} 
        />
      )}

      {showEditBooklet && (
        <EditHealthBookletModal 
          horse={horse} 
          booklet={booklet} 
          onClose={() => setShowEditBooklet(false)} 
        />
      )}
    </>
  );
}

// --- Tabs Components ---

function HistoriaTab({ records, onAdd }) {
  return (
    <div className="px-6 py-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-ink-900">Historial sanitario</h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Registrar evento
        </button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50">
          <Activity className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-900">Sin registros</p>
          <p className="text-xs text-ink-500 mt-1">No hay eventos sanitarios cargados para este caballo.</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ink-200 before:to-transparent">
          {records.map((record) => (
            <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Icon / Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-ink-200 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {getTypeIcon(record.type)}
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-ink-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1 flex items-center gap-2">
                      {record.type.replace('_', ' ')}
                    </div>
                    <div className="font-medium text-ink-900 text-sm">
                      {record.subtype || 'Evento general'}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-ink-500 mb-1">{new Date(record.date).toLocaleDateString()}</div>
                    {getStatusBadge(record)}
                  </div>
                </div>

                {record.notes && (
                  <p className="text-sm text-ink-600 mt-2 bg-ink-50 p-2 rounded-lg italic">
                    "{record.notes}"
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
                  {record.veterinarianName && (
                    <div className="flex items-center gap-1">
                      <Stethoscope size={14} />
                      {record.veterinarianName}
                    </div>
                  )}
                  {record.nextDueDate && (
                    <div className="flex items-center gap-1">
                      <CalendarCheck size={14} />
                      Vence: {new Date(record.nextDueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LibretaTab({ booklet, onEdit }) {
  if (!booklet) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-ink-50 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-ink-300" />
        </div>
        <h3 className="font-display text-lg font-medium text-ink-900 mb-2">
          Sin libreta sanitaria
        </h3>
        <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">
          Este caballo no tiene una libreta sanitaria digital registrada en el sistema.
        </p>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Crear libreta sanitaria
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-ink-900">Libreta sanitaria digital</h3>
        <button
          onClick={onEdit}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Editar datos
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="font-display font-medium text-ink-900">Documento Oficial</div>
            <div className="text-sm text-ink-500">
              Reg: <span className="font-mono text-ink-900 bg-ink-50 px-1 rounded">{booklet.registryNumber || 'Sin número'}</span>
            </div>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Emisión</div>
            <div className="font-medium text-ink-900">
              {booklet.issuedDate ? new Date(booklet.issuedDate).toLocaleDateString() : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Vencimiento</div>
            <div className="font-medium text-ink-900">
              {booklet.expiresAt ? new Date(booklet.expiresAt).toLocaleDateString() : '-'}
            </div>
          </div>
        </div>
        {booklet.notes && (
          <div className="px-5 py-4 border-t border-ink-100 bg-ink-50/50">
            <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Notas</div>
            <p className="text-sm text-ink-700">{booklet.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoTab({ horse, owner }) {
  return (
    <div className="px-6 py-5">
      <h3 className="font-medium text-ink-900 mb-4">Información general</h3>
      <div className="bg-ink-50/50 rounded-xl border border-ink-200 p-5 grid grid-cols-2 gap-y-4">
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Dueño</div>
          <div className="font-medium text-ink-900">{owner?.displayName || 'Sin dueño'}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Raza</div>
          <div className="font-medium text-ink-900">{horse.breed || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Edad</div>
          <div className="font-medium text-ink-900">{horse.age ? `${horse.age} años` : '-'}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Pelaje</div>
          <div className="font-medium text-ink-900">{horse.color || '-'}</div>
        </div>
      </div>
    </div>
  );
}
