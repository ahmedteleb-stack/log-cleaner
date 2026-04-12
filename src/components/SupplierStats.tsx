import { useMemo } from 'react';
import { FlattenedSupplierEntry, getSupplierTypeInfo } from '@/lib/supplierParser';

interface SupplierStatsProps {
  entries: FlattenedSupplierEntry[];
}

const SupplierStats = ({ entries }: SupplierStatsProps) => {
  const stats = useMemo(() => {
    let totalErrors = 0;
    let totalDuration = 0;
    let durCount = 0;
    let maxDuration = 0;
    let supplierEndpoint = '';
    const typeCounts: Record<string, number> = {};

    for (const e of entries) {
      if (e.hasError) totalErrors++;
      const ms = parseInt(e.timeInMs);
      if (!isNaN(ms)) {
        totalDuration += ms;
        durCount++;
        if (ms > maxDuration) maxDuration = ms;
      }
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
      if (!supplierEndpoint && e.url) {
        try { supplierEndpoint = new URL(e.url).hostname; } catch { supplierEndpoint = e.url.split('/')[2] || ''; }
      }
    }

    const avgDuration = durCount > 0 ? Math.round(totalDuration / durCount) : 0;

    // Top types
    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: entries.length,
      totalErrors,
      avgDuration,
      maxDuration,
      supplierEndpoint,
      topTypes,
      ipcc: entries[0]?.ipcc || '—',
    };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Calls</p>
        <p className="text-xl font-bold text-foreground mt-1">{stats.total}</p>
      </div>
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Errors</p>
        <p className={`text-xl font-bold mt-1 ${stats.totalErrors > 0 ? 'text-destructive' : 'text-green-500'}`}>{stats.totalErrors}</p>
      </div>
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Duration</p>
        <p className="text-xl font-bold text-foreground mt-1">{stats.avgDuration}<span className="text-xs font-normal text-muted-foreground">ms</span></p>
      </div>
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Max Duration</p>
        <p className="text-xl font-bold text-foreground mt-1">{stats.maxDuration}<span className="text-xs font-normal text-muted-foreground">ms</span></p>
      </div>
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IPCC</p>
        <p className="text-lg font-bold font-mono text-primary mt-1">{stats.ipcc}</p>
      </div>
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Supplier</p>
        <p className="text-xs font-mono text-foreground mt-1.5 truncate" title={stats.supplierEndpoint}>{stats.supplierEndpoint}</p>
      </div>

      {/* Top action types */}
      <div className="col-span-2 md:col-span-4 lg:col-span-6 bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top Actions</p>
        <div className="flex flex-wrap gap-2">
          {stats.topTypes.map(([type, count]) => {
            const info = getSupplierTypeInfo(type);
            return (
              <span key={type} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-muted border border-border">
                <span>{info.icon}</span>
                <span className="font-medium text-foreground">{info.label}</span>
                <span className="text-[10px] text-muted-foreground">({count})</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupplierStats;
