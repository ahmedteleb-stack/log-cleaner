import { ParsedRow } from './csvParser';

// ─────────────────────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────────────────────

export interface BookingSegment {
  airlineRef: string | null;
  marketingAirlineCode: string | null;
  marketingFlightNumber: string | null;
  marketingAirlineName: string | null;
  cabin: string | null;
  departureDateTime: string | null;
  arrivalDateTime: string | null;
  departureDate: string | null;
  departureTime: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  durationMinutes: number | null;
  overnight: boolean;
  stopoverDurationMinutes: number | null;
  stopoverDuration: string | null;
  departureAirportCode: string | null;
  departureAirportName: string | null;
  departureCityName: string | null;
  departureCountryCode: string | null;
  departureTerminal: string | null;
  arrivalAirportCode: string | null;
  arrivalAirportName: string | null;
  arrivalCityName: string | null;
  arrivalCountryCode: string | null;
  arrivalTerminal: string | null;
  aircraftType: string | null;
  allianceCode: string | null;
}

export interface BookingLeg {
  legId: number | null;
  status: string | null;
  departureAirportCode: string | null;
  departureAirportName: string | null;
  departureCityName: string | null;
  departureCountryCode: string | null;
  departureDateTime: string | null;
  departureDate: string | null;
  departureTime: string | null;
  arrivalAirportCode: string | null;
  arrivalAirportName: string | null;
  arrivalCityName: string | null;
  arrivalCountryCode: string | null;
  arrivalDateTime: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  duration: string | null;
  durationMinutes: number | null;
  stopoversCount: number | null;
  airlineCodes: string[];
  allianceCodes: string[];
  stopoverAirportCodes: string[];
  overnight: boolean;
  scheduleChangeType: string | null;
  stopoverDurationMinutes: number | null;
  segments: BookingSegment[];
  brandedFare: { id: string; name: string; refundType: string | null } | null;
}

export interface BookingPassenger {
  id: string | null;
  type: string | null;
  gender: string | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  documentType: string | null;
  documentId: string | null;
  documentExpiry: string | null;
  passengerId: string | number | null;
  frequentFlyers: unknown[];
}

export interface BookingContact {
  email: string | null;
  phonePrefix: number | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  fullName: string | null;
}

export interface TaxEntry {
  id: number;
  code: string | null;
  description: string | null;
  amount: number;
  amountUsd: number;
  currencyCode: string | null;
}

export interface PaymentEntry {
  paymentMethodCode: string | null;
  amountInCents: number | null;
  amount: number | null;
  currencyCode: string | null;
  status: string | null;
  createdAt: string | null;
  orderId: string | null;
  id: string | null;
  threeDsEnabled: boolean;
  redirectLink: string | null;
  bookingExpiredAt: string | null;
  paymentMethodName: string | null;
}

export interface BaggageEntry {
  id: number;
  type: string | null;
  weight: number | null;
  unit: string | null;
  pieceCount: number | null;
  included: boolean;
  source: string | null;
}

export interface PenaltyEntry {
  brandedFareId: string;
  brandedFareName: string;
  legId: number | null;
  passengerType?: string;
  type: string | null;
  amount: number | null;
  amountUsd: number | null;
  currencyCode: string | null;
  conditionsApply: boolean;
}

export interface AnomalyEntry {
  timestamp: string;
  url: string;
  paymentStatus: string | null;
  responseCode: number | null;
  errorMessage: string | null;
  reasons: string[];
}

export interface BookingExtraction {
  booking_metadata: {
    bookingRef: string;
    wegoOrderId: string | null;
    status: string;
    paymentStatus: string;
    refundType: string | null;
    brandedFareCodeLeg1: string | null;
    brandedFareNameLeg1: string | null;
    brandedFareCodeLeg2: string | null;
    brandedFareNameLeg2: string | null;
    brandedFareUUIDs: string[];
    tripId: string | null;
    createdAt: string | null;
    expiredAt: string | null;
    statusPollResponseCode: number | null;
  };
  passengers: BookingPassenger[];
  contact: BookingContact | null;
  flights: {
    outbound: BookingLeg | null;
    inbound: BookingLeg | null;
  };
  price: {
    summary: {
      userCurrencyCode: string;
      userTotalAmount: number | null;
      userBaseAmountLeg1: number | null;
      userBaseAmountLeg2: number | null;
      userTaxAmountLeg1: number | null;
      userTaxAmountLeg2: number | null;
      userBookingFeeTotal: number;
      totalAmountInUsd: number | null;
      totalInsuranceAmount: number;
      totalSeatAmount: number;
      totalMealAmount: number;
      priceInfo: unknown;
      leg1BrandedFarePrice: unknown;
      leg2BrandedFarePrice: unknown;
      leg1Taxes: TaxEntry[];
      leg2Taxes: TaxEntry[];
    };
    taxes: TaxEntry[];
    payment: PaymentEntry[];
  };
  baggage: BaggageEntry[];
  airlineDisclaimers: { id: number; note: string }[];
  penalties: {
    fees: { id: number; type: string | null; amount: number }[];
    branded_fare_direct_penalties: PenaltyEntry[];
    passenger_level_penalties: PenaltyEntry[];
    branded_fare_fee_refs: { type: string | null; amount: number; feeDescId: number }[];
    branded_fare_baggage_ids: Record<string, unknown>;
    ancillary_baggage_check: unknown;
  };
  fare_rules_summary: string | null;
  pnr_status: {
    overallBookingStatus: string;
    overallTicketStatus: null;
    hasScheduleChange: boolean;
    expiredAt: string | null;
    responseCode: number | null;
    paymentExtension: boolean | null;
    itinerarySegments: {
      departureAirportCode: string | null;
      arrivalAirportCode: string | null;
      airlineRef: string | null;
      isTechnicalStop: boolean;
    }[];
  } | null;
  client_context: {
    Origin: string | null;
    'User-Agent': string | null;
    'X-Country-Code': string | null;
    'X-User-City': string | null;
    'X-Latitude': string | null;
    'X-Longitude': string | null;
    'x-requested-with': string | null;
    Referer: string | null;
    'CF-IPCountry': string | null;
    'CF-Connecting-IP': string | null;
    cookies: Record<string, string>;
  };
  anomalies: AnomalyEntry[];
  _extraction_meta: {
    source_rows: number;
    target_booking_ref: string;
    extraction_timestamp: string;
    note: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function tryJSON(s: string | undefined | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function s(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  const str = String(v).trim();
  return str === '' ? null : str;
}

function parseHeaderPairs(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /name=([^,}]+),\s*value=([^}]*)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    result[m[1].trim()] = m[2].trim();
  }
  return result;
}

function parseCookiePairs(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /name=([^,}]+),\s*value=([^}]*)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    result[m[1].trim()] = m[2].trim();
  }
  // Fallback: parse Cookie header
  if (Object.keys(result).length === 0 && raw.includes('=')) {
    raw.split(';').forEach(part => {
      const eq = part.indexOf('=');
      if (eq > -1) {
        result[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
      }
    });
  }
  return result;
}

interface ParsedRow2 extends ParsedRow {}

interface RowCtx {
  row: ParsedRow2;
  url: string;
  method: string;
  wegoRef: string;
  payOrderId: string;
  bFareId: string;
  ts: string;
  rb: any;
  req: any;
}

function buildContexts(rows: ParsedRow2[]): RowCtx[] {
  return rows.map(row => ({
    row,
    url: row.url || '',
    method: row.method || '',
    wegoRef: row.wegoref || '',
    payOrderId: row.paymentorderid || '',
    bFareId: row.brandedfareid || '',
    ts: row.timestamp || '',
    rb: tryJSON(row.responsebody),
    req: tryJSON(row.requestbody),
  }));
}

function buildSegment(seg: any, airlineRefMap: Record<string, string>): BookingSegment {
  const k = `${seg.departureAirportCode}:${seg.arrivalAirportCode}`;
  return {
    airlineRef: airlineRefMap[k] ?? null,
    marketingAirlineCode: s(seg.airlineCode),
    marketingFlightNumber: s(seg.designatorCode),
    marketingAirlineName: s(seg.airlineName),
    cabin: s(seg.cabin),
    departureDateTime: s(seg.departureDateTime),
    arrivalDateTime: s(seg.arrivalDateTime),
    departureDate: s(seg.departureDate),
    departureTime: s(seg.departureTime),
    arrivalDate: s(seg.arrivalDate),
    arrivalTime: s(seg.arrivalTime),
    durationMinutes: seg.durationMinutes ?? null,
    overnight: !!(seg.durationDays > 0),
    stopoverDurationMinutes: seg.stopoverDurationMinutes ?? null,
    stopoverDuration: s(seg.stopoverDuration),
    departureAirportCode: s(seg.departureAirportCode),
    departureAirportName: s(seg.departureAirportName),
    departureCityName: s(seg.departureCityName),
    departureCountryCode: s(seg.departureCountryCode),
    departureTerminal: s(seg.departureTerminal),
    arrivalAirportCode: s(seg.arrivalAirportCode),
    arrivalAirportName: s(seg.arrivalAirportName),
    arrivalCityName: s(seg.arrivalCityName),
    arrivalCountryCode: s(seg.arrivalCountryCode),
    arrivalTerminal: s(seg.arrivalTerminal),
    aircraftType: s(seg.aircraftType),
    allianceCode: s(seg.allianceCode),
  };
}

function buildLeg(leg: any, airlineRefMap: Record<string, string>, brandedFare: any): BookingLeg {
  const rawSegs: any[] = leg.segments || [];
  const segs = rawSegs.map(sg => buildSegment(sg, airlineRefMap));
  const first = segs[0] ?? null;
  const last = segs[segs.length - 1] ?? null;

  return {
    legId: leg.id ?? null,
    status: null,
    departureAirportCode: first?.departureAirportCode ?? s(leg.departureAirportCode),
    departureAirportName: first?.departureAirportName ?? null,
    departureCityName: first?.departureCityName ?? null,
    departureCountryCode: first?.departureCountryCode ?? null,
    departureDateTime: s(leg.departureDateTime),
    departureDate: s(leg.departureDate),
    departureTime: s(leg.departureTime),
    arrivalAirportCode: last?.arrivalAirportCode ?? s(leg.arrivalAirportCode),
    arrivalAirportName: last?.arrivalAirportName ?? null,
    arrivalCityName: last?.arrivalCityName ?? null,
    arrivalCountryCode: last?.arrivalCountryCode ?? null,
    arrivalDateTime: s(leg.arrivalDateTime),
    arrivalDate: s(leg.arrivalDate),
    arrivalTime: s(leg.arrivalTime),
    duration: s(leg.duration),
    durationMinutes: leg.durationMinutes ?? null,
    stopoversCount: leg.stopoversCount ?? null,
    airlineCodes: leg.airlineCodes ? (Array.isArray(leg.airlineCodes) ? leg.airlineCodes : [leg.airlineCodes]) : [],
    allianceCodes: leg.allianceCodes ? (Array.isArray(leg.allianceCodes) ? leg.allianceCodes : [leg.allianceCodes]) : [],
    stopoverAirportCodes: leg.stopoverAirportCodes ? (Array.isArray(leg.stopoverAirportCodes) ? leg.stopoverAirportCodes : [leg.stopoverAirportCodes]) : [],
    overnight: !!leg.overnight,
    scheduleChangeType: s(leg.scheduleChangeType),
    stopoverDurationMinutes: leg.stopoverDurationMinutes ?? null,
    segments: segs,
    brandedFare: brandedFare ? {
      id: String(brandedFare.id),
      name: String(brandedFare.brandName || brandedFare.name || ''),
      refundType: s(brandedFare.refundType),
    } : null,
  };
}

function getTaxRefs(piObj: any, taxDescs: any[]): TaxEntry[] {
  if (!piObj?.taxes) return [];
  const tdMap: Record<number, any> = {};
  taxDescs.forEach(t => { tdMap[t.id] = t; });
  return (piObj.taxes as number[]).map(tid => {
    const t = tdMap[tid];
    if (!t) return null;
    return { id: t.id, code: s(t.code), description: s(t.description), amount: Number(t.amount), amountUsd: Number(t.amountUsd), currencyCode: s(t.currencyCode) };
  }).filter(Boolean) as TaxEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main extractor — works on all rows from ONE fares CSV file
// ─────────────────────────────────────────────────────────────────────────────

export function extractBooking(rows: ParsedRow[], targetRef?: string): BookingExtraction | null {
  if (!rows.length) return null;

  const ctxs = buildContexts(rows);

  // Determine target booking ref: prefer explicit, then most common wegoref
  let ref = targetRef || '';
  if (!ref) {
    const refCounts: Record<string, number> = {};
    ctxs.forEach(c => { if (c.wegoRef) refCounts[c.wegoRef] = (refCounts[c.wegoRef] || 0) + 1; });
    ref = Object.entries(refCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }
  if (!ref) return null;

  // Pick the latest fare revalidate row (has trip, brandedFares, taxDescs, baggageDescs, feeDescs)
  const revalRows = ctxs.filter(c => c.url.includes('/revalidate') && c.rb?.trip).sort((a, b) => b.ts.localeCompare(a.ts));
  const compareRows = ctxs.filter(c => c.url.includes('/compare') && c.rb?.trip).sort((a, b) => b.ts.localeCompare(a.ts));
  const fareCtx = revalRows[0] ?? compareRows[0] ?? null;
  const fareData = fareCtx?.rb ?? null;

  // Status row (has itinerary with airlineRefs, responseCode)
  const statusCtx = ctxs.filter(c => c.url.includes('/flights/status') && c.wegoRef === ref).sort((a, b) => b.ts.localeCompare(a.ts))[0] ?? null;
  const statusData = statusCtx?.rb ?? null;

  // Booking creation: POST /passenger-info response for target ref (has paymentOrderId, price, expiredAt)
  const bookingCtx = ctxs.filter(c => c.url.includes('/passenger-info') && c.wegoRef === ref).sort((a, b) => b.ts.localeCompare(a.ts))[0] ?? null;
  const bookingData = bookingCtx?.rb ?? null;

  // Passenger/contact from requestbody of same POST
  const passengerReq = bookingCtx?.req ?? null;

  // Payment creation (POST /payments for the ref)
  const payCtx = ctxs.filter(c => c.url.includes('/flights/payments') && !c.url.includes('/order-data') && !c.url.includes('/options') && c.wegoRef === ref && c.method === 'POST').sort((a, b) => b.ts.localeCompare(a.ts))[0] ?? null;
  const payData = payCtx?.rb ?? null;

  // Baggage availability for the ref
  const baggageCtx = ctxs.filter(c => c.url.includes('/baggages/availability') && c.wegoRef === ref).sort((a, b) => b.ts.localeCompare(a.ts))[0] ?? null;
  const baggageData = baggageCtx?.rb ?? null;

  // Context for headers/cookies  
  const contextCtx = bookingCtx ?? ctxs[0];

  // Core fare data pieces
  const trip = fareData?.trip ?? null;
  const taxDescs: any[] = fareData?.taxDescs ?? [];
  const baggageDescs: any[] = fareData?.baggageDescs ?? [];
  const feeDescs: any[] = fareData?.feeDescs ?? [];
  const brandedFares: any[] = fareData?.brandedFares ?? [];
  const utaDescs: any[] = fareData?.utaDescs ?? [];
  const tcViews: any[] = fareData?.termsAndConditionViews ?? [];

  // brandedFareIds from passenger-info request body
  const bfIds: string[] = passengerReq?.brandedFareIds ?? [];

  // Match branded fares for each leg
  let leg1BF: any = null, leg2BF: any = null;
  brandedFares.forEach(bf => {
    if (bfIds.includes(bf.id)) {
      if (bf.legId === 1) leg1BF = bf;
      else if (bf.legId === 2) leg2BF = bf;
    }
  });

  // AirlineRef map from status itinerary
  const airlineRefMap: Record<string, string> = {};
  const itinLegs: any[] = statusData?.itinerary?.legs ?? [];
  itinLegs.forEach(leg => {
    (leg.segments ?? []).forEach((seg: any) => {
      if (seg.airlineRef) {
        const k = `${seg.departureAirportCode}:${seg.arrivalAirportCode}`;
        airlineRefMap[k] = seg.airlineRef;
      }
    });
  });

  // ── 1. Booking Metadata ───────────────────────────────────────────────────

  const paymentOrderId = s(bookingData?.paymentOrderId) ?? s(bookingCtx?.payOrderId) ?? null;
  const createdAt = s(bookingData?.createdAt);
  const expiredAt = s(bookingData?.expiredAt) ?? s(statusData?.expiredAt) ?? null;
  const payStatusCode = s(payData?.statusCode) ?? 'PENDING';
  const bookingStatus = statusData?.responseCode === 10000 ? 'CONFIRMED' : 'PENDING';

  const booking_metadata: BookingExtraction['booking_metadata'] = {
    bookingRef: ref,
    wegoOrderId: paymentOrderId,
    status: bookingStatus,
    paymentStatus: payStatusCode,
    refundType: s(leg1BF?.refundType),
    brandedFareCodeLeg1: s(leg1BF?.id),
    brandedFareNameLeg1: s(leg1BF?.brandName),
    brandedFareCodeLeg2: s(leg2BF?.id),
    brandedFareNameLeg2: s(leg2BF?.brandName),
    brandedFareUUIDs: bfIds,
    tripId: s(trip?.id),
    createdAt,
    expiredAt,
    statusPollResponseCode: statusData?.responseCode ?? null,
  };

  // ── 2. Passengers + Contact ───────────────────────────────────────────────

  const passengers: BookingPassenger[] = (passengerReq?.passengers ?? []).map((p: any) => {
    const doc = p.passengerDocument;
    // Try to get passengerId from baggage ancillary response
    const matchP = (baggageData?.passengers ?? []).find(
      (ap: any) => s(ap.firstName) === s(p.firstName) && s(ap.lastName) === s(p.lastName)
    );
    return {
      id: null,
      type: s(p.type),
      gender: s(p.gender),
      firstName: s(p.firstName),
      lastName: s(p.lastName),
      dateOfBirth: s(p.dateOfBirth),
      nationality: s(p.nationalityCountryCode),
      documentType: doc ? s(doc.type) : null,
      documentId: doc ? s(doc.number) : null,
      documentExpiry: doc ? s(doc.expiryDate) : null,
      passengerId: matchP?.passengerId ?? null,
      frequentFlyers: [],
    };
  });

  const contact: BookingContact | null = passengerReq?.contact ? {
    email: s(passengerReq.contact.email),
    phonePrefix: passengerReq.contact.phonePrefix ?? null,
    phoneCountryCode: s(passengerReq.contact.countryCode),
    phoneNumber: s(passengerReq.contact.phoneNumber),
    fullName: s(passengerReq.contact.fullName),
  } : null;

  // ── 3. Flights ────────────────────────────────────────────────────────────

  const tripLegs: any[] = trip?.legs ?? [];
  const outbound = tripLegs[0] ? buildLeg(tripLegs[0], airlineRefMap, leg1BF) : null;
  const inbound  = tripLegs[1] ? buildLeg(tripLegs[1], airlineRefMap, leg2BF) : null;

  // ── 4. Price ──────────────────────────────────────────────────────────────

  const combPrice = bookingData?.price ?? null;
  const leg1PI = leg1BF?.passengerInfos?.[0] ?? null;
  const leg2PI = leg2BF?.passengerInfos?.[0] ?? null;
  const leg1Price = leg1PI?.price ?? null;
  const leg2Price = leg2PI?.price ?? null;

  const totalSAR: number | null = combPrice?.totalAmount ?? bookingData?.totalAmount ?? null;
  const totalUSD: number | null = combPrice?.totalAmountUsd ?? null;

  const taxList: TaxEntry[] = taxDescs.map(t => ({
    id: t.id,
    code: s(t.code),
    description: s(t.description),
    amount: Number(t.amount),
    amountUsd: Number(t.amountUsd),
    currencyCode: s(t.currencyCode),
  }));

  const leg1Taxes = getTaxRefs(leg1PI, taxDescs);
  const leg2Taxes = getTaxRefs(leg2PI, taxDescs);

  const payments: PaymentEntry[] = payData ? [{
    paymentMethodCode: s(payData.paymentMethodCode),
    amountInCents: payData.totalAmountInCents ?? null,
    amount: payData.totalAmountInCents ? Math.round(payData.totalAmountInCents) / 100 : null,
    currencyCode: s(payData.currencyCode),
    status: s(payData.statusCode),
    createdAt: s(payData.createdAt),
    orderId: s(payData.orderId),
    id: s(payData.id),
    threeDsEnabled: !!payData.threeDsEnabled,
    redirectLink: s(payData.redirectLink),
    bookingExpiredAt: s(payData.bookingExpiredAt),
    paymentMethodName: null,
  }] : [];

  const price: BookingExtraction['price'] = {
    summary: {
      userCurrencyCode: 'SAR',
      userTotalAmount: totalSAR ? Number(totalSAR) : null,
      userBaseAmountLeg1: leg1Price ? Number(leg1Price.totalOriginalAmount) : null,
      userBaseAmountLeg2: leg2Price ? Number(leg2Price.totalOriginalAmount) : null,
      userTaxAmountLeg1: leg1Price ? Number(leg1Price.totalTaxAmount) : null,
      userTaxAmountLeg2: leg2Price ? Number(leg2Price.totalTaxAmount) : null,
      userBookingFeeTotal: Number(combPrice?.totalBookingFee ?? 0),
      totalAmountInUsd: totalUSD ? Number(totalUSD) : null,
      totalInsuranceAmount: Number(combPrice?.totalInsuranceAmount ?? 0),
      totalSeatAmount: Number(combPrice?.totalSeatAmount ?? 0),
      totalMealAmount: Number(combPrice?.totalMealAmount ?? 0),
      priceInfo: fareData?.priceInfo ?? null,
      leg1BrandedFarePrice: leg1Price ?? null,
      leg2BrandedFarePrice: leg2Price ?? null,
      leg1Taxes,
      leg2Taxes,
    },
    taxes: taxList,
    payment: payments,
  };

  // ── 5. Baggage ────────────────────────────────────────────────────────────

  const baggage: BaggageEntry[] = baggageDescs.map(b => ({
    id: b.id,
    type: s(b.type),
    weight: b.weight ?? null,
    unit: s(b.unit),
    pieceCount: b.pieceCount ?? null,
    included: !!b.included,
    source: s(b.source),
  }));

  const airlineDisclaimers: { id: number; note: string }[] = (fareData?.airlineDisclaimerDescs ?? [])
    .map((d: any) => ({ id: d.id, note: d.note || '' }));

  // ── 6. Penalties ──────────────────────────────────────────────────────────

  const fees = feeDescs.map(f => ({ id: f.id, type: s(f.type), amount: Number(f.amount) }));

  const directPenalties: PenaltyEntry[] = [];
  const passengerPenalties: PenaltyEntry[] = [];

  [leg1BF, leg2BF].forEach(bf => {
    if (!bf) return;
    (bf.penalties ?? []).forEach((pen: any) => {
      directPenalties.push({
        brandedFareId: String(bf.id),
        brandedFareName: String(bf.brandName),
        legId: bf.legId ?? null,
        type: s(pen.type),
        amount: pen.amount != null ? Number(pen.amount) : null,
        amountUsd: pen.amountUsd != null ? Number(pen.amountUsd) : null,
        currencyCode: s(pen.currencyCode),
        conditionsApply: !!pen.conditionsApply,
      });
    });
    (bf.passengerInfos ?? []).forEach((pi: any) => {
      (pi.penalties ?? []).forEach((pen: any) => {
        passengerPenalties.push({
          brandedFareId: String(bf.id),
          brandedFareName: String(bf.brandName),
          legId: bf.legId ?? null,
          passengerType: s(pi.type) ?? undefined,
          type: s(pen.type),
          amount: pen.amount != null ? Number(pen.amount) : null,
          amountUsd: pen.amountUsd != null ? Number(pen.amountUsd) : null,
          currencyCode: s(pen.currencyCode),
          conditionsApply: !!pen.conditionsApply,
        });
      });
    });
  });

  const feeDescMap: Record<number, any> = {};
  feeDescs.forEach(f => { feeDescMap[f.id] = f; });

  const bfFeeRefs: { type: string | null; amount: number; feeDescId: number }[] = [];
  [leg1PI, leg2PI].forEach(pi => {
    if (!pi?.fees) return;
    (pi.fees as number[]).forEach(fid => {
      const fd = feeDescMap[fid];
      if (fd) bfFeeRefs.push({ type: s(fd.type), amount: Number(fd.amount), feeDescId: Number(fid) });
    });
  });

  const bfBaggageIds: Record<string, unknown> = {};
  if (leg1PI?.baggages) bfBaggageIds[`leg1_${s(leg1BF?.brandName) ?? 'BF'}_baggageIds`] = leg1PI.baggages;
  if (leg2PI?.baggages) bfBaggageIds[`leg2_${s(leg2BF?.brandName) ?? 'BF'}_baggageIds`] = leg2PI.baggages;

  const penalties: BookingExtraction['penalties'] = {
    fees,
    branded_fare_direct_penalties: directPenalties,
    passenger_level_penalties: passengerPenalties,
    branded_fare_fee_refs: bfFeeRefs,
    branded_fare_baggage_ids: bfBaggageIds,
    ancillary_baggage_check: baggageData?.baggageInfo ?? null,
  };

  // ── 7. Fare Rules ─────────────────────────────────────────────────────────

  const fareRulesLines: string[] = [];
  tcViews.forEach(t => {
    if (t.termsAndConditions?.length) {
      fareRulesLines.push(`--- Leg ${t.legId} Terms & Conditions ---`);
      t.termsAndConditions.forEach((tc: string) => fareRulesLines.push(`  ${tc}`));
      fareRulesLines.push('');
    }
  });
  if (utaDescs.length) {
    fareRulesLines.push('--- Policy Attributes (UTAs) ---');
    utaDescs.forEach(u => {
      const attrs = u.attributes ? Object.entries(u.attributes).map(([k, v]) => `${k}=${v}`).join(', ') : '';
      fareRulesLines.push(`  ID=${u.id} type=${u.type} key=${u.key} code=${u.code}${attrs ? ` [${attrs}]` : ''}`);
    });
  }

  const fare_rules_summary = fareRulesLines.length > 0 ? fareRulesLines.join('\n') : null;

  // ── 8. PNR Status ─────────────────────────────────────────────────────────

  const pnr_status: BookingExtraction['pnr_status'] = statusData ? {
    overallBookingStatus: statusData.responseCode === 10000 ? 'CONFIRMED' : 'UNKNOWN',
    overallTicketStatus: null,
    hasScheduleChange: false,
    expiredAt: s(statusData.expiredAt),
    responseCode: statusData.responseCode ?? null,
    paymentExtension: statusData.paymentExtension ?? null,
    itinerarySegments: itinLegs.flatMap(leg =>
      (leg.segments ?? []).map((seg: any) => ({
        departureAirportCode: s(seg.departureAirportCode),
        arrivalAirportCode: s(seg.arrivalAirportCode),
        airlineRef: s(seg.airlineRef),
        isTechnicalStop: !!seg.isTechnicalStop,
      }))
    ),
  } : null;

  // ── 9. Client Context ─────────────────────────────────────────────────────

  const headers = parseHeaderPairs(contextCtx?.row?.requestheaders || '');
  let cookies = parseCookiePairs(contextCtx?.row?.requestcookies || '');
  if (Object.keys(cookies).length === 0 && headers['Cookie']) {
    cookies = parseCookiePairs(headers['Cookie']);
  }

  const client_context: BookingExtraction['client_context'] = {
    Origin: s(headers['Origin']),
    'User-Agent': s(headers['User-Agent']),
    'X-Country-Code': s(headers['X-Country-Code']),
    'X-User-City': s(headers['X-User-City']),
    'X-Latitude': s(headers['X-Latitude']),
    'X-Longitude': s(headers['X-Longitude']),
    'x-requested-with': s(headers['x-requested-with']),
    Referer: s(headers['Referer']),
    'CF-IPCountry': s(headers['CF-IPCountry']),
    'CF-Connecting-IP': s(headers['CF-Connecting-IP'] ?? headers['True-Client-IP']),
    cookies,
  };

  // ── 10. Anomalies ─────────────────────────────────────────────────────────

  const anomalies: AnomalyEntry[] = [];
  const seenAnomaly = new Set<string>();

  ctxs.forEach(c => {
    const rb = c.rb;
    if (rb && !Array.isArray(rb)) {
      const reasons: string[] = [];
      if (rb.responseCode === 50000) reasons.push('responseCode=50000');
      if (rb.paymentStatus === 'AUTH_PENDING') reasons.push('paymentStatus=AUTH_PENDING');
      if (reasons.length > 0) {
        const key = `${c.ts}:${c.url}`;
        if (!seenAnomaly.has(key)) {
          seenAnomaly.add(key);
          anomalies.push({
            timestamp: c.ts,
            url: c.url,
            paymentStatus: s(rb.paymentStatus),
            responseCode: rb.responseCode ?? null,
            errorMessage: s(rb.errorMessage ?? rb.message),
            reasons,
          });
        }
      }
    }
    const errVal = c.row.error;
    if (errVal?.trim()) {
      const key = `${c.ts}:${c.url}:error`;
      if (!seenAnomaly.has(key)) {
        seenAnomaly.add(key);
        anomalies.push({
          timestamp: c.ts,
          url: c.url,
          paymentStatus: null,
          responseCode: null,
          errorMessage: errVal.trim(),
          reasons: ['error column non-empty'],
        });
      }
    }
  });

  // ── Assemble ──────────────────────────────────────────────────────────────

  return {
    booking_metadata,
    passengers,
    contact,
    flights: { outbound, inbound },
    price,
    baggage,
    airlineDisclaimers,
    penalties,
    fare_rules_summary,
    pnr_status,
    client_context,
    anomalies,
    _extraction_meta: {
      source_rows: rows.length,
      target_booking_ref: ref,
      extraction_timestamp: new Date().toISOString(),
      note: 'Synthesized from booking flow log rows. CONFIRMED status inferred from /status responseCode=10000.',
    },
  };
}

/** Extract all unique wegoRefs present in rows, sorted by occurrence count */
export function extractWegoRefs(rows: ParsedRow[]): string[] {
  const counts: Record<string, number> = {};
  rows.forEach(r => {
    const ref = r.wegoref?.trim();
    if (ref) counts[ref] = (counts[ref] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([ref]) => ref);
}
