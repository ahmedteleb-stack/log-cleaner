import { FlattenedFareEntry } from '@/lib/faresParser';
import { Layers, AlertTriangle, CreditCard, Globe, CheckCircle, XCircle, Plane, Shield, Clock, DollarSign } from 'lucide-react';

interface FaresStatsProps {
  entries: FlattenedFareEntry[];
}

const FaresStats = ({ entries }: FaresStatsProps) => {
  const total = entries.length;
  const errors = entries.filter(e => e.hasError).length;
  const success = entries.filter(e => e.statuscode === '200').length;
  const uniqueEndpoints = new Set(entries.map(e => e.endpointType)).size;
  const bookingRefs = new Set(entries.map(e => e.bookingRef).filter(Boolean));
  const priceChanged = entries.filter(e => e.priceChanged === 'true').length;
  const withRoute = entries.filter(e => e.route).length;
  const withInsurance = entries.filter(e => e.insurancePackages.length > 0).length;
  const totalPayMethods = entries.reduce((sum, e) => sum + e.paymentMethods.length, 0);
  const maxPrice = entries.reduce((max, e) => {
    const p = parseFloat(e.totalPrice);
    return !isNaN(p) && p > max ? p : max;
  }, 0);
  const currency = entries.find(e => e.currencyCode)?.currencyCode || '';

  const stats = [
    { label: 'Total Requests', value: total.toString(), icon: Layers },
    { label: 'Success', value: `${success}/${total}`, icon: CheckCircle },
    { label: 'Endpoints', value: uniqueEndpoints.toString(), icon: Globe },
    { label: 'Booking Refs', value: bookingRefs.size.toString(), icon: CreditCard },
    { label: 'Routes Found', value: withRoute.toString(), icon: Plane },
    { label: 'Price Changes', value: priceChanged.toString(), icon: AlertTriangle },
    { label: 'Max Price', value: maxPrice > 0 ? `${maxPrice.toLocaleString()} ${currency}` : '—', icon: DollarSign },
    { label: 'Pay Methods', value: totalPayMethods > 0 ? totalPayMethods.toString() : '—', icon: CreditCard },
    { label: 'Insurance', value: withInsurance > 0 ? withInsurance.toString() : '—', icon: Shield },
    { label: 'Errors', value: errors.toString(), icon: errors > 0 ? AlertTriangle : XCircle },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <stat.icon className="w-3 h-3" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="text-lg font-bold font-mono text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default FaresStats;
