import { FlattenedLogEntry } from '@/lib/csvParser';
import { BarChart3, Clock, Globe, Layers, Plane, Users } from 'lucide-react';

interface LogStatsProps {
  entries: FlattenedLogEntry[];
}

const LogStats = ({ entries }: LogStatsProps) => {
  const total = entries.length;
  const uniqueProviders = new Set(entries.map(e => e.provider_code)).size;
  const avgProcessing = (entries.reduce((s, e) => s + (parseFloat(e.processing_time) || 0), 0) / total).toFixed(1);
  const totalTrips = entries.reduce((s, e) => s + (parseInt(e.trips_count) || 0), 0);
  const uniqueRoutes = new Set(entries.map(e => e.route).filter(Boolean)).size;
  const totalPax = entries.length > 0
    ? `${entries[0].adults_count}A ${entries[0].children_count}C ${entries[0].infants_count}I`
    : '—';

  const stats = [
    { label: 'Total Entries', value: total.toLocaleString(), icon: Layers },
    { label: 'Providers', value: uniqueProviders.toString(), icon: Globe },
    { label: 'Avg Response', value: `${avgProcessing}s`, icon: Clock },
    { label: 'Total Trips', value: totalTrips.toLocaleString(), icon: BarChart3 },
    { label: 'Routes', value: uniqueRoutes.toString(), icon: Plane },
    { label: 'Passengers', value: totalPax, icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <stat.icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default LogStats;
