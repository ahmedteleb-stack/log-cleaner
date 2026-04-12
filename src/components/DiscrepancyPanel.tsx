import { useMemo, useState } from 'react';
import { FlattenedIntegrationEntry } from '@/lib/integrationParser';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface DiscrepancyPanelProps {
  entries: FlattenedIntegrationEntry[];
}

interface SegmentComparison {
  segmentIndex: number;
  legIndex: number;
  field: string;
  label: string;
  quoted: string;
  booked: string;
  match: boolean;
}

interface LegComparison {
  legIndex: number;
  quoted: { dep: string; arr: string; depTime: string; arrTime: string };
  booked: { dep: string; arr: string; depTime: string; arrTime: string };
  routeMatch: boolean;
  segments: SegmentComparison[];
}

/**
 * Extracts comparable data from the revalidation response (what customer was quoted)
 * and the booking request (what was actually sent to the supplier).
 */
function extractQuotedData(revalEntry: FlattenedIntegrationEntry) {
  // Revalidation brands carry the pricing/brand info from the response
  const brand = revalEntry.revalidationBrands[0];
  const legs = revalEntry.legs;
  return {
    legs,
    brandName: brand?.brandName || revalEntry.brandedFare?.brandName || '',
    price: brand?.price || revalEntry.brandedFare?.bookingPrice,
    refundType: brand?.refundType || revalEntry.brandedFare?.refundType || '',
  };
}

function extractBookedData(bookingEntry: FlattenedIntegrationEntry) {
  const legs = bookingEntry.legs;
  return {
    legs,
    brandName: bookingEntry.brandedFare?.brandName || '',
    price: bookingEntry.brandedFare?.bookingPrice,
    refundType: bookingEntry.brandedFare?.refundType || '',
  };
}

function formatDateTime(dt: string): string {
  if (!dt) return '—';
  try {
    const d = new Date(dt);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dt; }
}

function formatDate(dt: string): string {
  if (!dt) return '—';
  try {
    const d = new Date(dt);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return dt; }
}

function fmtAmount(v?: number, currency?: string) {
  if (v === undefined || v === null || v === 0) return '—';
  return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();
}

const CompareRow = ({ label, quoted, booked, match, icon }: { label: string; quoted: string; booked: string; match: boolean; icon?: string }) => (
  <tr className={`${match ? '' : 'bg-destructive/5'}`}>
    <td className="px-3 py-2 text-[11px] text-muted-foreground font-medium whitespace-nowrap">
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </td>
    <td className="px-3 py-2 text-[11px] font-mono text-foreground">{quoted || '—'}</td>
    <td className="px-3 py-2 text-[11px] font-mono text-foreground">{booked || '—'}</td>
    <td className="px-3 py-2 text-center">
      {match ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-500 inline-block" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-destructive inline-block" />
      )}
    </td>
  </tr>
);

const DiscrepancyPanel = ({ entries }: DiscrepancyPanelProps) => {
  const [expanded, setExpanded] = useState(true);

  // Find the revalidation and booking entries
  const analysis = useMemo(() => {
    const revalEntries = entries.filter(e => e.type === 'INTEGRATION_REVALIDATION');
    const bookingEntries = entries.filter(e => e.type === 'INTEGRATION_BOOKING');

    if (revalEntries.length === 0 || bookingEntries.length === 0) return null;

    // Use the last successful revalidation (closest to booking time)
    const reval = revalEntries.filter(e => !e.hasError).pop() || revalEntries[revalEntries.length - 1];
    const booking = bookingEntries[0]; // First booking attempt

    const quotedData = extractQuotedData(reval);
    const bookedData = extractBookedData(booking);

    const comparisons: LegComparison[] = [];
    const maxLegs = Math.max(quotedData.legs.length, bookedData.legs.length);

    let totalMismatches = 0;
    let totalChecks = 0;

    for (let li = 0; li < maxLegs; li++) {
      const qLeg = quotedData.legs[li];
      const bLeg = bookedData.legs[li];

      const qDep = qLeg?.departureAirportCode || '—';
      const qArr = qLeg?.arrivalAirportCode || '—';
      const bDep = bLeg?.departureAirportCode || '—';
      const bArr = bLeg?.arrivalAirportCode || '—';
      const routeMatch = qDep === bDep && qArr === bArr;

      totalChecks++;
      if (!routeMatch) totalMismatches++;

      const segments: SegmentComparison[] = [];
      const qSegs = qLeg?.segments || [];
      const bSegs = bLeg?.segments || [];
      const maxSegs = Math.max(qSegs.length, bSegs.length);

      for (let si = 0; si < maxSegs; si++) {
        const qs = qSegs[si];
        const bs = bSegs[si];

        // Marketing airline
        const qAirline = qs ? `${qs.marketingAirlineCode}${qs.marketingFlightNumber}` : '—';
        const bAirline = bs ? `${bs.marketingAirlineCode}${bs.marketingFlightNumber}` : '—';
        const airlineMatch = qAirline === bAirline;
        totalChecks++;
        if (!airlineMatch) totalMismatches++;

        segments.push({
          segmentIndex: si, legIndex: li,
          field: 'airline',
          label: `Marketing Airline (Seg ${si + 1})`,
          quoted: qAirline, booked: bAirline,
          match: airlineMatch,
        });

        // Operating airline
        const qOpAirline = qs ? `${qs.operatingAirlineCode || qs.marketingAirlineCode}${qs.operatingFlightNumber || qs.marketingFlightNumber}` : '—';
        const bOpAirline = bs ? `${bs.operatingAirlineCode || bs.marketingAirlineCode}${bs.operatingFlightNumber || bs.marketingFlightNumber}` : '—';
        const opMatch = qOpAirline === bOpAirline;
        totalChecks++;
        if (!opMatch) totalMismatches++;

        segments.push({
          segmentIndex: si, legIndex: li,
          field: 'operatingAirline',
          label: `Operated By (Seg ${si + 1})`,
          quoted: qOpAirline, booked: bOpAirline,
          match: opMatch,
        });

        // Departure DateTime
        const qDepDT = qs?.departureDateTime || '—';
        const bDepDT = bs?.departureDateTime || '—';
        const depMatch = qDepDT === bDepDT;
        totalChecks++;
        if (!depMatch) totalMismatches++;

        segments.push({
          segmentIndex: si, legIndex: li,
          field: 'departureDateTime',
          label: `Departure (Seg ${si + 1})`,
          quoted: formatDateTime(qDepDT), booked: formatDateTime(bDepDT),
          match: depMatch,
        });

        // Arrival DateTime
        const qArrDT = qs?.arrivalDateTime || '—';
        const bArrDT = bs?.arrivalDateTime || '—';
        const arrMatch = qArrDT === bArrDT;
        totalChecks++;
        if (!arrMatch) totalMismatches++;

        segments.push({
          segmentIndex: si, legIndex: li,
          field: 'arrivalDateTime',
          label: `Arrival (Seg ${si + 1})`,
          quoted: formatDateTime(qArrDT), booked: formatDateTime(bArrDT),
          match: arrMatch,
        });

        // Cabin
        const qCabin = qs?.cabinType || '—';
        const bCabin = bs?.cabinType || '—';
        const cabinMatch = qCabin === bCabin;
        totalChecks++;
        if (!cabinMatch) totalMismatches++;

        segments.push({
          segmentIndex: si, legIndex: li,
          field: 'cabin',
          label: `Cabin (Seg ${si + 1})`,
          quoted: qCabin, booked: bCabin,
          match: cabinMatch,
        });

        // Route per segment
        const qSegRoute = qs ? `${qs.departureAirportCode} → ${qs.arrivalAirportCode}` : '—';
        const bSegRoute = bs ? `${bs.departureAirportCode} → ${bs.arrivalAirportCode}` : '—';
        const segRouteMatch = qSegRoute === bSegRoute;
        totalChecks++;
        if (!segRouteMatch) totalMismatches++;

        segments.push({
          segmentIndex: si, legIndex: li,
          field: 'segmentRoute',
          label: `Route (Seg ${si + 1})`,
          quoted: qSegRoute, booked: bSegRoute,
          match: segRouteMatch,
        });
      }

      comparisons.push({
        legIndex: li,
        quoted: {
          dep: qDep,
          arr: qArr,
          depTime: qLeg?.departureDateTime || '—',
          arrTime: qLeg?.arrivalDateTime || '—',
        },
        booked: {
          dep: bDep,
          arr: bArr,
          depTime: bLeg?.departureDateTime || '—',
          arrTime: bLeg?.arrivalDateTime || '—',
        },
        routeMatch,
        segments,
      });
    }

    // Price comparison
    const qPrice = quotedData.price;
    const bPrice = bookedData.price;
    const priceMatch = qPrice && bPrice
      ? qPrice.totalAmount === bPrice.totalAmount && qPrice.currencyCode === bPrice.currencyCode
      : !qPrice && !bPrice;
    totalChecks++;
    if (!priceMatch) totalMismatches++;

    // Brand / Refund comparison
    const brandMatch = quotedData.brandName === bookedData.brandName || (!quotedData.brandName && !bookedData.brandName);
    totalChecks++;
    if (!brandMatch) totalMismatches++;

    return {
      reval,
      booking,
      comparisons,
      priceMatch,
      brandMatch,
      quotedPrice: qPrice ? fmtAmount(qPrice.totalAmount, qPrice.currencyCode) : '—',
      bookedPrice: bPrice ? fmtAmount(bPrice.totalAmount, bPrice.currencyCode) : '—',
      quotedBrand: quotedData.brandName || '—',
      bookedBrand: bookedData.brandName || '—',
      quotedRefund: quotedData.refundType || '—',
      bookedRefund: bookedData.refundType || '—',
      totalMismatches,
      totalChecks,
      hasBookingError: booking.hasError || !!booking.responseError,
    };
  }, [entries]);

  if (!analysis) return null;

  const hasMismatches = analysis.totalMismatches > 0;

  return (
    <div className={`rounded-lg border-2 overflow-hidden ${
      hasMismatches
        ? 'border-destructive/40 bg-destructive/5'
        : analysis.hasBookingError
        ? 'border-destructive/40 bg-destructive/5'
        : 'border-green-500/40 bg-green-500/5'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Booking Discrepancy Check
          </span>
          {hasMismatches ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive">
              <AlertTriangle className="w-3 h-3" />
              {analysis.totalMismatches} mismatch{analysis.totalMismatches > 1 ? 'es' : ''} found
            </span>
          ) : analysis.hasBookingError ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive">
              <AlertTriangle className="w-3 h-3" />
              Booking failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-600">
              <CheckCircle className="w-3 h-3" />
              All fields match
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {analysis.totalChecks} checks
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Booking error banner */}
          {analysis.hasBookingError && analysis.booking.responseError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-destructive">
                  Booking Failed — {analysis.booking.responseError.code}
                </p>
                <p className="text-sm text-destructive/80 mt-1">{analysis.booking.responseError.message}</p>
              </div>
            </div>
          )}

          {/* Global fields: Price, Brand */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/70 border-b border-border">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[180px]">Field</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-primary">Quoted (Revalidation)</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-primary">Booked (Supplier)</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[50px]">OK?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <CompareRow icon="💰" label="Total Price" quoted={analysis.quotedPrice} booked={analysis.bookedPrice} match={analysis.priceMatch} />
                <CompareRow icon="🎫" label="Fare Brand" quoted={analysis.quotedBrand} booked={analysis.bookedBrand} match={analysis.brandMatch} />
                <CompareRow icon="↩️" label="Refund Type" quoted={analysis.quotedRefund} booked={analysis.bookedRefund} match={analysis.quotedRefund === analysis.bookedRefund} />
              </tbody>
            </table>
          </div>

          {/* Per-leg comparisons */}
          {analysis.comparisons.map((legComp) => (
            <div key={legComp.legIndex} className="border border-border rounded-lg overflow-hidden">
              <div className={`px-3 py-2 flex items-center gap-2 ${legComp.routeMatch ? 'bg-muted/40' : 'bg-destructive/10'}`}>
                <span className="text-xs">✈️</span>
                <span className="text-[11px] font-semibold text-foreground">
                  Leg {legComp.legIndex + 1}: {legComp.quoted.dep} → {legComp.quoted.arr}
                </span>
                {!legComp.routeMatch && (
                  <span className="text-[10px] text-destructive font-medium">
                    ⚠ Route mismatch: Booked as {legComp.booked.dep} → {legComp.booked.arr}
                  </span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[180px]">Field</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary">Quoted</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary">Booked</th>
                    <th className="px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[50px]">OK?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Leg-level departure/arrival */}
                  <CompareRow
                    icon="🛫"
                    label="Leg Departure"
                    quoted={formatDateTime(legComp.quoted.depTime)}
                    booked={formatDateTime(legComp.booked.depTime)}
                    match={legComp.quoted.depTime === legComp.booked.depTime}
                  />
                  <CompareRow
                    icon="🛬"
                    label="Leg Arrival"
                    quoted={formatDateTime(legComp.quoted.arrTime)}
                    booked={formatDateTime(legComp.booked.arrTime)}
                    match={legComp.quoted.arrTime === legComp.booked.arrTime}
                  />
                  {/* Per-segment fields */}
                  {legComp.segments.map((seg, i) => (
                    <CompareRow
                      key={i}
                      icon={
                        seg.field === 'airline' ? '🏷️' :
                        seg.field === 'operatingAirline' ? '🔧' :
                        seg.field === 'departureDateTime' ? '🕐' :
                        seg.field === 'arrivalDateTime' ? '🕑' :
                        seg.field === 'cabin' ? '💺' :
                        seg.field === 'segmentRoute' ? '🗺️' :
                        ''
                      }
                      label={seg.label}
                      quoted={seg.quoted}
                      booked={seg.booked}
                      match={seg.match}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Context info */}
          <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border">
            <span>Revalidation: {formatDate(analysis.reval.requestedAt || analysis.reval.timestamp)}</span>
            <span>Booking: {formatDate(analysis.booking.requestedAt || analysis.booking.timestamp)}</span>
            {analysis.booking.wegoRef && <span className="font-mono">Wego Ref: {analysis.booking.wegoRef}</span>}
            {analysis.booking.orderId && <span className="font-mono">Order: {analysis.booking.orderId}</span>}
            {analysis.reval.ipcc && <span>IPCC: {analysis.reval.ipcc}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyPanel;
