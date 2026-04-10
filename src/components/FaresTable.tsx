import { useState, useMemo } from 'react';
import { FlattenedFareEntry } from '@/lib/faresParser';
import { getAction, getAllActionKeys, extractDetails } from '@/lib/faresActionMapper';
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import FaresRowDetail from './FaresRowDetail';

interface FaresTableProps {
  entries: FlattenedFareEntry[];
}

const FaresTable = ({ entries }: FaresTableProps) => {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [showActionFilter, setShowActionFilter] = useState(false);
  const perPage = 50;

  // Enrich entries with actions
  const enriched = useMemo(() => entries.map((e, i) => ({
    entry: e,
    action: getAction(e),
    details: extractDetails(e),
    idx: i,
  })), [entries]);

  // Filter
  const filtered = useMemo(() => {
    let result = enriched;
    if (selectedActions.size > 0) {
      result = result.filter(e => selectedActions.has(e.action.key));
    }
    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(e =>
        e.action.label.toLowerCase().includes(lower) ||
        e.entry.bookingRef.toLowerCase().includes(lower) ||
        e.entry.paymentorderid.toLowerCase().includes(lower) ||
        e.entry.errorMessage.toLowerCase().includes(lower) ||
        e.entry.statuscode.includes(lower) ||
        e.entry.route.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [enriched, filter, selectedActions]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleActionFilter = (key: string) => {
    setSelectedActions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setPage(0);
  };

  const allActions = getAllActionKeys();
  // Count per action in current data
  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of enriched) {
      counts[e.action.key] = (counts[e.action.key] || 0) + 1;
    }
    return counts;
  }, [enriched]);

  const formatTime = (ts: string) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleTimeString(); } catch { return ts; }
  };

  // Auto-expand error rows
  const isError = (entry: FlattenedFareEntry) => {
    const code = parseInt(entry.statuscode);
    return entry.hasError || code >= 400;
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by action, booking ref, error..."
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-20 py-2.5 bg-card border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
            {filtered.length} rows
          </span>
        </div>
        <button
          onClick={() => setShowActionFilter(!showActionFilter)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            selectedActions.size > 0
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:bg-muted'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter Actions
          {selectedActions.size > 0 && (
            <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">{selectedActions.size}</span>
          )}
        </button>
        {selectedActions.size > 0 && (
          <button
            onClick={() => { setSelectedActions(new Set()); setPage(0); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Action filter chips */}
      {showActionFilter && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          {allActions.filter(a => actionCounts[a.key]).map(a => (
            <button
              key={a.key}
              onClick={() => toggleActionFilter(a.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                selectedActions.has(a.key)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              <span>{a.icon}</span>
              {a.label}
              <span className="text-[10px] opacity-60">({actionCounts[a.key] || 0})</span>
            </button>
          ))}
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
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(({ entry, action, details, idx }) => {
                const expanded = expandedRows.has(idx);
                const hasError = isError(entry);
                return (
                  <Fragment key={idx}>
                    <tr
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${hasError ? 'bg-destructive/5' : ''}`}
                      onClick={() => toggleRow(idx)}
                    >
                      <td className="px-2 py-2.5 text-center">
                        {expanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground inline-block" />
                          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground inline-block" />
                        }
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{page * perPage + paged.indexOf(paged.find(p => p.idx === idx)!) + 1}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <span className="text-base">{action.icon}</span>
                          {action.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-[400px]">
                        {summary.length > 0 ? (
                          <span className="text-xs text-muted-foreground truncate block">{summary[0]}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          entry.statuscode === '200' ? 'bg-badge-success text-badge-success-foreground' :
                          parseInt(entry.statuscode) >= 400 ? 'bg-destructive/20 text-destructive' :
                          'bg-badge-neutral text-badge-neutral-foreground'
                        }`}>{entry.statuscode}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{formatTime(entry.timestamp)}</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-primary">{entry.bookingRef || entry.paymentorderid || '—'}</td>
                    </tr>
                    {(expanded || hasError) && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <FaresRowDetail entry={entry} action={action} summary={summary} defaultShowRaw={false} autoExpandError={hasError && !expanded} />
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

import { Fragment } from 'react';

export default FaresTable;
