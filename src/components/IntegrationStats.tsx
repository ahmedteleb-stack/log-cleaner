import { FlattenedIntegrationEntry } from '@/lib/integrationParser';
import { Layers, CheckCircle, XCircle, AlertTriangle, Globe, Clock, Plane, DollarSign, Shield, Cpu } from 'lucide-react';

interface IntegrationStatsProps {
  entries: FlattenedIntegrationEntry[];
}

const IntegrationStats = ({ entries }: IntegrationStatsProps) => {
  const total = entries.length;
  const success = entries.filter(e => e.status === '200').length;
  const errors = entries.filter(e => e.hasError || parseInt(e.status) >= 400).length;
  const uniqueTypes = new Set(entries.map(e => e.type)).size;
  const avgTime = total > 0 ? Math.round(entries.reduce((s, e) => s + (parseInt(e.timeInMs) || 0), 0) / total) : 0;
  const maxTime = entries.reduce((m, e) => Math.max(m, parseInt(e.timeInMs) || 0), 0);
  const uniqueIpccs = new Set(entries.map(e => e.ipcc).filter(Boolean)).size;
  const withSaba = entries.filter(e => e.saba).length;
  const routes = new Set(entries.map(e => e.route).filter(Boolean)).size;
  const integrationTypes = new Set(entries.map(e => e.integrationType).filter(Boolean));
  const withInsurance = entries.filter(e => e.insurancePackages.length > 0).length;

  const stats = [
    { label: 'Total Calls', value: total.toString(), icon: Layers },
    { label: 'Success', value: `${success}/${total}`, icon: CheckCircle },
    { label: 'Errors', value: errors.toString(), icon: errors > 0 ? AlertTriangle : XCircle },
    { label: 'Types', value: uniqueTypes.toString(), icon: Globe },
    { label: 'IPCCs', value: uniqueIpccs.toString(), icon: Cpu },
    { label: 'Avg Time', value: `${avgTime}ms`, icon: Clock },
    { label: 'Max Time', value: `${maxTime}ms`, icon: Clock },
    { label: 'Routes', value: routes.toString(), icon: Plane },
    { label: 'SABA Priced', value: withSaba.toString(), icon: DollarSign },
    { label: 'Insurance', value: withInsurance.toString(), icon: Shield },
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

export default IntegrationStats;
