import { FlattenedFareEntry } from '@/lib/faresParser';
import { X, Globe, CreditCard, AlertTriangle, Plane, ArrowRight, Clock, Smartphone } from 'lucide-react';

interface FaresDetailPanelProps {
  entry: FlattenedFareEntry;
  onClose: () => void;
}

const FaresDetailPanel = ({ entry, onClose }: FaresDetailPanelProps) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Fare Entry Details</h2>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              entry.method === 'GET' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-warning text-badge-warning-foreground'
            }`}>
              {entry.method}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
              entry.statuscode === '200' ? 'bg-badge-success text-badge-success-foreground' : 'bg-badge-warning text-badge-warning-foreground'
            }`}>
              {entry.statuscode}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error banner */}
          {entry.hasError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Error</p>
                <p className="text-xs text-destructive/80 mt-1">{entry.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Route (if available) */}
          {entry.route && (
            <div className="bg-muted rounded-lg p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Plane className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Route</span>
              </div>
              <p className="text-xl font-bold font-mono text-foreground">{entry.route}</p>
              {entry.totalPrice && (
                <div className="mt-3 flex items-center gap-4">
                  <Detail label="Price" value={`${entry.totalPrice} ${entry.currencyCode}`} highlight />
                  <Detail label="Price Changed" value={entry.priceChanged === 'true' ? 'Yes' : entry.priceChanged === 'false' ? 'No' : '—'} />
                </div>
              )}
            </div>
          )}

          {/* Request */}
          <Section icon={<Globe className="w-4 h-4" />} title="Request">
            <div className="grid grid-cols-1 gap-3">
              <Detail label="Endpoint" value={entry.endpointType} highlight />
              <Detail label="Full URL" value={entry.endpoint} mono />
              <Detail label="Order ID" value={entry.paymentorderid} mono />
              <Detail label="Fare ID" value={entry.msfareid} mono />
              {entry.brandedfareid && <Detail label="Branded Fare ID" value={entry.brandedfareid} mono />}
              {entry.wegoref && <Detail label="Wego Ref" value={entry.wegoref} mono />}
            </div>
          </Section>

          {/* Context */}
          <Section icon={<Smartphone className="w-4 h-4" />} title="Client Context">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Country" value={entry.country} />
              <Detail label="City" value={entry.city} />
              <Detail label="Device" value={entry.deviceInfo} />
              <Detail label="Auth Status" value={entry.authStatus} />
              <Detail label="Client IP" value={entry.clientIp} mono />
            </div>
            <div className="mt-3">
              <Detail label="User Agent" value={entry.userAgent} mono />
            </div>
          </Section>

          {/* Timing */}
          <Section icon={<Clock className="w-4 h-4" />} title="Timing">
            <div className="grid grid-cols-1 gap-3">
              <Detail label="Timestamp" value={formatTimestamp(entry.timestamp)} />
              <Detail label="Date" value={entry.date} />
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
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

export default FaresDetailPanel;
