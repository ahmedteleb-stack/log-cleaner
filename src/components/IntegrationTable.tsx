import { useState, useMemo, Fragment } from 'react';
import { FlattenedIntegrationEntry } from '@/lib/integrationParser';
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import IntegrationRowDetail from './IntegrationRowDetail';

interface IntegrationTableProps {
  entries: FlattenedIntegrationEntry[];
}

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  INTEGRATION_DYNAMIC_FORMS: { icon: '📋', label: 'Dynamic Forms' },
  INTEGRATION_REVALIDATION: { icon: '🎫', label: 'Revalidation' },
  INTEGRATION_BOOKING: { icon: '✅', label: 'Booking' },
  VAS_INSURANCE_CONFIRM: { icon: '🛡️', label: 'Insurance Confirm' },
  VAS_INSURANCE: { icon: '🛡️', label: 'Insurance' },
  INTEGRATION_TICKETING: { icon: '🎟️', label: 'Ticketing' },
  INTEGRATION_VOID: { icon: '❌', label: 'Void' },
  INTEGRATION_CANCEL: { icon: '🚫', label: 'Cancel' },
  INTEGRATION_QUEUE_PLACE: { icon: '📥', label: 'Queue Place' },
  INTEGRATION_PNR_RETRIEVE: { icon: '🔄', label: 'PNR Retrieve' },
};

const IntegrationTable = ({ entries }: IntegrationTableProps) => {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const perPage = 50;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.type] = (counts[e.type] || 0) + 1;
    }
    return counts;
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (selectedTypes.size > 0) {
      result = result.filter(e => selectedTypes.has(e.type));
    }
    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(e =>
        e.type.toLowerCase().includes(lower) ||
        e.ipcc.toLowerCase().includes(lower) ||
        e.integrationType.toLowerCase().includes(lower) ||
        e.route.toLowerCase().includes(lower) ||
        e.msFareId.toLowerCase().includes(lower) ||
        e.wegoRef.toLowerCase().includes(lower) ||
        e.orderId.toLowerCase().includes(lower) ||
        e.errorMessage.toLowerCase().includes(lower) ||
        e.status.includes(lower)
      );
    }
    return result;
  }, [entries, filter, selectedTypes]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
    setPage(0);
  };

  const formatTime = (ts: string) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleTimeString(); } catch { return ts; }
  };

  const getTypeInfo = (type: string) => TYPE_LABELS[type] || { icon: '📄', label: type };

  const isError = (e: FlattenedIntegrationEntry) => e.hasError || parseInt(e.status) >= 400;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by type, IPCC, route, error..."
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-20 py-2.5 bg-card border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
            {filtered.length} rows
          </span>
        </div>
        <button
          onClick={() => setShowTypeFilter(!showTypeFilter)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            selectedTypes.size > 0
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:bg-muted'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter Types
          {selectedTypes.size > 0 && (
            <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">{selectedTypes.size}</span>
          )}
        </button>
        {selectedTypes.size > 0 && (
          <button
            onClick={() => { setSelectedTypes(new Set()); setPage(0); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Type filter chips */}
      {showTypeFilter && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          {Object.keys(typeCounts).sort().map(type => {
            const info = getTypeInfo(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                  selectedTypes.has(type)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                <span>{info.icon}</span>
                {info.label}
                <span className="text-[10px] opacity-60">({typeCounts[type]})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70 border-b border-border">
                <th className="px-2 py-2 w-8"></th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-primary">Step</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IPCC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((entry, pageIdx) => {
                const globalIdx = page * perPage + pageIdx;
                const expanded = expandedRows.has(globalIdx);
                const hasError = isError(entry);
                const typeInfo = getTypeInfo(entry.type);
                return (
                  <Fragment key={globalIdx}>
                    <tr
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${hasError ? 'bg-destructive/5' : ''}`}
                      onClick={() => toggleRow(globalIdx)}
                    >
                      <td className="px-2 py-2.5 text-center">
                        {expanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground inline-block" />
                          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground inline-block" />
                        }
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{globalIdx + 1}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <span className="text-base">{typeInfo.icon}</span>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-[400px]">
                        {entry.route ? (
                          <span className="text-xs text-muted-foreground truncate block">{entry.route}</span>
                        ) : entry.insurancePackages.length > 0 ? (
                          <span className="text-xs text-muted-foreground truncate block">
                            {entry.insurancePackages.map(p => p.type).join(', ')}
                          </span>
                        ) : entry.dynamicForms.length > 0 ? (
                          <span className="text-xs text-muted-foreground truncate block">
                            {entry.dynamicForms[0]?.requiredDocument || 'Forms'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          entry.status === '200' ? 'bg-badge-success text-badge-success-foreground' :
                          parseInt(entry.status) >= 400 ? 'bg-destructive/20 text-destructive' :
                          'bg-badge-neutral text-badge-neutral-foreground'
                        }`}>{entry.status}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{formatTime(entry.requestedAt || entry.timestamp)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{entry.timeInMs}ms</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-primary">{entry.ipcc || '—'}</td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <IntegrationRowDetail entry={entry} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground">
            Previous
          </button>
          <span className="text-sm text-muted-foreground font-mono">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default IntegrationTable;
