import { useState, useMemo } from 'react';
import { ParsedRow } from '@/lib/csvParser';
import SearchFieldViewer from './SearchFieldViewer';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

interface LogTableProps {
  headers: string[];
  rows: ParsedRow[];
}

const SEARCH_LIKE_FIELDS = ['search', 'query', 'request', 'payload', 'params', 'body'];

function isSearchField(header: string): boolean {
  return SEARCH_LIKE_FIELDS.some(f => header.toLowerCase().includes(f));
}

function looksLikeObjectString(value: string): boolean {
  return value.startsWith('{') && value.endsWith('}') && value.includes('=');
}

const LogTable = ({ headers, rows }: LogTableProps) => {
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const perPage = 25;

  const filtered = useMemo(() => {
    if (!filter) return rows;
    const lower = filter.toLowerCase();
    return rows.filter(row =>
      Object.values(row).some(v => v.toLowerCase().includes(lower))
    );
  }, [rows, filter]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
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

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(0); }}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
          {sorted.length} results
        </span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-10">
                  #
                </th>
                {headers.map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                    onClick={() => toggleSort(h)}
                  >
                    <span className="flex items-center gap-1">
                      {h.replace(/_/g, ' ')}
                      {sortCol === h && (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                    {page * perPage + i + 1}
                  </td>
                  {headers.map(h => (
                    <td key={h} className="px-3 py-2 max-w-[400px]">
                      {(isSearchField(h) || looksLikeObjectString(row[h])) ? (
                        <SearchFieldViewer raw={row[h]} />
                      ) : (
                        <CellValue header={h} value={row[h]} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
            {page + 1} / {totalPages}
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
    </div>
  );
};

function CellValue({ header, value }: { header: string; value: string }) {
  if (!value || value === 'null') return <span className="text-muted-foreground">—</span>;

  // Boolean badges
  if (value === 'true' || value === 'false') {
    const isTrue = value === 'true';
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        isTrue ? 'bg-badge-success text-badge-success-foreground' : 'bg-badge-neutral text-badge-neutral-foreground'
      }`}>
        {value}
      </span>
    );
  }

  // Numeric values
  if (/^\d+(\.\d+)?$/.test(value) && !header.includes('date') && !header.includes('id')) {
    return <span className="font-mono text-xs text-foreground">{value}</span>;
  }

  // Timestamps
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      const d = new Date(value);
      return (
        <span className="font-mono text-xs text-foreground" title={value}>
          {d.toLocaleString()}
        </span>
      );
    } catch {
      // fall through
    }
  }

  // URLs / provider codes
  if (value.includes('.') && !value.includes(' ') && header.includes('provider')) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-badge-info text-badge-info-foreground">
        {value}
      </span>
    );
  }

  return <span className="font-mono text-xs text-foreground break-all">{value}</span>;
}

export default LogTable;
