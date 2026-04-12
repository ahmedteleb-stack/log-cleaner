import { useState, useMemo, useEffect, Fragment } from 'react';
import { FlattenedSupplierEntry, getSupplierTypeInfo } from '@/lib/supplierParser';
import { Search, ChevronDown, ChevronRight, Filter, AlertTriangle, Copy } from 'lucide-react';
import SupplierRowDetail from './SupplierRowDetail';

interface SupplierTableProps {
  entries: FlattenedSupplierEntry[];
}

const SOURCE_ICON: Record<string, string> = {
  user: '👤',
  system: '🤖',
};

const SOURCE_LABEL: Record<string, string> = {
  user: 'Customer action',
  system: 'System process',
};

// Simple dedup for supplier entries — same URL + method + requestBody + exact timestamp
function deduplicateSupplier(entries: FlattenedSupplierEntry[]) {
  const groups = new Map<string, number[]>();
  for (let i = 0; i < entries.length; i++) {
    const fp = `${entries[i].method}|${entries[i].url}|${entries[i]._rawRequestBody}|||${entries[i].requestedAt || entries[i].timestamp}`;
    if (!groups.has(fp)) groups.set(fp, []);
    groups.get(fp)!.push(i);
  }
  const result = entries.map(() => ({ duplicateCount: 0, isDuplicate: false }));
  for (const indices of groups.values()) {
    if (indices.length > 1) {
      result[indices[0]].duplicateCount = indices.length - 1;
      for (let j = 1; j < indices.length; j++) {
        result[indices[j]].isDuplicate = true;
      }
    }
  }
  return result;
}

const SupplierTable = ({ entries }: SupplierTableProps) => {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [hasInitializedErrors, setHasInitializedErrors] = useState(false);
  const perPage = 50;

  const dedupResults = useMemo(() => deduplicateSupplier(entries), [entries]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.type] = (counts[e.type] || 0) + 1;
    }
    return counts;
  }, [entries]);

  const totalDuplicates = useMemo(() => dedupResults.filter(d => d.isDuplicate).length, [dedupResults]);

  const filtered = useMemo(() => {
    let result = entries.map((e, i) => ({
      entry: e,
      idx: i,
      duplicateCount: dedupResults[i]?.duplicateCount || 0,
      isDuplicate: dedupResults[i]?.isDuplicate || false,
    }));

    if (hideDuplicates) {
      result = result.filter(e => !e.isDuplicate);
    }

    if (selectedTypes.size > 0) {
      result = result.filter(e => selectedTypes.has(e.entry.type));
    }

    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(e =>
        e.entry.type.toLowerCase().includes(lower) ||
        e.entry.ipcc.toLowerCase().includes(lower) ||
        e.entry.route.toLowerCase().includes(lower) ||
        e.entry.summary.toLowerCase().includes(lower) ||
        e.entry.msFareId.toLowerCase().includes(lower) ||
        e.entry.wegoRef.toLowerCase().includes(lower) ||
        e.entry.orderId.toLowerCase().includes(lower) ||
        e.entry.errorMessage.toLowerCase().includes(lower) ||
        e.entry.url.toLowerCase().includes(lower) ||
        e.entry.status.includes(lower)
      );
    }

    return result;
  }, [entries, filter, selectedTypes, hideDuplicates, dedupResults]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Auto-expand errors
  useEffect(() => {
    if (!hasInitializedErrors && entries.length > 0) {
      const errorIndices = new Set<number>();
      entries.forEach((entry, idx) => {
        if (entry.hasError) errorIndices.add(idx);
      });
      if (errorIndices.size > 0) setExpandedRows(errorIndices);
      setHasInitializedErrors(true);
    }
  }, [entries, hasInitializedErrors]);

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

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by type, IPCC, route, error, URL..."
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

        {totalDuplicates > 0 && (
          <button
            onClick={() => { setHideDuplicates(!hideDuplicates); setPage(0); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              hideDuplicates
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:bg-muted'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            {hideDuplicates ? 'Show Duplicates' : 'Hide Duplicates'}
            <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">{totalDuplicates}</span>
          </button>
        )}

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
            const info = getSupplierTypeInfo(type);
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
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IPCC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(({ entry, idx, duplicateCount }) => {
                const expanded = expandedRows.has(idx);
                const hasError = entry.hasError;
                const typeInfo = getSupplierTypeInfo(entry.type);
                return (
                  <Fragment key={idx}>
                    <tr
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${hasError ? 'bg-destructive/5' : ''}`}
                      onClick={() => toggleRow(idx)}
                    >
                      <td className="px-2 py-2.5 text-center">
                        <div className="flex items-center gap-1">
                          {expanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground inline-block" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground inline-block" />
                          }
                          {hasError && !expanded && (
                            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" title="Error — click to expand" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                            typeInfo.source === 'user'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                          title={SOURCE_LABEL[typeInfo.source]}
                        >
                          {SOURCE_ICON[typeInfo.source]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <span className="text-base">{typeInfo.icon}</span>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-[400px]">
                        <div className="flex items-center gap-2">
                          {entry.summary ? (
                            <span className={`text-xs truncate block ${entry.hasError ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {entry.summary}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                          {duplicateCount > 0 && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/20" title={`${duplicateCount} duplicate(s) with same timestamp`}>
                              <Copy className="w-2.5 h-2.5" />
                              ×{duplicateCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {entry.hasError && entry.errorMessage ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/20 text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            ERROR
                          </span>
                        ) : (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            entry.status === '200' ? 'bg-badge-success text-badge-success-foreground' :
                            parseInt(entry.status) >= 400 ? 'bg-destructive/20 text-destructive' :
                            'bg-badge-neutral text-badge-neutral-foreground'
                          }`}>{entry.status}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{formatTime(entry.requestedAt || entry.timestamp)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{entry.timeInMs}ms</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-primary">{entry.ipcc || '—'}</td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <SupplierRowDetail entry={entry} defaultExpanded={expanded} />
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

export default SupplierTable;
