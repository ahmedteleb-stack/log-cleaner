import { ParsedRow } from '@/lib/csvParser';
import { BarChart3, Clock, Globe, Layers } from 'lucide-react';

interface LogStatsProps {
  rows: ParsedRow[];
  headers: string[];
}

const LogStats = ({ rows, headers }: LogStatsProps) => {
  const totalRows = rows.length;

  const uniqueProviders = headers.includes('provider_code')
    ? new Set(rows.map(r => r.provider_code)).size
    : null;

  const avgProcessingTime = headers.includes('processing_time')
    ? (rows.reduce((sum, r) => sum + (parseFloat(r.processing_time) || 0), 0) / totalRows).toFixed(1)
    : null;

  const uniqueLocales = headers.includes('locale')
    ? new Set(rows.map(r => r.locale)).size
    : null;

  const stats = [
    { label: 'Total Entries', value: totalRows.toLocaleString(), icon: Layers },
    uniqueProviders !== null && { label: 'Providers', value: uniqueProviders.toString(), icon: Globe },
    avgProcessingTime !== null && { label: 'Avg Processing', value: `${avgProcessingTime}s`, icon: Clock },
    uniqueLocales !== null && { label: 'Locales', value: uniqueLocales.toString(), icon: BarChart3 },
  ].filter(Boolean) as { label: string; value: string; icon: React.ElementType }[];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <stat.icon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default LogStats;
