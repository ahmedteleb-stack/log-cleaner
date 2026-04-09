import { FlattenedFareEntry } from '@/lib/faresParser';
import { X, Globe, CreditCard, AlertTriangle, Plane, Clock, Smartphone, Shield, Package, DollarSign, Check, XCircle } from 'lucide-react';

interface FaresDetailPanelProps {
  entry: FlattenedFareEntry;
  onClose: () => void;
}

const FaresDetailPanel = ({ entry, onClose }: FaresDetailPanelProps) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Fare Entry Details</h2>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              entry.method === 'GET' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-warning text-badge-warning-foreground'
            }`}>{entry.method}</span>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
              entry.statuscode === '200' ? 'bg-badge-success text-badge-success-foreground' : 'bg-badge-warning text-badge-warning-foreground'
            }`}>{entry.statuscode}</span>
            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              {entry.endpointType}
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

          {/* Route & Flight Details */}
          {entry.legs.length > 0 && (
            <div className="bg-muted rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Plane className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Flight Details</span>
              </div>
              {entry.legs.map((leg, i) => (
                <div key={i} className="flex items-center gap-4 bg-card/50 rounded-md p-3">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-foreground">{leg.departureAirportCode}</p>
                    <p className="text-xs text-muted-foreground">{leg.departureTime}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <p className="text-[10px] text-muted-foreground">{leg.duration}</p>
                    <div className="w-full h-px bg-border my-1 relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {leg.airlineCodes.join(', ')} · {leg.stopoversCount === 0 ? 'Direct' : `${leg.stopoversCount} stop${leg.stopoversCount > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-foreground">{leg.arrivalAirportCode}</p>
                    <p className="text-xs text-muted-foreground">{leg.arrivalTime}</p>
                  </div>
                </div>
              ))}
              {entry.cabin && <Detail label="Cabin" value={entry.cabin} />}
              {entry.providerCode && <Detail label="Provider" value={entry.providerCode} mono />}
            </div>
          )}

          {/* Route summary for non-revalidate entries */}
          {entry.route && entry.legs.length === 0 && (
            <div className="bg-muted rounded-lg p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Plane className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Route</span>
              </div>
              <p className="text-xl font-bold font-mono text-foreground">{entry.route}</p>
            </div>
          )}

          {/* Pricing */}
          {(entry.totalPrice || entry.priceBreakdown) && (
            <Section icon={<DollarSign className="w-4 h-4" />} title="Pricing">
              <div className="grid grid-cols-2 gap-3">
                {entry.totalPrice && <Detail label="Total Price" value={`${Number(entry.totalPrice).toLocaleString()} ${entry.currencyCode}`} highlight />}
                {entry.priceChanged && <Detail label="Price Changed" value={entry.priceChanged === 'true' ? 'Yes ⚠️' : 'No'} />}
                {entry.oldPrice && entry.newPrice && entry.oldPrice !== entry.newPrice && (
                  <>
                    <Detail label="Old Price" value={`${Number(entry.oldPrice).toLocaleString()} ${entry.currencyCode}`} />
                    <Detail label="New Price" value={`${Number(entry.newPrice).toLocaleString()} ${entry.currencyCode}`} highlight />
                  </>
                )}
              </div>
              {entry.priceBreakdown && (
                <div className="mt-3 bg-card/50 rounded-md p-3 grid grid-cols-2 gap-2">
                  <Detail label="Base Fare" value={entry.priceBreakdown.totalOriginalAmount ? `${Number(entry.priceBreakdown.totalOriginalAmount).toLocaleString()} ${entry.priceBreakdown.currencyCode}` : '—'} />
                  <Detail label="Taxes" value={entry.priceBreakdown.totalTaxAmount ? `${Number(entry.priceBreakdown.totalTaxAmount).toLocaleString()} ${entry.priceBreakdown.currencyCode}` : '—'} />
                  <Detail label="Booking Fee" value={entry.priceBreakdown.totalBookingFee || '0'} />
                  <Detail label="Insurance" value={entry.priceBreakdown.totalInsuranceAmount || '0'} />
                  <Detail label="Seats" value={entry.priceBreakdown.totalSeatAmount || '0'} />
                  <Detail label="Meals" value={entry.priceBreakdown.totalMealAmount || '0'} />
                  <Detail label="Baggage" value={entry.priceBreakdown.totalBaggageAmount || '0'} />
                </div>
              )}
            </Section>
          )}

          {/* Payment Methods */}
          {entry.paymentMethods.length > 0 && (
            <Section icon={<CreditCard className="w-4 h-4" />} title={`Payment Methods (${entry.paymentMethods.length})`}>
              <div className="space-y-2">
                {entry.paymentMethods.map((pm, i) => (
                  <div key={i} className="flex items-center justify-between bg-card/50 rounded-md p-2.5">
                    <div>
                      <p className="text-xs font-medium text-foreground">{pm.name}</p>
                      <p className="text-[10px] text-muted-foreground">{pm.code} · {pm.cardType || 'N/A'}</p>
                    </div>
                    {pm.feeAmount && (
                      <div className="text-right">
                        <p className="text-xs font-mono text-foreground">{Number(pm.feeAmount).toLocaleString()} {pm.feeCurrency}</p>
                        <p className="text-[10px] text-muted-foreground">{pm.feePercentage}% fee</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Ancillary Support */}
          {entry.ancillarySupport.length > 0 && (
            <Section icon={<Package className="w-4 h-4" />} title="Ancillary Support">
              <div className="space-y-2">
                {entry.ancillarySupport.map((anc, i) => (
                  <div key={i} className="bg-card/50 rounded-md p-2.5">
                    <p className="text-xs font-medium text-foreground mb-1.5">{anc.legId}</p>
                    <div className="flex gap-3">
                      <AncBadge label="Seats" supported={anc.seatSupported} />
                      <AncBadge label="Meals" supported={anc.mealSupported} />
                      <AncBadge label="Baggage" supported={anc.baggageSupported} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Insurance */}
          {entry.insurancePackages.length > 0 && (
            <Section icon={<Shield className="w-4 h-4" />} title={`Insurance (${entry.insurancePackages.length})`}>
              <div className="space-y-2">
                {entry.insurancePackages.map((ins, i) => (
                  <div key={i} className="bg-card/50 rounded-md p-2.5">
                    <p className="text-xs font-medium text-foreground">{ins.type}</p>
                    <p className="text-[10px] text-muted-foreground">{ins.title}</p>
                    {ins.amount && <p className="text-xs font-mono text-primary mt-1">{Number(ins.amount).toLocaleString()} {ins.currency}</p>}
                    <p className="text-[10px] text-muted-foreground">{ins.supplier}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Request Details */}
          <Section icon={<Globe className="w-4 h-4" />} title="Request">
            <div className="grid grid-cols-1 gap-3">
              <Detail label="Endpoint" value={entry.endpointType} highlight />
              <Detail label="Full URL" value={entry.endpoint} mono />
              {entry.bookingRef && <Detail label="Booking Ref" value={entry.bookingRef} mono />}
              {entry.paymentorderid && <Detail label="Order ID" value={entry.paymentorderid} mono />}
              <Detail label="Fare ID" value={entry.msfareid} mono />
              {entry.brandedfareid && <Detail label="Branded Fare ID" value={entry.brandedfareid} mono />}
              {entry.wegoref && <Detail label="Wego Ref" value={entry.wegoref} mono />}
              {entry.responseCode && <Detail label="Response Code" value={entry.responseCode} />}
              {entry.paymentExtension && <Detail label="Payment Extension" value={entry.paymentExtension} />}
              {entry.expiredAt && <Detail label="Expires At" value={formatTimestamp(entry.expiredAt)} />}
              {entry.requestBodySummary && <Detail label="Request Body" value={entry.requestBodySummary} mono />}
            </div>
          </Section>

          {/* Client Context */}
          <Section icon={<Smartphone className="w-4 h-4" />} title="Client Context">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Country" value={entry.country} />
              <Detail label="City" value={entry.city} />
              <Detail label="Device" value={entry.deviceInfo} />
              <Detail label="Auth Status" value={entry.authStatus} />
              <Detail label="Client IP" value={entry.clientIp} mono />
              <Detail label="Origin" value={entry.origin} mono />
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
              {entry.expiredAt && <Detail label="Expires At" value={formatTimestamp(entry.expiredAt)} />}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

function AncBadge({ label, supported }: { label: string; supported: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
      supported ? 'bg-badge-success text-badge-success-foreground' : 'bg-badge-neutral text-badge-neutral-foreground'
    }`}>
      {supported ? <Check className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

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
