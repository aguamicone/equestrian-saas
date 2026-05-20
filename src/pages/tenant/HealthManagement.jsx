import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PageHeader, Badge, DataTable } from '../../components/ui';
import HealthRecordModal from '../../components/health/modals/HealthRecordModal';
import { Stethoscope, AlertTriangle, Clock, Calendar, FileX, Syringe, Pill, Activity, CalendarCheck } from 'lucide-react';

export default function HealthManagement() {
  const { horses, healthRecords, healthBooklets, getHealthStatusByHorse, getHealthBookletByHorse } = useData();
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, expired, upcoming, ok, no_booklet

  // --- Calculations ---
  const activeHorses = useMemo(() => horses.filter(h => !h.archived), [horses]);

  const horsesWithHealth = useMemo(() => {
    return activeHorses.map(horse => {
      const status = getHealthStatusByHorse(horse.id);
      const booklet = getHealthBookletByHorse(horse.id);
      
      let bookletStatus = 'no_booklet';
      if (booklet && booklet.expiresAt) {
        const expiresAtDate = new Date(booklet.expiresAt);
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        if (expiresAtDate < now) bookletStatus = 'expired';
        else if (expiresAtDate <= thirtyDaysFromNow) bookletStatus = 'upcoming';
        else bookletStatus = 'ok';
      }

      // get the most recent and next due date
      const records = healthRecords.filter(r => r.horseId === horse.id);
      records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const lastVisit = records.length > 0 ? records[0].date : null;
      
      let nextDue = null;
      const upcomingRecords = records.filter(r => r.nextDueDate).sort((a,b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
      if (upcomingRecords.length > 0) {
        nextDue = upcomingRecords[0].nextDueDate;
      }

      return {
        ...horse,
        healthStatus: status,
        bookletStatus,
        lastVisit,
        nextDue
      };
    });
  }, [activeHorses, healthRecords, healthBooklets, getHealthStatusByHorse, getHealthBookletByHorse]);

  // --- KPIs ---
  const kpis = useMemo(() => {
    let expiredCount = 0;
    let upcomingCount = 0;
    let noBookletCount = 0;
    
    horsesWithHealth.forEach(h => {
      if (h.healthStatus === 'vencido') expiredCount++;
      if (h.healthStatus === 'proximo') upcomingCount++;
      if (h.bookletStatus === 'no_booklet') noBookletCount++;
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const eventsThisMonth = healthRecords.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    return { expiredCount, upcomingCount, noBookletCount, eventsThisMonth };
  }, [horsesWithHealth, healthRecords]);

  // --- Filtering ---
  const filteredHorses = useMemo(() => {
    return horsesWithHealth.filter(horse => {
      // 1. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!horse.name?.toLowerCase().includes(q) && !horse.breed?.toLowerCase().includes(q)) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'expired' && horse.healthStatus !== 'vencido') return false;
      if (statusFilter === 'upcoming' && horse.healthStatus !== 'proximo') return false;
      if (statusFilter === 'ok' && horse.healthStatus !== 'al_dia') return false;
      if (statusFilter === 'no_booklet' && horse.bookletStatus !== 'no_booklet') return false;

      return true;
    });
  }, [horsesWithHealth, searchQuery, statusFilter]);

  // --- Columns for DataTable ---
  const columns = [
    {
      key: 'horse',
      label: 'Caballo',
      render: (horse) => (
        <div>
          <div className="font-medium text-ink-900">{horse.name}</div>
          <div className="text-xs text-ink-500">{horse.breed || 'Raza N/A'}</div>
        </div>
      )
    },
    {
      key: 'lastVisit',
      label: 'Última visita',
      render: (horse) => (
        <span className="text-ink-600 font-medium">
          {horse.lastVisit ? new Date(horse.lastVisit).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      key: 'nextDue',
      label: 'Próximo vencimiento',
      render: (horse) => (
        <span className="text-ink-600 font-medium">
          {horse.nextDue ? new Date(horse.nextDue).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      key: 'healthStatus',
      label: 'Estado general',
      render: (horse) => {
        if (horse.healthStatus === 'vencido') return <Badge variant="danger">Vencido</Badge>;
        if (horse.healthStatus === 'proximo') return <Badge variant="warning">Próximo</Badge>;
        if (horse.healthStatus === 'al_dia') return <Badge variant="success">Al día</Badge>;
        return <Badge variant="neutral">Sin registros</Badge>;
      }
    },
    {
      key: 'bookletStatus',
      label: 'Libreta',
      render: (horse) => {
        if (horse.bookletStatus === 'ok') return <Badge variant="success">Vigente</Badge>;
        if (horse.bookletStatus === 'expired') return <Badge variant="danger">Vencida</Badge>;
        if (horse.bookletStatus === 'upcoming') return <Badge variant="warning">Próxima</Badge>;
        return <Badge variant="neutral">Sin libreta</Badge>;
      }
    }
  ];

  const rowActions = [
    {
      label: 'Ver historia clínica',
      onClick: (horse) => setSelectedHorse(horse)
    },
    {
      label: 'Registrar evento',
      onClick: (horse) => {
        setSelectedHorse(horse);
        // Note: the modal could handle "open create" via internal state or a separate open sub-modal.
        // We'll open the detail modal and let the user click "Registrar evento" there for now.
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sanidad"
        subtitle="Control sanitario y seguimiento de los caballos"
        icon={Stethoscope}
        color="sky"
      />

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-ink-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-danger-50 text-danger-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div className="text-sm font-medium text-ink-600">Con vencimientos</div>
          </div>
          <div className="text-2xl font-display font-medium text-ink-900">{kpis.expiredCount}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-ink-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning-50 text-warning-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div className="text-sm font-medium text-ink-600">Próximos a vencer</div>
          </div>
          <div className="text-2xl font-display font-medium text-ink-900">{kpis.upcomingCount}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-ink-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-info-50 text-info-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <div className="text-sm font-medium text-ink-600">Eventos este mes</div>
          </div>
          <div className="text-2xl font-display font-medium text-ink-900">{kpis.eventsThisMonth}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-ink-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <FileX size={20} />
            </div>
            <div className="text-sm font-medium text-ink-600">Sin libreta sanitaria</div>
          </div>
          <div className="text-2xl font-display font-medium text-ink-900">{kpis.noBookletCount}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Top Controls */}
        <div className="p-4 border-b border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-ink-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <FilterChip label="Todos" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
            <FilterChip label="Con vencimientos" active={statusFilter === 'expired'} onClick={() => setStatusFilter('expired')} />
            <FilterChip label="Próximos a vencer" active={statusFilter === 'upcoming'} onClick={() => setStatusFilter('upcoming')} />
            <FilterChip label="Al día" active={statusFilter === 'ok'} onClick={() => setStatusFilter('ok')} />
            <FilterChip label="Sin libreta" active={statusFilter === 'no_booklet'} onClick={() => setStatusFilter('no_booklet')} />
          </div>
          
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Syringe className="h-4 w-4 text-ink-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar caballo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* DataTable */}
        <div className="flex-1 overflow-auto">
          <DataTable 
            columns={columns} 
            data={filteredHorses} 
            rowActions={rowActions}
            onRowClick={(horse) => setSelectedHorse(horse)}
            emptyState={{
              title: 'No hay caballos',
              description: 'No se encontraron caballos con los filtros actuales.',
              icon: Stethoscope
            }}
          />
        </div>
      </div>

      {/* Modals */}
      {selectedHorse && (
        <HealthRecordModal 
          horse={selectedHorse} 
          onClose={() => setSelectedHorse(null)} 
        />
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active 
          ? 'bg-ink-900 text-white' 
          : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50 hover:text-ink-900'
      }`}
    >
      {label}
    </button>
  );
}
