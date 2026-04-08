import { FlattenedLogEntry } from '@/lib/csvParser';
import { X, Plane, ArrowRight, Smartphone, Globe, Clock } from 'lucide-react';

interface LogDetailPanelProps {
  entry: FlattenedLogEntry;
  onClose: () => void;
}

const LogDetailPanel = ({ entry, onClose }: LogDetailPanelProps) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold text-foreground">Log Entry Details</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Route card */}
          <div className="bg-muted rounded-lg p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Plane className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Route</span>
            </div>
            <div className="flex items-center gap-3 text-2xl font-bold font-mono text-foreground">
              <span>{entry.departure_city}</span>
              <ArrowRight className="w-5 h-5 text-primary" />
              <span>{entry.arrival_city}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Detail label="Outbound" value={entry.outbound_date} />
              <Detail label="Return" value={entry.return_date} />
              <Detail label="Trip Type" value={entry.trip_type} />
              <Detail label="Legs" value={entry.number_of_legs} />
            </div>
          </div>

          {/* Search context */}
          <Section icon={<Smartphone className="w-4 h-4" />} title="Search Context">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Cabin" value={entry.cabin} />
              <Detail label="Adults" value={entry.adults_count} />
              <Detail label="Children" value={entry.children_count} />
              <Detail label="Infants" value={entry.infants_count} />
              <Detail label="Currency" value={entry.currency_code} />
              <Detail label="Device" value={entry.device_type} />
              <Detail label="App Type" value={entry.app_type} />
              <Detail label="Site Code" value={entry.site_code} />
              <Detail label="Locale" value={entry.locale} />
              <Detail label="Logged In" value={entry.user_logged_in} />
            </div>
          </Section>

          {/* Provider response */}
          <Section icon={<Globe className="w-4 h-4" />} title="Provider Response">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Provider" value={entry.provider_code} highlight />
              <Detail label="Processing Time" value={`${entry.processing_time}s`} />
              <Detail label="Trips Found" value={entry.trips_count} />
              <Detail label="Requests" value={entry.requests_count} />
              <Detail label="Total" value={entry.total} />
              <Detail label="Valid" value={entry.valid} />
              <Detail label="Cached" value={entry.is_cached} />
            </div>
          </Section>

          {/* Timing */}
          <Section icon={<Clock className="w-4 h-4" />} title="Timing">
            <div className="grid grid-cols-1 gap-3">
              <Detail label="Timestamp" value={formatTimestamp(entry.timestamp)} />
              <Detail label="Date" value={entry.date} />
              <Detail label="Search ID" value={entry.search_id} mono />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono text-xs break-all' : ''} ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function formatTimestamp(ts: string): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default LogDetailPanel;
