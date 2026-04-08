import { useState, useMemo } from 'react';
import { FlattenedLogEntry } from '@/lib/csvParser';
import LogDetailPanel from './LogDetailPanel';
import { Search, ChevronUp, ChevronDown, Plane, ArrowRight } from 'lucide-react';

interface LogTableProps {
  entries: FlattenedLogEntry[];
}

type SortDir = 'asc' | 'desc';

const LogTable = ({ entries }: LogTableProps) => {
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<keyof FlattenedLogEntry | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<FlattenedLogEntry | null>(null);
  const perPage = 30;

  const filtered = useMemo(() => {
    if (!filter) return entries;
    const lower = filter.toLowerCase();
    return entries.filter(e =>
      e.provider_code.toLowerCase().includes(lower) ||
      e.route.toLowerCase().includes(lower) ||
      e.departure_city.toLowerCase().includes(lower) ||
      e.arrival_city.toLowerCase().includes(lower) ||
      e.cabin.toLowerCase().includes(lower) ||
      e.trip_type.toLowerCase().includes(lower) ||
      e.device_type.toLowerCase().includes(lower) ||
      e.search_id.toLowerCase().includes(lower)
    );
  }, [entries, filter]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] as string ?? '';
      const bv = b[sortCol] as string ?? '';
      const numA = parseFloat(av);
      const numB = parseFloat(bv);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  const toggleSort = (col: keyof FlattenedLogEntry) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: keyof FlattenedLogEntry }) => {
    if (sortCol !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const columns: { key: keyof FlattenedLogEntry; label: string; group: 'route' | 'search' | 'provider' }[] = [
    { key: 'departure_city', label: 'From', group: 'route' },
    { key: 'arrival_city', label: 'To', group: 'route' },
    { key: 'outbound_date', label: 'Depart', group: 'route' },
    { key: 'return_date', label: 'Return', group: 'route' },
    { key: 'trip_type', label: 'Trip', group: 'route' },
    { key: 'cabin', label: 'Cabin', group: 'search' },
    { key: 'adults_count', label: 'Adults', group: 'search' },
    { key: 'children_count', label: 'Children', group: 'search' },
    { key: 'infants_count', label: 'Infants', group: 'search' },
    { key: 'device_type', label: 'Device', group: 'search' },
    { key: 'app_type', label: 'App', group: 'search' },
    { key: 'currency_code', label: 'Currency', group: 'search' },
    { key: 'site_code', label: 'Site', group: 'search' },
    { key: 'locale', label: 'Locale', group: 'search' },
    { key: 'provider_code', label: 'Provider', group: 'provider' },
    { key: 'processing_time', label: 'Time (s)', group: 'provider' },
    { key: 'trips_count', label: 'Trips', group: 'provider' },
    { key: 'requests_count', label: 'Requests', group: 'provider' },
    { key: 'valid', label: 'Valid', group: 'provider' },
    { key: 'is_cached', label: 'Cached', group: 'provider' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by provider, route, device..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(0); }}
          className="w-full pl-10 pr-20 py-2.5 bg-card border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
          {sorted.length} rows
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {/* Group headers */}
              <tr className="bg-muted/70 border-b border-border">
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary w-8">#</th>
                <th colSpan={5} className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <span className="flex items-center gap-1"><Plane className="w-3 h-3" /> Route & Dates</span>
                </th>
                <th colSpan={9} className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-l border-border">
                  Search Context
                </th>
                <th colSpan={6} className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-l border-border">
                  Provider Response
                </th>
              </tr>
              {/* Column headers */}
              <tr className="bg-muted/40">
                <th className="px-2 py-2 w-8"></th>
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    className={`px-2 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap ${
                      (i === 5 || i === 14) ? 'border-l border-border' : ''
                    }`}
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-0.5">
                      {col.label}
                      <SortIcon col={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((entry, i) => (
                <tr
                  key={i}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <td className="px-2 py-2 text-xs text-muted-foreground font-mono">
                    {page * perPage + i + 1}
                  </td>
                  {/* Route & Dates — prominent */}
                  <td className="px-2 py-2 font-mono text-xs font-semibold text-foreground">{entry.departure_city || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-primary" />
                      {entry.arrival_city || '—'}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">{entry.outbound_date || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">{entry.return_date || '—'}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      entry.trip_type === 'ROUNDTRIP'
                        ? 'bg-badge-info text-badge-info-foreground'
                        : 'bg-badge-neutral text-badge-neutral-foreground'
                    }`}>
                      {entry.trip_type || '—'}
                    </span>
                  </td>
                  {/* Search Context */}
                  <td className="px-2 py-2 font-mono text-xs text-foreground border-l border-border">{entry.cabin || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs text-center text-foreground">{entry.adults_count}</td>
                  <td className="px-2 py-2 font-mono text-xs text-center text-foreground">{entry.children_count}</td>
                  <td className="px-2 py-2 font-mono text-xs text-center text-foreground">{entry.infants_count}</td>
                  <td className="px-2 py-2 text-xs text-foreground">{entry.device_type || '—'}</td>
                  <td className="px-2 py-2 text-xs text-foreground">{entry.app_type || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">{entry.currency_code || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">{entry.site_code || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">{entry.locale || '—'}</td>
                  {/* Provider Response */}
                  <td className="px-2 py-2 border-l border-border">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-badge-info text-badge-info-foreground">
                      {entry.provider_code}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-center text-foreground">{entry.processing_time}</td>
                  <td className="px-2 py-2 font-mono text-xs text-center text-foreground">{entry.trips_count}</td>
                  <td className="px-2 py-2 font-mono text-xs text-center text-foreground">{entry.requests_count}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex w-5 h-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      entry.valid !== '0'
                        ? 'bg-badge-success text-badge-success-foreground'
                        : 'bg-badge-neutral text-badge-neutral-foreground'
                    }`}>
                      {entry.valid}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      entry.is_cached === 'true'
                        ? 'bg-badge-success text-badge-success-foreground'
                        : 'bg-badge-neutral text-badge-neutral-foreground'
                    }`}>
                      {entry.is_cached}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground font-mono">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail panel */}
      {selectedEntry && (
        <LogDetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
};

export default LogTable;
