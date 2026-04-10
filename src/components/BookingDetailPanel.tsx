import { BookingExtraction, BookingLeg } from '@/lib/bookingExtractor';
import {
  X, Plane, User, CreditCard, Package, AlertTriangle, Globe,
  Smartphone, FileText, ChevronDown, ChevronRight, Download
} from 'lucide-react';
import { useState } from 'react';

interface BookingDetailPanelProps {
  extraction: BookingExtraction;
  onClose: () => void;
}

const BookingDetailPanel = ({ extraction, onClose }: BookingDetailPanelProps) => {
  const { booking_metadata: bm, passengers, contact, flights, price, baggage,
    penalties, fare_rules_summary, pnr_status, client_context, anomalies } = extraction;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(extraction, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bm.bookingRef}_extracted.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Booking Summary</h2>
            <RefBadge value={bm.bookingRef} />
            <StatusBadge label={bm.status} type={bm.status === 'CONFIRMED' ? 'success' : 'warning'} />
            <StatusBadge label={bm.paymentStatus} type={bm.paymentStatus === 'CAPTURED' ? 'success' : 'neutral'} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Download JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-sm font-semibold text-destructive">
                  {anomalies.length} Anomal{anomalies.length === 1 ? 'y' : 'ies'} Detected
                </span>
              </div>
              {anomalies.map((a, i) => (
                <div key={i} className="ml-6 text-xs text-destructive/80">
                  <span className="font-mono">{a.url}</span> — {a.reasons.join(', ')}
                  {a.errorMessage && <span className="block mt-0.5 text-destructive/60">{a.errorMessage}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Booking Metadata */}
          <Section icon={<FileText className="w-4 h-4" />} title="Booking Metadata">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Booking Ref" value={bm.bookingRef} mono highlight />
              <Detail label="Wego Order ID" value={bm.wegoOrderId} mono />
              <Detail label="Status" value={bm.status} />
              <Detail label="Payment Status" value={bm.paymentStatus} />
              <Detail label="Refund Type" value={bm.refundType} />
              <Detail label="Status Code" value={bm.statusPollResponseCode?.toString()} />
              <Detail label="Created At" value={fmt(bm.createdAt)} />
              <Detail label="Expires At" value={fmt(bm.expiredAt)} />
            </div>
            {bm.brandedFareNameLeg1 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-md p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Leg 1 Fare</p>
                  <p className="text-sm font-semibold text-foreground">{bm.brandedFareNameLeg1}</p>
                  <p className="text-[10px] font-mono text-muted-foreground break-all">{bm.brandedFareCodeLeg1}</p>
                </div>
                {bm.brandedFareNameLeg2 && (
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Leg 2 Fare</p>
                    <p className="text-sm font-semibold text-foreground">{bm.brandedFareNameLeg2}</p>
                    <p className="text-[10px] font-mono text-muted-foreground break-all">{bm.brandedFareCodeLeg2}</p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Flights */}
          {(flights.outbound || flights.inbound) && (
            <Section icon={<Plane className="w-4 h-4" />} title="Flights">
              <div className="space-y-4">
                {flights.outbound && <LegCard leg={flights.outbound} label="Outbound" />}
                {flights.inbound && <LegCard leg={flights.inbound} label="Inbound" />}
              </div>
            </Section>
          )}

          {/* Passengers */}
          {passengers.length > 0 && (
            <Section icon={<User className="w-4 h-4" />} title={`Passengers (${passengers.length})`}>
              <div className="space-y-3">
                {passengers.map((p, i) => (
                  <div key={i} className="bg-muted rounded-md p-3 grid grid-cols-2 gap-2">
                    <Detail label="Name" value={`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()} />
                    <Detail label="Type" value={p.type} />
                    <Detail label="Gender" value={p.gender} />
                    <Detail label="Date of Birth" value={p.dateOfBirth} />
                    <Detail label="Nationality" value={p.nationality} />
                    <Detail label="Document Type" value={p.documentType} />
                    <Detail label="Document ID" value={p.documentId} mono />
                    <Detail label="Document Expiry" value={p.documentExpiry} />
                    {p.passengerId && <Detail label="Passenger ID" value={String(p.passengerId)} mono />}
                  </div>
                ))}
                {contact && (
                  <div className="bg-muted/50 rounded-md p-3 grid grid-cols-2 gap-2">
                    <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contact</p>
                    <Detail label="Email" value={contact.email} mono />
                    <Detail label="Phone" value={`+${contact.phonePrefix}${contact.phoneNumber}`} mono />
                    <Detail label="Country Code" value={contact.phoneCountryCode} />
                    <Detail label="Full Name" value={contact.fullName} />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Price */}
          <Section icon={<CreditCard className="w-4 h-4" />} title="Pricing & Payment">
            <div className="space-y-3">
              {/* Total */}
              <div className="flex items-end justify-between bg-primary/10 border border-primary/20 rounded-md p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-primary font-mono">
                    {price.summary.userTotalAmount != null
                      ? `${Number(price.summary.userTotalAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${price.summary.userCurrencyCode}`
                      : '—'}
                  </p>
                </div>
                {price.summary.totalAmountInUsd != null && (
                  <p className="text-sm text-muted-foreground font-mono">
                    ≈ {Number(price.summary.totalAmountInUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                  </p>
                )}
              </div>

              {/* Leg breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-md p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Leg 1 — {bm.brandedFareNameLeg1 ?? 'Outbound'}</p>
                  <p className="text-sm font-mono font-semibold text-foreground">
                    {price.summary.userBaseAmountLeg1 != null
                      ? `${Number(price.summary.userBaseAmountLeg1).toLocaleString(undefined, { maximumFractionDigits: 2 })} base`
                      : '—'}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    + {price.summary.userTaxAmountLeg1 != null
                      ? `${Number(price.summary.userTaxAmountLeg1).toLocaleString(undefined, { maximumFractionDigits: 2 })} tax`
                      : '—'}
                  </p>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Leg 2 — {bm.brandedFareNameLeg2 ?? 'Inbound'}</p>
                  <p className="text-sm font-mono font-semibold text-foreground">
                    {price.summary.userBaseAmountLeg2 != null
                      ? `${Number(price.summary.userBaseAmountLeg2).toLocaleString(undefined, { maximumFractionDigits: 2 })} base`
                      : '—'}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    + {price.summary.userTaxAmountLeg2 != null
                      ? `${Number(price.summary.userTaxAmountLeg2).toLocaleString(undefined, { maximumFractionDigits: 2 })} tax`
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Payment method */}
              {price.payment.length > 0 && (
                <div className="bg-muted rounded-md p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment</p>
                  {price.payment.map((p2, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground capitalize">{p2.paymentMethodCode ?? '—'}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{p2.orderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {p2.amount != null ? `${Number(p2.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${p2.currencyCode}` : '—'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">status: {p2.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Taxes collapsible */}
              {price.taxes.length > 0 && (
                <Collapsible title={`Taxes (${price.taxes.length} entries)`}>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {price.taxes.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                        <span className="font-mono text-muted-foreground">{t.code}</span>
                        <span className="text-muted-foreground flex-1 ml-3 truncate">{t.description}</span>
                        <span className="font-mono text-foreground ml-2 whitespace-nowrap">
                          {Number(t.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} {t.currencyCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )}
            </div>
          </Section>

          {/* Baggage */}
          {baggage.length > 0 && (
            <Section icon={<Package className="w-4 h-4" />} title="Baggage Allowances">
              <div className="space-y-2">
                {baggage.map((b, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                    <div>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${
                        b.type === 'CABIN' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-success text-badge-success-foreground'
                      }`}>{b.type}</span>
                      <span className="text-xs text-muted-foreground">{b.source ?? 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      {b.weight != null && <p className="text-sm font-mono font-semibold text-foreground">{b.weight} {b.unit}</p>}
                      {b.pieceCount != null && <p className="text-[10px] text-muted-foreground">{b.pieceCount} piece{b.pieceCount !== 1 ? 's' : ''}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Airline disclaimers */}
              {extraction.airlineDisclaimers?.length > 0 && (
                <Collapsible title="Airline Baggage Policies">
                  <div className="space-y-2">
                    {extraction.airlineDisclaimers.map((d, i) => (
                      <p key={i} className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: d.note }} />
                    ))}
                  </div>
                </Collapsible>
              )}
            </Section>
          )}

          {/* Penalties */}
          {(penalties.branded_fare_direct_penalties.length > 0 || penalties.fees.length > 0) && (
            <Section icon={<AlertTriangle className="w-4 h-4" />} title="Penalties & Fees">
              <div className="space-y-2">
                {penalties.branded_fare_direct_penalties.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{p.type} — <span className="text-muted-foreground">{p.brandedFareName}</span></p>
                      <p className="text-[10px] text-muted-foreground">Leg {p.legId}{p.conditionsApply ? ' · conditions apply' : ''}</p>
                    </div>
                    <div className="text-right">
                      {p.amount != null ? (
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {Number(p.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} {p.currencyCode}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">See conditions</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Fare Rules */}
          {fare_rules_summary && (
            <Collapsible title="Fare Rules & Terms" defaultOpen={false}>
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono bg-muted rounded-md p-3 max-h-64 overflow-y-auto">
                {fare_rules_summary}
              </pre>
            </Collapsible>
          )}

          {/* PNR Status */}
          {pnr_status && (
            <Section icon={<FileText className="w-4 h-4" />} title="PNR Status">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Detail label="Overall Status" value={pnr_status.overallBookingStatus} />
                <Detail label="Response Code" value={pnr_status.responseCode?.toString()} />
                <Detail label="Payment Extension" value={pnr_status.paymentExtension?.toString()} />
                <Detail label="Expires At" value={fmt(pnr_status.expiredAt)} />
              </div>
              {pnr_status.itinerarySegments.length > 0 && (
                <div className="space-y-1">
                  {pnr_status.itinerarySegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs bg-muted rounded-md px-3 py-1.5">
                      <span className="font-mono font-bold text-foreground">{seg.departureAirportCode} → {seg.arrivalAirportCode}</span>
                      {seg.airlineRef && <span className="font-mono text-primary">{seg.airlineRef}</span>}
                      {seg.isTechnicalStop && <span className="text-muted-foreground italic">Technical stop</span>}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Client Context */}
          <Section icon={<Smartphone className="w-4 h-4" />} title="Client Context">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Country" value={client_context['X-Country-Code']} />
              <Detail label="City" value={client_context['X-User-City']} />
              <Detail label="Origin" value={client_context.Origin} mono />
              <Detail label="Client IP" value={client_context['CF-Connecting-IP']} mono />
              <Detail label="Lat" value={client_context['X-Latitude']} mono />
              <Detail label="Lon" value={client_context['X-Longitude']} mono />
            </div>
            {client_context['User-Agent'] && (
              <div className="mt-3">
                <Detail label="User Agent" value={client_context['User-Agent']} mono />
              </div>
            )}
          </Section>

          {/* Extraction Meta */}
          <Section icon={<Globe className="w-4 h-4" />} title="Extraction Info">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Source Rows" value={extraction._extraction_meta.source_rows.toString()} />
              <Detail label="Extracted At" value={fmt(extraction._extraction_meta.extraction_timestamp)} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">{extraction._extraction_meta.note}</p>
          </Section>

        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LegCard({ leg, label }: { leg: BookingLeg; label: string }) {
  return (
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {leg.brandedFare && (
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
            leg.brandedFare.refundType === 'REFUNDABLE' ? 'bg-badge-success text-badge-success-foreground' : 'bg-badge-neutral text-badge-neutral-foreground'
          }`}>{leg.brandedFare.name}</span>
        )}
      </div>

      {/* Route visual */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xl font-bold font-mono text-foreground">{leg.departureAirportCode ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{leg.departureTime ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground">{leg.departureDate ?? ''}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-[10px] text-muted-foreground">{leg.duration ?? ''}</p>
          <div className="w-full h-px bg-border my-1 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
            <Plane className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 w-3 h-3 text-primary" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {leg.stopoversCount === 0 ? 'Direct' : `${leg.stopoversCount} stop${leg.stopoversCount !== 1 ? 's' : ''}`}
            {leg.airlineCodes.length > 0 && ` · ${leg.airlineCodes.join(', ')}`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold font-mono text-foreground">{leg.arrivalAirportCode ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{leg.arrivalTime ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground">{leg.arrivalDate ?? ''}</p>
        </div>
      </div>

      {/* Segments */}
      {leg.segments.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          {leg.segments.map((seg, i) => (
            <div key={i} className="bg-card/50 rounded-md p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-foreground">
                  {seg.departureAirportCode} → {seg.arrivalAirportCode}
                </span>
                <span className="font-mono text-primary">{seg.marketingFlightNumber}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                <span>{seg.marketingAirlineName}</span>
                {seg.cabin && <span className="capitalize">{seg.cabin}</span>}
                {seg.aircraftType && <span>{seg.aircraftType}</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                <span>{seg.departureTime} → {seg.arrivalTime}</span>
                {seg.departureTerminal && <span>T{seg.departureTerminal}</span>}
                {seg.airlineRef && <span className="font-mono text-primary">{seg.airlineRef}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RefBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary">
      {value}
    </span>
  );
}

function StatusBadge({ label, type }: { label: string; type: 'success' | 'warning' | 'neutral' }) {
  const cls = {
    success: 'bg-badge-success text-badge-success-foreground',
    warning: 'bg-badge-warning text-badge-warning-foreground',
    neutral: 'bg-badge-neutral text-badge-neutral-foreground',
  }[type];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls}`}>
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

function Detail({ label, value, highlight, mono }: { label: string; value: string | null | undefined; highlight?: boolean; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono text-xs break-all' : ''} ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-semibold text-foreground">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function fmt(ts: string | null | undefined): string | null {
  if (!ts) return null;
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

export default BookingDetailPanel;
