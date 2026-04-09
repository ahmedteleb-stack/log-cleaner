import { FlattenedFareEntry } from '@/lib/faresParser';
import { Layers, AlertTriangle, CreditCard, Globe, CheckCircle, XCircle } from 'lucide-react';

interface FaresStatsProps {
  entries: FlattenedFareEntry[];
}

const FaresStats = ({ entries }: FaresStatsProps) => {
  const total = entries.length;
  const errors = entries.filter(e => e.hasError).length;
  const success = entries.filter(e => e.statuscode === '200').length;
  const uniqueEndpoints = new Set(entries.map(e => e.endpointType)).size;
  const uniqueOrders = new Set(entries.map(e => e.paymentorderid).filter(Boolean)).size;
  const priceChanged = entries.filter(e => e.priceChanged === 'true').length;

  const stats = [
    { label: 'Total Requests', value: total.toString(), icon: Layers },
    { label: 'Success (200)', value: success.toString(), icon: CheckCircle },
    { label: 'Errors', value: errors.toString(), icon: errors > 0 ? AlertTriangle : XCircle },
    { label: 'Endpoints', value: uniqueEndpoints.toString(), icon: Globe },
    { label: 'Orders', value: uniqueOrders.toString(), icon: CreditCard },
    { label: 'Price Changes', value: priceChanged.toString(), icon: AlertTriangle },
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

export default FaresStats;
