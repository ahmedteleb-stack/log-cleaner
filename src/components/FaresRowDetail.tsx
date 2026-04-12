import { useState } from 'react';
import { FlattenedFareEntry } from '@/lib/faresParser';
import { ActionMapping, ExtractedDetails } from '@/lib/faresActionMapper';
import { AlertTriangle, Code, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

interface FaresRowDetailProps {
  entry: FlattenedFareEntry;
  action: ActionMapping;
  details: ExtractedDetails;
  defaultShowRaw: boolean;
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

const KV = ({ label, value, mono }: { label: string; value?: string | number | boolean | null; mono?: boolean }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex gap-2 text-[11px]">
      <span className="text-muted-foreground shrink-0 min-w-[100px]">{label}:</span>
      <span className={`text-foreground break-all ${mono ? 'font-mono' : ''}`}>{String(value)}</span>
    </div>
  );
};

const FaresRowDetail = ({ entry, action, details, defaultShowRaw }: FaresRowDetailProps) => {
  const [showRaw, setShowRaw] = useState(defaultShowRaw);
  const hasError = entry.hasError || parseInt(entry.statuscode) >= 400;

  const tryFormat = (s: string): string => {
    if (!s) return '';
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
  };

  const fmtAmount = (v?: number, currency?: string) => {
    if (v === undefined || v === null) return '';
    return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();
  };

  return (
    <div className="bg-muted/30 border-t border-border">
      <div className="px-6 py-4 space-y-3 max-w-5xl">
        {/* Error banner */}
        {hasError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">Error — {entry.statuscode}</p>
              <p className="text-xs text-destructive/80 mt-1">{entry.errorMessage || 'No error message available'}</p>
            </div>
          </div>
        )}

        {/* Action header */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{action.icon}</span>
          <span className="text-sm font-semibold text-foreground">{action.label}</span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            entry.method === 'GET' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-warning text-badge-warning-foreground'
          }`}>{entry.method}</span>
          {details.bookingRef && <span className="text-[10px] font-mono text-primary ml-2">Ref: {details.bookingRef}</span>}
          {details.paymentOrderId && <span className="text-[10px] font-mono text-muted-foreground ml-1">Order: {details.paymentOrderId}</span>}
        </div>

        {/* Passengers */}
        {details.passengers && details.passengers.length > 0 && (
          <Section title={`Passengers (${details.passengers.length})`} icon="👤">
            {details.passengers.map((p, i) => (
              <div key={i} className="border-b border-border/50 last:border-0 pb-2 last:pb-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">{p.firstName} {p.middleName} {p.lastName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p.type}</span>
                  {p.gender && <span className="text-[10px] text-muted-foreground">{p.gender}</span>}
                </div>
                <KV label="Date of Birth" value={p.dateOfBirth} />
                <KV label="Nationality" value={p.nationality} />
                <KV label="Document" value={p.documentType && p.documentId ? `${p.documentType}: ${p.documentId}` : ''} mono />
                {p.documentExpiry && <KV label="Doc Expiry" value={p.documentExpiry} />}
                {p.passengerId && <KV label="Passenger ID" value={p.passengerId} mono />}
                {p.frequentFlyers && p.frequentFlyers.length > 0 && <KV label="Frequent Flyers" value={p.frequentFlyers.join(', ')} />}
              </div>
            ))}
          </Section>
        )}

        {/* Contact */}
        {details.contact && (
          <Section title="Contact" icon="📧">
            <KV label="Full Name" value={details.contact.fullName} />
            <KV label="Email" value={details.contact.email} />
            <KV label="Phone" value={`+${details.contact.phonePrefix} ${details.contact.phoneNumber}`} />
            <KV label="Country" value={details.contact.phoneCountryCode} />
          </Section>
        )}

        {/* Itinerary / Legs */}
        {details.legs && details.legs.length > 0 && (
          <Section title={`Itinerary (${details.legs.length} leg${details.legs.length > 1 ? 's' : ''})`} icon="✈️">
            {details.legs.map((leg, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2.5 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">
                    {leg.departureAirportCode} → {leg.arrivalAirportCode}
                  </span>
                  {leg.airlineCodes && leg.airlineCodes.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{leg.airlineCodes.join(', ')}</span>
                  )}
                  {leg.duration && <span className="text-[10px] text-muted-foreground">⏱ {leg.duration}</span>}
                  {leg.stopoversCount !== undefined && leg.stopoversCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge-warning/20 text-badge-warning-foreground">{leg.stopoversCount} stop(s)</span>
                  )}
                  {leg.scheduleChangeType && leg.scheduleChangeType !== 'NONE' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">⚠ {leg.scheduleChangeType}</span>
                  )}
                </div>
                <KV label="Departure" value={leg.departureDateTime || leg.departureTime} />
                <KV label="Arrival" value={leg.arrivalDateTime || leg.arrivalTime} />

                {/* Segments */}
                {leg.segments.length > 0 && (
                  <div className="mt-1 space-y-1.5 pl-3 border-l-2 border-primary/20">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Segments</p>
                    {leg.segments.map((seg, j) => (
                      <div key={j} className="space-y-0.5 pb-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-foreground">
                            {seg.designatorCode || `${seg.marketingAirlineCode}${seg.marketingFlightNumber}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{seg.departureAirportCode} → {seg.arrivalAirportCode}</span>
                          {seg.cabin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{seg.cabin}</span>}
                        </div>
                        {seg.marketingAirlineName && <KV label="Airline" value={seg.marketingAirlineName} />}
                        {seg.departureCityName && <KV label="From" value={`${seg.departureCityName} (${seg.departureAirportName || seg.departureAirportCode}), ${seg.departureCountryCode}`} />}
                        {seg.arrivalCityName && <KV label="To" value={`${seg.arrivalCityName} (${seg.arrivalAirportName || seg.arrivalAirportCode}), ${seg.arrivalCountryCode}`} />}
                        <KV label="Departure" value={seg.departureDateTime || seg.departureTime} />
                        <KV label="Arrival" value={seg.arrivalDateTime} />
                        {seg.duration && <KV label="Duration" value={seg.duration} />}
                        {seg.durationMinutes && <KV label="Duration (min)" value={seg.durationMinutes} />}
                        {seg.overnight && <KV label="Overnight" value="Yes" />}
                        {seg.stopoverDurationMinutes !== undefined && seg.stopoverDurationMinutes > 0 && <KV label="Stopover" value={`${seg.stopoverDurationMinutes} min`} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Price changed */}
        {details.priceChanged !== undefined && (
          <div className={`text-[11px] px-3 py-2 rounded-md border ${details.priceChanged ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-badge-success/10 border-badge-success/30 text-badge-success-foreground'}`}>
            {details.priceChanged
              ? `⚠️ Price changed: ${fmtAmount(details.oldPrice, details.price?.currencyCode)} → ${fmtAmount(details.newPrice, details.price?.currencyCode)}`
              : `✅ Price unchanged: ${fmtAmount(details.price?.totalAmount, details.price?.currencyCode)}`
            }
          </div>
        )}

        {/* Price */}
        {details.price && (
          <Section title="Price Breakdown" icon="💰">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <KV label="Total" value={fmtAmount(details.price.totalAmount, details.price.currencyCode)} />
              <KV label="Total (USD)" value={fmtAmount(details.price.totalAmountUsd, 'USD')} />
              <KV label="Base" value={fmtAmount(details.price.totalOriginalAmount, details.price.currencyCode)} />
              <KV label="Base (USD)" value={fmtAmount(details.price.totalOriginalAmountUsd, 'USD')} />
              <KV label="Tax" value={fmtAmount(details.price.totalTaxAmount, details.price.currencyCode)} />
              <KV label="Tax (USD)" value={fmtAmount(details.price.totalTaxAmountUsd, 'USD')} />
              <KV label="Booking Fee" value={fmtAmount(details.price.totalBookingFee, details.price.currencyCode)} />
              <KV label="Insurance" value={fmtAmount(details.price.totalInsuranceAmount, details.price.currencyCode)} />
              <KV label="Seats" value={fmtAmount(details.price.totalSeatAmount, details.price.currencyCode)} />
              <KV label="Meals" value={fmtAmount(details.price.totalMealAmount, details.price.currencyCode)} />
              <KV label="Baggage" value={fmtAmount(details.price.totalBaggageAmount, details.price.currencyCode)} />
            </div>
            {details.price.taxes && details.price.taxes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Taxes</p>
                {details.price.taxes.map((t, i) => (
                  <div key={i} className="text-[10px] text-foreground">
                    {t.code && <span className="font-mono mr-1">{t.code}</span>}
                    {t.description} — {fmtAmount(t.amount, t.currencyCode)}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Branded Fares */}
        {details.brandedFares && details.brandedFares.length > 0 && (
          <Section title={`Branded Fares (${details.brandedFares.length})`} icon="🎫">
            {details.brandedFares.map((bf, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2.5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">{bf.brandName}</span>
                  <span className="text-[10px] text-muted-foreground">Leg {bf.legId}</span>
                  <span className="text-[10px] font-mono text-primary">{fmtAmount(bf.totalAmount, bf.currencyCode)}</span>
                  {bf.refundType && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{bf.refundType}</span>}
                </div>
                <KV label="Fare ID" value={bf.id} mono />
                {bf.penalties && bf.penalties.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Penalties: {bf.penalties.map(p => `${p.type}: ${fmtAmount(p.amount, p.currencyCode)}`).join(' · ')}
                  </div>
                )}
                {bf.passengerInfos && bf.passengerInfos.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Per pax: {bf.passengerInfos.map(pi => `${pi.type}: ${fmtAmount(pi.amount, pi.currencyCode)} (tax: ${fmtAmount(pi.taxAmount, pi.currencyCode)})`).join(' · ')}
                  </div>
                )}
                {bf.baggages && bf.baggages.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Baggage: {bf.baggages.map(b => `${b.weightText || `${b.weight}${b.unit}`} ${b.included ? '(included)' : ''}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Seat Assignments */}
        {details.seatAssignments && details.seatAssignments.length > 0 && (
          <Section title={`Seat Assignments (${details.seatAssignments.length})`} icon="💺">
            {details.seatAssignments.map((sa, i) => (
              <div key={i} className="text-[11px] text-foreground">
                <span className="font-mono text-muted-foreground">{sa.segmentId}</span>: <span className="font-semibold">{formatPassengerId(sa.passengerId)}</span> → Seat <span className="font-semibold text-primary">{sa.seatNumber}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Insurance */}
        {details.insurances && details.insurances.length > 0 && (
          <Section title={`Insurance (${details.insurances.length})`} icon="🛡️">
            {details.insurances.map((ins, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">{ins.title || ins.type}</span>
                  <span className="text-[10px] font-mono text-primary">{fmtAmount(ins.amount, ins.currency)}</span>
                </div>
                <KV label="Type" value={ins.type} />
                <KV label="Supplier" value={ins.supplier} />
                {ins.supplierProvider && <KV label="Provider" value={ins.supplierProvider} />}
                {ins.amountUsd !== undefined && <KV label="USD" value={fmtAmount(ins.amountUsd, 'USD')} />}
                {ins.taxAmount !== undefined && <KV label="Tax" value={fmtAmount(ins.taxAmount, ins.currency)} />}
              </div>
            ))}
          </Section>
        )}

        {/* Payment Methods */}
        {details.paymentMethods && details.paymentMethods.length > 0 && (
          <Section title={`Payment Methods (${details.paymentMethods.length})`} icon="💳">
            <div className="space-y-1.5">
              {details.paymentMethods.map((pm, i) => (
                <div key={i} className="flex items-center gap-3 text-[11px]">
                  <span className="font-semibold text-foreground min-w-[120px]">{pm.name}</span>
                  <span className="font-mono text-muted-foreground">{pm.code}</span>
                  <span className="text-muted-foreground">{pm.cardType}</span>
                  <span className="text-muted-foreground">Fee: {fmtAmount(pm.feeAmount, pm.feeCurrency)} ({pm.feePercentage}%)</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Payment */}
        {details.payment && (
          <Section title="Payment" icon="💰">
            <KV label="Method" value={details.payment.paymentMethodCode} />
            <KV label="Scheme" value={details.payment.scheme} />
            <KV label="Card Type" value={details.payment.cardType} />
            <KV label="Amount" value={fmtAmount(details.payment.amount, details.payment.currencyCode)} />
            <KV label="Amount (cents)" value={details.payment.amountInCents} />
            <KV label="Status" value={details.payment.status} />
            <KV label="3DS" value={details.payment.threeDsEnabled !== undefined ? (details.payment.threeDsEnabled ? 'Enabled' : 'Disabled') : ''} />
            <KV label="Created" value={details.payment.createdAt} />
          </Section>
        )}

        {/* Order Items */}
        {details.orderItems && details.orderItems.length > 0 && (
          <Section title={`Order Items (${details.orderItems.length})`} icon="📋">
            {details.orderItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px] border-b border-border/30 last:border-0 pb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.type}</span>
                <span className="text-foreground flex-1">{item.name}</span>
                <span className="font-mono text-primary">{fmtAmount(item.price, item.currency)}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Policy */}
        {details.policy && (
          <Section title="Policy" icon="📜" defaultOpen={false}>
            {details.policy.baggageDescs && details.policy.baggageDescs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Baggage Allowances</p>
                {details.policy.baggageDescs.map((b, i) => (
                  <div key={i} className="text-[10px] text-foreground">
                    {b.type}: {b.weightText || `${b.weight || '—'}${b.unit || ''}`} {b.pieceCount !== undefined ? `(${b.pieceCount} pc)` : ''} {b.included ? '✅ Included' : ''}
                  </div>
                ))}
              </div>
            )}
            {details.policy.feeDescs && details.policy.feeDescs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Fees</p>
                {details.policy.feeDescs.map((f, i) => (
                  <div key={i} className="text-[10px] text-foreground">{f.type}: {f.amount}</div>
                ))}
              </div>
            )}
            <KV label="Fare Rules" value={details.policy.hasFlightFareRules ? `${details.policy.fareRulesCount} rule(s)` : 'None'} />
            <KV label="T&C" value={details.policy.hasTermsAndConditions ? 'Yes' : 'No'} />
            <KV label="Airline Disclaimers" value={details.policy.hasAirlineDisclaimers ? 'Yes' : 'No'} />
          </Section>
        )}

        {/* Partner PNR Status */}
        {details.partnerPnrStatus && (
          <Section title="Partner PNR Status" icon="🔗">
            <KV label="Booking Status" value={details.partnerPnrStatus.overallBookingStatus} />
            <KV label="Ticket Status" value={details.partnerPnrStatus.overallTicketStatus} />
            <KV label="Schedule Change" value={details.partnerPnrStatus.hasScheduleChange ? 'Yes' : 'No'} />
            <KV label="Last Synced" value={details.partnerPnrStatus.lastSyncedAt} />
            {details.partnerPnrStatus.segments.length > 0 && (
              <div className="mt-1 space-y-1">
                {details.partnerPnrStatus.segments.map((seg, i) => (
                  <div key={i} className="text-[10px] text-foreground">
                    {seg.marketingAirlineCode}{seg.marketingFlightNumber} {seg.departureAirportCode}→{seg.arrivalAirportCode}: {seg.statusLabel || '—'} / {seg.segmentTicketStatus || '—'}
                    {seg.hasScheduleChange && <span className="text-destructive ml-1">⚠ {seg.changeType}</span>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Status info */}
        {details.responseCode && <KV label="Response Code" value={details.responseCode} />}
        {details.expiredAt && <KV label="Expires" value={new Date(details.expiredAt).toLocaleString()} />}

        {/* Fallback summary lines */}
        {details.summaryLines && details.summaryLines.length > 0 && (
          <div className="space-y-1">
            {details.summaryLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>
        )}

        {/* Context row */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          {entry.country && <span className="text-[10px] text-muted-foreground">🌍 {entry.country} · {entry.city}</span>}
          {entry.deviceInfo && entry.deviceInfo !== '—' && <span className="text-[10px] text-muted-foreground">📱 {entry.deviceInfo}</span>}
          {entry.msfareid && <span className="text-[10px] text-muted-foreground font-mono">ID: {entry.msfareid}</span>}
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
            {entry.hasError && entry._raw?.error && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">Error</p>
                <pre className="bg-destructive/5 border border-destructive/20 rounded-md p-3 text-[10px] font-mono text-destructive overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {entry._raw.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function formatPassengerId(id: string): string {
  if (!id) return 'Unknown';
  const parts = id.split(':');
  const raw = parts[0] || '';
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)/g, ' $1').trim();
}

export default FaresRowDetail;
