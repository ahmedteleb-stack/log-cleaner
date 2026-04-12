import { useState } from 'react';
import { FlattenedIntegrationEntry } from '@/lib/integrationParser';
import { AlertTriangle, Code, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

interface IntegrationRowDetailProps {
  entry: FlattenedIntegrationEntry;
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
      <span className="text-muted-foreground shrink-0 min-w-[120px]">{label}:</span>
      <span className={`text-foreground break-all ${mono ? 'font-mono' : ''}`}>{String(value)}</span>
    </div>
  );
};

const fmtAmount = (v?: number, currency?: string) => {
  if (v === undefined || v === null || v === 0) return '';
  return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};

const IntegrationRowDetail = ({ entry }: IntegrationRowDetailProps) => {
  const [showRaw, setShowRaw] = useState(false);
  const hasError = entry.hasError || parseInt(entry.status) >= 400;

  const tryFormat = (s: string): string => {
    if (!s) return '';
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
  };

  return (
    <div className="bg-muted/30 border-t border-border">
      <div className="px-6 py-4 space-y-3 max-w-5xl">
        {/* Error banner */}
        {hasError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">Error — {entry.status}</p>
              <p className="text-xs text-destructive/80 mt-1">{entry.errorMessage || 'No error message'}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{getTypeLabel(entry.type)}</span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            entry.method === 'GET' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-warning text-badge-warning-foreground'
          }`}>{entry.method}</span>
          {entry.ipcc && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">IPCC: {entry.ipcc}</span>}
          {entry.integrationType && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">{entry.integrationType}</span>}
          <span className="text-[10px] font-mono text-muted-foreground">{entry.timeInMs}ms</span>
        </div>

        {/* Request metadata */}
        <Section title="Request Info" icon="📡">
          <KV label="IPCC" value={entry.ipcc} />
          <KV label="Integration Type" value={entry.integrationType} />
          <KV label="Validating Airline" value={entry.validatingAirlineCode} />
          <KV label="Marketing Airlines" value={entry.marketingAirlineCodes.join(', ')} />
          <KV label="Operating Airlines" value={entry.operatingAirlineCodes.join(', ')} />
          <KV label="Route Type" value={entry.routeType} />
          <KV label="Departure Countries" value={entry.departureCountryCodes.join(', ')} />
          <KV label="Arrival Countries" value={entry.arrivalCountryCodes.join(', ')} />
          <KV label="Provider Code" value={entry.providerCode} mono />
          <KV label="Fare ID" value={entry.fareId} mono />
          <KV label="MS Fare ID" value={entry.msFareId} mono />
          <KV label="Branded Fare ID" value={entry.brandedFareId} mono />
          <KV label="Wego Ref" value={entry.wegoRef} mono />
          <KV label="Order ID" value={entry.orderId} mono />
          <KV label="Queue Number" value={entry.queueNumber} />
          <KV label="URL" value={entry.url} mono />
        </Section>

        {/* Itinerary */}
        {entry.legs.length > 0 && (
          <Section title={`Itinerary (${entry.legs.length} leg${entry.legs.length > 1 ? 's' : ''}) — ${entry.tripType || ''}`} icon="✈️">
            <KV label="Domestic" value={entry.domesticFlight ? 'Yes' : 'No'} />
            {entry.legs.map((leg, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2.5 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
                  <span>{leg.departureAirportCode} → {leg.arrivalAirportCode}</span>
                </div>
                <KV label="Departure" value={leg.departureDateTime} />
                <KV label="Arrival" value={leg.arrivalDateTime} />
                {leg.segments.length > 0 && (
                  <div className="mt-1 space-y-1.5 pl-3 border-l-2 border-primary/20">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Segments ({leg.segments.length})</p>
                    {leg.segments.map((seg, j) => (
                      <div key={j} className="space-y-0.5 pb-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-foreground">
                            {seg.marketingAirlineCode}{seg.marketingFlightNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{seg.departureAirportCode} → {seg.arrivalAirportCode}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{seg.cabinType}</span>
                        </div>
                        <KV label="Booking Code" value={seg.bookingCode} />
                        <KV label="Fare Basis" value={seg.fareBasisCode} />
                        {seg.operatingAirlineCode !== seg.marketingAirlineCode && (
                          <KV label="Operated by" value={`${seg.operatingAirlineCode}${seg.operatingFlightNumber}`} />
                        )}
                        <KV label="Departure" value={seg.departureDateTime} />
                        <KV label="Arrival" value={seg.arrivalDateTime} />
                        {seg.departureTerminal && <KV label="Terminal" value={seg.departureTerminal} />}
                        {seg.aircraftCode && <KV label="Aircraft" value={seg.aircraftCode} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Branded Fare */}
        {entry.brandedFare && (
          <Section title={`Branded Fare — ${entry.brandedFare.brandName}`} icon="🎫">
            <KV label="Brand" value={`${entry.brandedFare.brandName} (${entry.brandedFare.brandCode})`} />
            <KV label="Type" value={entry.brandedFare.type} />
            <KV label="Refund Type" value={entry.brandedFare.refundType} />
            <KV label="IPCC" value={entry.brandedFare.bookingIpcc} />
            <KV label="Fare ID" value={entry.brandedFare.id} mono />
            <KV label="User Currency" value={`${entry.brandedFare.userCurrencyCode} (FX: ${entry.brandedFare.userCurrencyFx})`} />
            <KV label="Created" value={entry.brandedFare.createdAt} />
            {entry.brandedFare.tags.length > 0 && (
              <div className="text-[10px] text-muted-foreground">
                Tags: {entry.brandedFare.tags.map(t => `${t.type}${t.attributes ? ` (${JSON.stringify(t.attributes)})` : ''}`).join(', ')}
              </div>
            )}

            {/* Booking vs Vendor Price */}
            {entry.brandedFare.bookingPrice && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Booking Price</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <KV label="Total" value={fmtAmount(entry.brandedFare.bookingPrice.totalAmount, entry.brandedFare.bookingPrice.currencyCode)} />
                  <KV label="Total USD" value={fmtAmount(entry.brandedFare.bookingPrice.totalAmountUsd, 'USD')} />
                  <KV label="Base" value={fmtAmount(entry.brandedFare.bookingPrice.baseAmount, entry.brandedFare.bookingPrice.currencyCode)} />
                  <KV label="Tax" value={fmtAmount(entry.brandedFare.bookingPrice.taxAmount, entry.brandedFare.bookingPrice.currencyCode)} />
                  {entry.brandedFare.bookingPrice.adjustedBaseAmountDiff !== undefined && (
                    <KV label="Base Adjustment" value={fmtAmount(entry.brandedFare.bookingPrice.adjustedBaseAmountDiff, entry.brandedFare.bookingPrice.currencyCode)} />
                  )}
                  <KV label="Commission" value={fmtAmount(entry.brandedFare.bookingPrice.commissionAmount, entry.brandedFare.bookingPrice.currencyCode)} />
                </div>
              </div>
            )}
            {entry.brandedFare.vendorPrice && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Vendor Price</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <KV label="Total" value={fmtAmount(entry.brandedFare.vendorPrice.totalAmount, entry.brandedFare.vendorPrice.currencyCode)} />
                  <KV label="Total USD" value={fmtAmount(entry.brandedFare.vendorPrice.totalAmountUsd, 'USD')} />
                  <KV label="Base" value={fmtAmount(entry.brandedFare.vendorPrice.baseAmount, entry.brandedFare.vendorPrice.currencyCode)} />
                  <KV label="Tax" value={fmtAmount(entry.brandedFare.vendorPrice.taxAmount, entry.brandedFare.vendorPrice.currencyCode)} />
                </div>
              </div>
            )}

            {/* Penalties */}
            {entry.brandedFare.penalties.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Penalties</p>
                {entry.brandedFare.penalties.map((p, i) => (
                  <div key={i} className="text-[10px] text-foreground">
                    {p.type} ({p.applicability}): {fmtAmount(p.amount, p.currencyCode)} {p.doable ? '' : '— Not doable'}
                  </div>
                ))}
              </div>
            )}

            {/* Adult Info */}
            {entry.brandedFare.adultInfo && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Adult Pricing</p>
                {entry.brandedFare.adultInfo.bookingPrice && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <KV label="Booking Total" value={fmtAmount(entry.brandedFare.adultInfo.bookingPrice.totalAmount, entry.brandedFare.adultInfo.bookingPrice.currencyCode)} />
                    <KV label="Booking USD" value={fmtAmount(entry.brandedFare.adultInfo.bookingPrice.totalAmountUsd, 'USD')} />
                  </div>
                )}
                {entry.brandedFare.adultInfo.bookingTaxes.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-muted-foreground">Taxes:</p>
                    {entry.brandedFare.adultInfo.bookingTaxes.map((t, i) => (
                      <div key={i} className="text-[10px] text-foreground pl-2">
                        <span className="font-mono mr-1">{t.code}</span> {t.description}: {fmtAmount(t.amount, t.currencyCode)}
                      </div>
                    ))}
                  </div>
                )}
                {entry.brandedFare.adultInfo.fareBasisCodes.length > 0 && (
                  <KV label="Fare Basis" value={entry.brandedFare.adultInfo.fareBasisCodes.join(', ')} mono />
                )}
                {entry.brandedFare.adultInfo.baggages.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-muted-foreground">Baggage:</p>
                    {entry.brandedFare.adultInfo.baggages.map((b, i) => (
                      <div key={i} className="text-[10px] text-foreground pl-2">
                        {b.type}: {b.weight}{b.unit} × {b.pieceCount}pc {b.weightDescription || ''} {b.dimensionDescription || ''}
                      </div>
                    ))}
                  </div>
                )}
                {entry.brandedFare.adultInfo.fees.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-muted-foreground">Fees:</p>
                    {entry.brandedFare.adultInfo.fees.map((f, i) => (
                      <div key={i} className="text-[10px] text-foreground pl-2">{f.type}: {fmtAmount(f.amount, f.currencyCode)}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>
        )}

        {/* SABA Pricing */}
        {entry.saba && (
          <Section title="SABA Pricing" icon="📊">
            <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 mb-2">
              <p className="text-[11px] text-foreground font-medium">{entry.saba.reason}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <KV label="Original Provider" value={entry.saba.originalProviderCode} mono />
              <KV label="Provider Changed" value={entry.saba.providerChanged ? 'Yes' : 'No'} />
              <KV label="Original Price" value={fmtAmount(entry.saba.originalPrice)} />
              <KV label="Original USD" value={fmtAmount(entry.saba.originalPriceUsd, 'USD')} />
              <KV label="Selected Price" value={fmtAmount(entry.saba.selectedPrice)} />
              <KV label="Selected USD" value={fmtAmount(entry.saba.selectedPriceUsd, 'USD')} />
              <KV label="Final Price" value={fmtAmount(entry.saba.finalPrice)} />
              <KV label="Final USD" value={fmtAmount(entry.saba.finalPriceUsd, 'USD')} />
              <KV label="Search Price USD" value={fmtAmount(entry.saba.searchPriceUsd, 'USD')} />
              <KV label="Adjustment" value={fmtAmount(entry.saba.adjustment)} />
              <KV label="Adjustment USD" value={fmtAmount(entry.saba.adjustmentUsd, 'USD')} />
              <KV label="Base Adjust USD" value={fmtAmount(entry.saba.baseAdjustmentUsd, 'USD')} />
              <KV label="E2E Margin USD" value={fmtAmount(entry.saba.endToEndMarginUsd, 'USD')} />
              <KV label="SABA Margin USD" value={fmtAmount(entry.saba.sabaMarginUsd, 'USD')} />
              <KV label="Dynamic Pricing USD" value={fmtAmount(entry.saba.dynamicPricingMarginUsd, 'USD')} />
              <KV label="Global Delta USD" value={fmtAmount(entry.saba.globalSearchDeltaUsd, 'USD')} />
              <KV label="Brand" value={entry.saba.brandName} />
              <KV label="Is Search Fare" value={entry.saba.isSearchFare ? 'Yes' : 'No'} />
              <KV label="Was Adjusted" value={entry.saba.wasAdjusted ? 'Yes' : 'No'} />
              <KV label="Margin ID" value={entry.saba.bookingMarginId} />
            </div>
            {entry.saba.comparedFares.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Compared Fares ({entry.saba.comparedFares.length})</p>
                {entry.saba.comparedFares.map((f, i) => (
                  <div key={i} className="text-[10px] text-foreground flex items-center gap-3 pb-1 border-b border-border/30 last:border-0">
                    <span className="font-mono">{f.providerCode}</span>
                    <span className="text-muted-foreground">{f.integrationType}</span>
                    <span className="font-mono text-primary">{fmtAmount(f.priceUsd, 'USD')}</span>
                    <span className="text-muted-foreground">{fmtAmount(f.price, f.currency)}</span>
                    {f.selected && <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary">Selected</span>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Supplier Segments */}
        {entry.supplierSegments.length > 0 && (
          <Section title={`Supplier Segments (${entry.supplierSegments.length})`} icon="🔧" defaultOpen={false}>
            {entry.supplierSegments.map((seg, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">{seg.carrier}{seg.flightNumber}</span>
                  <span className="text-[10px] text-muted-foreground">{seg.origin} → {seg.destination}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Class: {seg.classOfService}</span>
                </div>
                <KV label="Departure" value={seg.departureTime} />
                <KV label="Arrival" value={seg.arrivalTime} />
                <KV label="Flight Time" value={`${seg.flightTime} min`} />
                <KV label="Distance" value={`${seg.distance} mi`} />
                {seg.equipment && <KV label="Equipment" value={seg.equipment} />}
                {seg.operatingCarrier && <KV label="Operated by" value={`${seg.operatingCarrier} (${seg.operatingCarrierName})`} />}
              </div>
            ))}
          </Section>
        )}

        {/* Supplier Solution */}
        {entry.supplierSolution && (
          <Section title="Supplier Solution" icon="💰" defaultOpen={false}>
            <KV label="Total Price" value={entry.supplierSolution.totalPrice} mono />
            <KV label="Base Price" value={entry.supplierSolution.basePrice} mono />
            <KV label="Taxes" value={entry.supplierSolution.taxes} mono />
            <KV label="Fees" value={entry.supplierSolution.fees} mono />
            <KV label="Pricing Method" value={entry.supplierSolution.pricingMethod} />
            <KV label="Refundable" value={entry.supplierSolution.refundable !== undefined ? (entry.supplierSolution.refundable ? 'Yes' : 'No') : ''} />
            <KV label="Exchangeable" value={entry.supplierSolution.exchangeable !== undefined ? (entry.supplierSolution.exchangeable ? 'Yes' : 'No') : ''} />
            <KV label="Fare Calc" value={entry.supplierSolution.fareCalc} mono />
            <KV label="Last Ticketing" value={entry.supplierSolution.latestTicketingTime} />
            {entry.supplierSolution.cancelPenalties.length > 0 && (
              <div className="text-[10px] text-foreground">
                Cancel: {entry.supplierSolution.cancelPenalties.map(p => `${p.amount} (${p.application})`).join(', ')}
              </div>
            )}
            {entry.supplierSolution.changePenalties.length > 0 && (
              <div className="text-[10px] text-foreground">
                Change: {entry.supplierSolution.changePenalties.map(p => `${p.amount} (${p.application})`).join(', ')}
              </div>
            )}
            {entry.supplierSolution.taxInfos.length > 0 && (
              <div className="mt-1 pt-1 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">Tax Breakdown:</p>
                {entry.supplierSolution.taxInfos.map((t, i) => (
                  <div key={i} className="text-[10px] text-foreground pl-2">
                    <span className="font-mono mr-1">{t.category}</span> {t.description}: {t.amount}
                  </div>
                ))}
              </div>
            )}
            {entry.supplierSolution.baggageAllowance.length > 0 && <KV label="Checked Bag" value={entry.supplierSolution.baggageAllowance.join(', ')} />}
            {entry.supplierSolution.carryOnAllowance.length > 0 && <KV label="Carry-on" value={entry.supplierSolution.carryOnAllowance.join(', ')} />}
          </Section>
        )}

        {/* Search Context */}
        {entry.searchContext && (
          <Section title="Search Context" icon="🔍">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <KV label="Search ID" value={entry.searchContext.searchId} mono />
              <KV label="Trip Type" value={entry.searchContext.tripType} />
              <KV label="Cabin" value={entry.searchContext.cabinType} />
              <KV label="Adults" value={entry.searchContext.adultsCount} />
              <KV label="Children" value={entry.searchContext.childrenCount} />
              <KV label="Infants" value={entry.searchContext.infantsCount} />
              <KV label="Site Code" value={entry.searchContext.siteCode} />
              <KV label="Locale" value={entry.searchContext.locale} />
              <KV label="App Type" value={entry.searchContext.appType} />
              {entry.searchContext.appBuild && <KV label="App Build" value={entry.searchContext.appBuild} />}
              <KV label="Device" value={entry.searchContext.deviceType} />
              <KV label="Logged In" value={entry.searchContext.userLoggedIn ? 'Yes' : 'No'} />
              {entry.searchContext.outboundDates.length > 0 && <KV label="Dates" value={entry.searchContext.outboundDates.join(', ')} />}
              <KV label="Created" value={entry.searchContext.createdAt} />
            </div>
          </Section>
        )}

        {/* Contact */}
        {entry.contact && (
          <Section title="Contact" icon="📧">
            <KV label="Full Name" value={entry.contact.fullName} />
            <KV label="Email" value={entry.contact.email} />
            <KV label="Phone" value={`+${entry.contact.phonePrefix} ${entry.contact.phoneNumber}`} />
            <KV label="Country" value={entry.contact.countryCode} />
          </Section>
        )}

        {/* Dynamic Forms */}
        {entry.dynamicForms.length > 0 && (
          <Section title={`Dynamic Forms (${entry.dynamicForms.length})`} icon="📋">
            {entry.dynamicForms.map((df, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2 space-y-0.5">
                <KV label="Required Document" value={df.requiredDocument} />
                <KV label="Required Fields" value={df.requiredFields.join(', ')} />
                {df.optionalFields.length > 0 && <KV label="Optional Fields" value={df.optionalFields.join(', ')} />}
                <KV label="Pax Types" value={df.conditionalPassengerTypes.join(', ')} />
                <KV label="Route Types" value={df.routeTypes.join(', ')} />
                <KV label="Nationalities" value={`${df.conditionalNationalitiesCount} countries`} />
              </div>
            ))}
          </Section>
        )}

        {/* Revalidation Brands */}
        {entry.revalidationBrands.length > 0 && (
          <Section title={`Revalidation Results (${entry.revalidationBrands.length})`} icon="🎫">
            {entry.revalidationBrands.map((rb, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2.5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">{rb.brandName || 'Unnamed'}</span>
                  {rb.brandCode && <span className="text-[10px] font-mono text-muted-foreground">({rb.brandCode})</span>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{rb.refundType}</span>
                  <span className="text-[10px] text-muted-foreground">{rb.integrationType}</span>
                </div>
                {rb.price && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <KV label="Total" value={fmtAmount(rb.price.totalAmount, rb.price.currencyCode)} />
                    <KV label="Total USD" value={fmtAmount(rb.price.totalAmountUsd, 'USD')} />
                    <KV label="Base" value={fmtAmount(rb.price.baseAmount, rb.price.currencyCode)} />
                    <KV label="Tax" value={fmtAmount(rb.price.taxAmount, rb.price.currencyCode)} />
                  </div>
                )}
                {rb.adultTaxes.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Taxes: {rb.adultTaxes.map(t => `${t.code}: ${fmtAmount(t.amount, t.currencyCode)}`).join(' · ')}
                  </div>
                )}
                {rb.penalties.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Penalties: {rb.penalties.map(p => `${p.type} (${p.applicability}): ${fmtAmount(p.amount, p.currencyCode)}`).join(' · ')}
                  </div>
                )}
                {rb.baggages.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Baggage: {rb.baggages.map(b => `${b.type}: ${b.weight}${b.unit} ×${b.pieceCount}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Insurance */}
        {entry.insurancePackages.length > 0 && (
          <Section title={`Insurance (${entry.insurancePackages.length})`} icon="🛡️">
            {entry.insurancePackages.map((ins, i) => (
              <div key={i} className="border border-border/50 rounded-md p-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">{ins.title || ins.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    ins.status === 'CONFIRMED' ? 'bg-badge-success/20 text-badge-success-foreground' : 'bg-muted text-muted-foreground'
                  }`}>{ins.status}</span>
                </div>
                <KV label="Type" value={ins.type} />
                <KV label="Supplier" value={ins.supplier} />
                <KV label="Amount" value={fmtAmount(ins.totalAmount, ins.currencyCode)} />
                <KV label="Tax" value={fmtAmount(ins.totalTaxAmount, ins.currencyCode)} />
                <KV label="USD" value={fmtAmount(ins.totalAmountUsd, 'USD')} />
                {ins.confirmedOn && <KV label="Confirmed" value={ins.confirmedOn} />}
                {ins.passengerNames.length > 0 && <KV label="Passengers" value={ins.passengerNames.join(', ')} />}
                {ins.cancellable !== undefined && <KV label="Cancellable" value={ins.cancellable ? 'Yes' : 'No'} />}
              </div>
            ))}
          </Section>
        )}

        {/* Airline Disclaimers */}
        {entry.airlineDisclaimers.length > 0 && (
          <Section title="Airline Disclaimers" icon="⚠️" defaultOpen={false}>
            {entry.airlineDisclaimers.map((d, i) => (
              <p key={i} className="text-[10px] text-foreground leading-relaxed">{d.replace(/<[^>]+>/g, '')}</p>
            ))}
          </Section>
        )}

        {/* Context row */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground">Requested: {entry.requestedAt}</span>
          <span className="text-[10px] text-muted-foreground">⏱ {entry.timeInMs}ms</span>
          {entry.providerBrandedFaresCount !== '0' && <span className="text-[10px] text-muted-foreground">Branded Fares: {entry.providerBrandedFaresCount}</span>}
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
            {entry.hasError && entry.errorMessage && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">Error</p>
                <pre className="bg-destructive/5 border border-destructive/20 rounded-md p-3 text-[10px] font-mono text-destructive overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {entry.errorMessage}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INTEGRATION_DYNAMIC_FORMS: '📋 Dynamic Forms',
    INTEGRATION_REVALIDATION: '🎫 Revalidation',
    INTEGRATION_BOOKING: '✅ Booking',
    VAS_INSURANCE_CONFIRM: '🛡️ Insurance Confirm',
    VAS_INSURANCE: '🛡️ Insurance',
    INTEGRATION_TICKETING: '🎟️ Ticketing',
    INTEGRATION_VOID: '❌ Void',
    INTEGRATION_CANCEL: '🚫 Cancel',
    INTEGRATION_QUEUE_PLACE: '📥 Queue Place',
    INTEGRATION_PNR_RETRIEVE: '🔄 PNR Retrieve',
  };
  return labels[type] || `📄 ${type}`;
}

export default IntegrationRowDetail;
