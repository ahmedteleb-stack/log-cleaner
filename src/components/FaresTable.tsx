import { useState, useMemo } from 'react';
import { FlattenedFareEntry } from '@/lib/faresParser';
import FaresDetailPanel from './FaresDetailPanel';
import { Search, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';

interface FaresTableProps {
  entries: FlattenedFareEntry[];
}

type SortDir = 'asc' | 'desc';

const FaresTable = ({ entries }: FaresTableProps) => {
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<keyof FlattenedFareEntry | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<FlattenedFareEntry | null>(null);
  const perPage = 30;

  const filtered = useMemo(() => {
    if (!filter) return entries;
    const lower = filter.toLowerCase();
    return entries.filter(e =>
      e.method.toLowerCase().includes(lower) ||
      e.endpointType.toLowerCase().includes(lower) ||
      e.statuscode.toLowerCase().includes(lower) ||
      e.paymentorderid.toLowerCase().includes(lower) ||
      e.errorMessage.toLowerCase().includes(lower) ||
      e.route.toLowerCase().includes(lower) ||
      e.country.toLowerCase().includes(lower)
    );
  }, [entries, filter]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortCol] ?? '');
      const bv = String(b[sortCol] ?? '');
      const numA = parseFloat(av);
      const numB = parseFloat(bv);
      if (!isNaN(numA) && !isNaN(numB)) return sortDir === 'asc' ? numA - numB : numB - numA;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  const toggleSort = (col: keyof FlattenedFareEntry) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: keyof FlattenedFareEntry }) => {
    if (sortCol !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const columns: { key: keyof FlattenedFareEntry; label: string; group: 'request' | 'context' | 'response' }[] = [
    { key: 'method', label: 'Method', group: 'request' },
    { key: 'endpointType', label: 'Endpoint', group: 'request' },
    { key: 'paymentorderid', label: 'Order ID', group: 'request' },
    { key: 'timestamp', label: 'Time', group: 'request' },
    { key: 'country', label: 'Country', group: 'context' },
    { key: 'city', label: 'City', group: 'context' },
    { key: 'deviceInfo', label: 'Device', group: 'context' },
    { key: 'authStatus', label: 'Auth', group: 'context' },
    { key: 'statuscode', label: 'Status', group: 'response' },
    { key: 'route', label: 'Route', group: 'response' },
    { key: 'totalPrice', label: 'Price', group: 'response' },
    { key: 'priceChanged', label: 'Price Δ', group: 'response' },
    { key: 'hasError', label: 'Error', group: 'response' },
  ];

  const formatTime = (ts: string) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch { return ts; }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by method, endpoint, order ID, error..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(0); }}
          className="w-full pl-10 pr-20 py-2.5 bg-card border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
          {sorted.length} rows
        </span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70 border-b border-border">
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary w-8">#</th>
                <th colSpan={4} className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Request
                </th>
                <th colSpan={4} className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-l border-border">
                  Context
                </th>
                <th colSpan={5} className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-l border-border">
                  Response
                </th>
              </tr>
              <tr className="bg-muted/40">
                <th className="px-2 py-2 w-8"></th>
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    className={`px-2 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap ${
                      (i === 4 || i === 8) ? 'border-l border-border' : ''
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
                  className={`hover:bg-muted/30 transition-colors cursor-pointer ${entry.hasError ? 'bg-destructive/5' : ''}`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <td className="px-2 py-2 text-xs text-muted-foreground font-mono">{page * perPage + i + 1}</td>
                  {/* Request */}
                  <td className="px-2 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      entry.method === 'GET' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-warning text-badge-warning-foreground'
                    }`}>
                      {entry.method}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs font-medium text-foreground">{entry.endpointType}</td>
                  <td className="px-2 py-2 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">{entry.paymentorderid || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">{formatTime(entry.timestamp)}</td>
                  {/* Context */}
                  <td className="px-2 py-2 font-mono text-xs text-foreground border-l border-border">{entry.country || '—'}</td>
                  <td className="px-2 py-2 text-xs text-foreground">{entry.city || '—'}</td>
                  <td className="px-2 py-2 text-xs text-foreground">{entry.deviceInfo}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      entry.authStatus === '200' ? 'bg-badge-success text-badge-success-foreground' : 'bg-badge-neutral text-badge-neutral-foreground'
                    }`}>
                      {entry.authStatus || '—'}
                    </span>
                  </td>
                  {/* Response */}
                  <td className="px-2 py-2 border-l border-border">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      entry.statuscode === '200' ? 'bg-badge-success text-badge-success-foreground' :
                      entry.statuscode.startsWith('4') ? 'bg-badge-warning text-badge-warning-foreground' :
                      'bg-badge-neutral text-badge-neutral-foreground'
                    }`}>
                      {entry.statuscode}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs font-semibold text-foreground">{entry.route || '—'}</td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">
                    {entry.totalPrice ? `${entry.totalPrice} ${entry.currencyCode}` : '—'}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {entry.priceChanged === 'true' && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-badge-warning text-badge-warning-foreground">YES</span>
                    )}
                    {entry.priceChanged === 'false' && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-badge-success text-badge-success-foreground">NO</span>
                    )}
                    {!entry.priceChanged && '—'}
                  </td>
                  <td className="px-2 py-2">
                    {entry.hasError ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[10px] font-medium max-w-[100px] truncate">{entry.errorMessage}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {selectedEntry && (
        <FaresDetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
};

export default FaresTable;
