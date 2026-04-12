import { useState } from 'react';
import { FlattenedSupplierEntry, getSupplierTypeInfo } from '@/lib/supplierParser';
import { AlertTriangle, Code, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

interface SupplierRowDetailProps {
  entry: FlattenedSupplierEntry;
  defaultExpanded?: boolean;
}

const Section = ({ title, icon, children, defaultOpen = true }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors text-left">
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        <span className="text-xs">{icon}</span>
        <span className="text-[11px] font-semibold text-foreground">{title}</span>
      </button>
      {open && <div className="px-3 py-2.5 space-y-2 bg-card">{children}</div>}
    </div>
  );
};

const KV = ({ label, value, mono, warn }: { label: string; value?: string | number | boolean | null; mono?: boolean; warn?: boolean }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex gap-2 text-[11px]">
      <span className="text-muted-foreground shrink-0 min-w-[120px]">{label}:</span>
      <span className={`break-all ${mono ? 'font-mono' : ''} ${warn ? 'text-destructive font-semibold' : 'text-foreground'}`}>{String(value)}</span>
    </div>
  );
};

const fmtAmount = (v?: number, currency?: string) => {
  if (v === undefined || v === null || v === 0) return '';
  return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};

const SupplierRowDetail = ({ entry, defaultExpanded }: SupplierRowDetailProps) => {
  const [showRaw, setShowRaw] = useState(false);
  const hasError = entry.hasError;
  const typeInfo = getSupplierTypeInfo(entry.type);

  const tryFormat = (s: string): string => {
    if (!s) return '';
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
  };

  return (
    <div className="bg-muted/30 border-t border-border">
      <div className="px-6 py-4 space-y-3 max-w-5xl">
        {/* Error banner */}
        {hasError && entry.errorMessage && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">Error — {entry.status}</p>
              <p className="text-xs text-destructive/80 mt-1">{entry.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{typeInfo.icon} {typeInfo.label}</span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            entry.method === 'GET' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-warning text-badge-warning-foreground'
          }`}>{entry.method}</span>
          {entry.ipcc && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">IPCC: {entry.ipcc}</span>}
          <span className="text-[10px] font-mono text-muted-foreground">{entry.timeInMs}ms</span>
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">{entry.type}</span>
        </div>

        {/* Journeys / Flight Info */}
        {entry.journeys.length > 0 && (
          <Section title={`Flights (${entry.journeys.length})`} icon="✈️">
            {entry.journeys.map((j, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2.5 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">
                    {j.carrierCode}{j.flightNumber} — {j.origin} → {j.destination}
                  </span>
                  {j.stops > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge-warning/20 text-badge-warning-foreground">{j.stops} stop(s)</span>
                  )}
                  {j.productClass && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{j.productClass}</span>}
                </div>
                <KV label="Departure" value={j.departure} />
                <KV label="Arrival" value={j.arrival} />
                <KV label="Fare Class" value={j.fareClass} />
                <KV label="Fare Basis" value={j.fareBasisCode} mono />
              </div>
            ))}
          </Section>
        )}

        {/* Passengers */}
        {entry.passengers.length > 0 && (
          <Section title={`Passengers (${entry.passengers.length})`} icon="👤">
            {entry.passengers.map((p, i) => (
              <div key={i} className="border-b border-border/50 last:border-0 pb-2 last:pb-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">{p.title} {p.firstName} {p.lastName}</span>
                  <span className="text-[10px] text-muted-foreground">{p.gender}</span>
                </div>
                <KV label="DOB" value={p.dateOfBirth} />
                <KV label="Nationality" value={p.nationality} />
                <KV label="Passenger Key" value={p.passengerKey} mono />
              </div>
            ))}
          </Section>
        )}

        {/* Seat Map */}
        {entry.seatMapInfo && (
          <Section title="Seat Map" icon="💺">
            <KV label="Equipment" value={`${entry.seatMapInfo.equipmentType} — ${entry.seatMapInfo.equipmentName}`} />
            <KV label="Route" value={`${entry.seatMapInfo.origin} → ${entry.seatMapInfo.destination}`} />
            <KV label="Available Seats" value={entry.seatMapInfo.availableUnits} />
            <KV label="Compartments" value={entry.seatMapInfo.compartmentCount} />
          </Section>
        )}

        {/* SSR Availability */}
        {entry.ssrInfo.length > 0 && (
          <Section title={`SSR Options (${entry.ssrInfo.length})`} icon="🧳">
            <div className="space-y-1">
              {entry.ssrInfo.map((ssr, i) => (
                <div key={i} className="flex items-center gap-3 text-[11px] border-b border-border/30 last:border-0 pb-1">
                  <span className="font-mono text-muted-foreground min-w-[50px]">{ssr.ssrCode}</span>
                  <span className="text-foreground flex-1">{ssr.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    ssr.ssrType === 'BaggageAllowance' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>{ssr.ssrType}</span>
                  <span className="font-mono text-primary">{ssr.price > 0 ? fmtAmount(ssr.price) : 'Free'}</span>
                  {ssr.available !== null && <span className="text-[10px] text-muted-foreground">{ssr.available} avl</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Price Breakdown */}
        {entry.breakdown && (
          <Section title="Price Breakdown" icon="💰">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <KV label="Balance Due" value={fmtAmount(entry.breakdown.balanceDue, entry.breakdown.currencyCode)} />
              <KV label="Total Amount" value={fmtAmount(entry.breakdown.totalAmount, entry.breakdown.currencyCode)} />
              <KV label="Total Charged" value={fmtAmount(entry.breakdown.totalCharged, entry.breakdown.currencyCode)} />
              <KV label="Total Tax" value={fmtAmount(entry.breakdown.totalTax, entry.breakdown.currencyCode)} />
            </div>
            {entry.breakdown.passengerCharges.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Service Charges</p>
                <div className="space-y-0.5">
                  {entry.breakdown.passengerCharges.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px]">
                      <span className="font-mono text-muted-foreground min-w-[40px]">{c.code}</span>
                      <span className="text-foreground flex-1">{c.detail}</span>
                      <span className="font-mono text-foreground">{fmtAmount(c.amount, c.currencyCode)}</span>
                      {c.foreignCurrencyCode && c.foreignCurrencyCode !== c.currencyCode && (
                        <span className="text-muted-foreground">({fmtAmount(c.foreignAmount, c.foreignCurrencyCode)})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Payment */}
        {entry.paymentInfo && (
          <Section title="Payment" icon="💳">
            <KV label="Method" value={entry.paymentInfo.paymentMethodCode} />
            <KV label="Type" value={entry.paymentInfo.paymentMethodType} />
            <KV label="Amount" value={fmtAmount(entry.paymentInfo.amount, entry.paymentInfo.currencyCode)} />
            <KV label="Status" value={entry.paymentInfo.status} />
            <KV label="Account" value={entry.paymentInfo.accountNumber} mono />
          </Section>
        )}

        {/* Commit / PNR */}
        {entry.commitInfo && (
          <Section title="Booking Commit" icon="✅">
            <KV label="Record Locator" value={entry.commitInfo.recordLocator} mono />
            <KV label="State" value={entry.commitInfo.state} />
            <KV label="Total Cost" value={fmtAmount(entry.commitInfo.totalCost, entry.commitInfo.currencyCode)} />
            <KV label="PNR Amount" value={fmtAmount(entry.commitInfo.pnrAmount, entry.commitInfo.currencyCode)} />
          </Section>
        )}

        {/* Request Info */}
        <Section title="Request Info" icon="📡" defaultOpen={false}>
          <KV label="URL" value={entry.url} mono />
          <KV label="Type" value={entry.type} mono />
          <KV label="IPCC" value={entry.ipcc} />
          <KV label="MS Fare ID" value={entry.msFareId} mono />
          <KV label="Branded Fare ID" value={entry.brandedFareId} mono />
          <KV label="Wego Ref" value={entry.wegoRef} mono />
          <KV label="Order ID" value={entry.orderId} mono />
          <KV label="Itinerary Ref" value={entry.itineraryRef} mono />
        </Section>

        {/* Context */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground">Requested: {entry.requestedAt}</span>
          <span className="text-[10px] text-muted-foreground">⏱ {entry.timeInMs}ms</span>
        </div>

        {/* Raw JSON toggle */}
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <Code className="w-3.5 h-3.5" />
          {showRaw ? 'Hide Raw JSON' : 'View Raw JSON'}
        </button>

        {showRaw && (
          <div className="space-y-2">
            {entry._rawRequestBody && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Request Body</p>
                <pre className="bg-card border border-border rounded-md p-3 text-[10px] font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {tryFormat(entry._rawRequestBody)}
                </pre>
              </div>
            )}
            {entry._rawResponseBody && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Response Body</p>
                <pre className="bg-card border border-border rounded-md p-3 text-[10px] font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {tryFormat(entry._rawResponseBody)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierRowDetail;
