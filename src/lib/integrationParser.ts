import { parseCSV, ParsedRow } from './csvParser';

// ── Core types ──

export interface IntegrationSegment {
  segmentId?: string;
  bookingCode: string;
  fareBasisCode: string;
  cabinType: string;
  allianceCode: string;
  departureAirportCode: string;
  departureDateTime: string;
  departureTerminal?: string;
  arrivalAirportCode: string;
  arrivalDateTime: string;
  arrivalTerminal?: string;
  marketingAirlineCode: string;
  marketingFlightNumber: string;
  operatingAirlineCode: string;
  operatingFlightNumber: string;
  aircraftCode?: string;
  technicalStops: any[];
  seats: any[];
  meals: any[];
  baggages: any[];
}

export interface IntegrationLeg {
  departureAirportCode: string;
  departureDateTime: string;
  arrivalAirportCode: string;
  arrivalDateTime: string;
  segments: IntegrationSegment[];
}

export interface IntegrationPrice {
  totalAmount: number;
  totalAmountUsd: number;
  baseAmount: number;
  taxAmount: number;
  totalBookingFee: number;
  bookingFeeRate: number;
  commissionAmount: number;
  commissionPercentage: number;
  adjustedBaseAmountDiff?: number;
  currencyCode: string;
  cat35CommissionAmount?: number;
  cat35CommissionPercentage?: number;
  cat35MarkupAmount?: number;
}

export interface IntegrationTax {
  code: string;
  description: string;
  amount: number;
  currencyCode: string;
}

export interface IntegrationPenalty {
  type: string;
  doable: boolean;
  amount: number;
  amountUsd: number;
  currencyCode: string;
  applicability: string;
}

export interface IntegrationFee {
  type: string;
  amount: number;
  currencyCode: string;
}

export interface IntegrationBaggage {
  type: string;
  source?: string;
  weight: number;
  unit: string;
  pieceCount: number;
  weightDescription?: string;
  dimensionDescription?: string;
}

export interface IntegrationPassengerPricing {
  passengerType: string;
  bookingPrice?: IntegrationPrice;
  vendorPrice?: IntegrationPrice;
  bookingTaxes: IntegrationTax[];
  vendorTaxes: IntegrationTax[];
  fareBasisCodes: string[];
  baggages: IntegrationBaggage[];
  penalties: IntegrationPenalty[];
  fees: IntegrationFee[];
}

export interface IntegrationBrandedFare {
  id: string;
  legId: number;
  bookingIpcc: string;
  msFareId: string;
  type: string;
  refundType: string;
  brandCode: string;
  brandName: string;
  bookingPrice?: IntegrationPrice;
  vendorPrice?: IntegrationPrice;
  adultInfo?: IntegrationPassengerPricing;
  childInfo?: IntegrationPassengerPricing;
  infantInfo?: IntegrationPassengerPricing;
  penalties: IntegrationPenalty[];
  tags: { type: string; attributes?: any }[];
  userCurrencyCode: string;
  userCurrencyFx: number;
  lastTicketDateTime?: string;
  createdAt: string;
}

export interface SabaDetails {
  adjustment: number;
  adjustmentUsd: number;
  originalProviderCode: string;
  originalPrice: number;
  originalPriceUsd: number;
  selectedPrice: number;
  selectedPriceUsd: number;
  finalPrice: number;
  finalPriceUsd: number;
  searchPriceUsd: number;
  wasAdjusted: boolean;
  providerChanged: boolean;
  isSearchFare: boolean;
  reason: string;
  brandName: string;
  endToEndMarginUsd: number;
  sabaMarginUsd: number;
  dynamicPricingMarginUsd: number;
  globalSearchDeltaUsd: number;
  globalPriceDeltaUsd: number;
  baseAdjustmentUsd: number;
  bookingMarginId: number;
  comparedFares: SabaComparedFare[];
}

export interface SabaComparedFare {
  msClickId: string;
  providerCode: string;
  integrationType: string;
  msFareId: string;
  priceUsd: number;
  price: number;
  currency: string;
  selected: boolean;
}

export interface IntegrationSearchContext {
  searchId: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  cabinType: string;
  siteCode: string;
  locale: string;
  tripType: string;
  appType: string;
  appBuild?: number;
  deviceType: string;
  userLoggedIn: boolean;
  outboundDates: string[];
  createdAt: string;
}

export interface IntegrationContact {
  email: string;
  fullName: string;
  phoneNumber: string;
  phonePrefix: string;
  countryCode: string;
}

export interface DynamicFormResult {
  priority: number;
  setId: number;
  validatingAirlineCodes: string[];
  routeTypes: string[];
  conditionalPassengerTypes: string[];
  requiredFields: string[];
  optionalFields: string[];
  requiredDocument: string;
  conditionalNationalitiesCount: number;
}

export interface IntegrationInsurancePackage {
  uuid: string;
  type: string;
  title: string;
  status: string;
  confirmedOn?: string;
  supplier: string;
  totalAmount: number;
  totalTaxAmount: number;
  totalAmountUsd: number;
  currencyCode: string;
  passengerNames: string[];
  cancellable?: boolean;
  termsUrl?: string;
}

export interface RevalidationBrandResult {
  bookingIpcc: string;
  integrationType: string;
  type: string;
  refundType: string;
  brandCode: string;
  brandName: string;
  price?: IntegrationPrice;
  adultPrice?: IntegrationPrice;
  adultTaxes: IntegrationTax[];
  penalties: IntegrationPenalty[];
  fees: IntegrationFee[];
  baggages: IntegrationBaggage[];
}

export interface SupplierSegmentMap {
  carrier: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  flightTime: number;
  travelTime: number;
  distance: number;
  classOfService: string;
  equipment?: string;
  operatingCarrier?: string;
  operatingCarrierName?: string;
}

export interface SupplierSolution {
  totalPrice: string;
  basePrice: string;
  taxes: string;
  fees: string;
  pricingMethod?: string;
  refundable?: boolean;
  exchangeable?: boolean;
  fareCalc?: string;
  latestTicketingTime?: string;
  changePenalties: { amount: string; application: string }[];
  cancelPenalties: { amount: string; application: string }[];
  taxInfos: { category: string; amount: string; description: string }[];
  baggageAllowance: string[];
  carryOnAllowance: string[];
}

// ── Flattened entry ──

export interface FlattenedIntegrationEntry {
  // Row-level fields
  ipcc: string;
  itineraryRef: string;
  method: string;
  providerBrandedFaresCount: string;
  requestedAt: string;
  status: string;
  timeInMs: string;
  type: string;
  url: string;
  wegoRef: string;
  orderId: string;
  brandedFareId: string;
  msFareId: string;
  queueNumber: string;
  hasError: boolean;
  errorMessage: string;
  timestamp: string;
  date: string;

  // Extracted from request_body
  fareId: string;
  integrationType: string;
  validatingAirlineCode: string;
  marketingAirlineCodes: string[];
  operatingAirlineCodes: string[];
  routeType: string;
  departureCountryCodes: string[];
  arrivalCountryCodes: string[];
  providerCode: string;

  // Itinerary
  route: string;
  tripType: string;
  domesticFlight: boolean;
  legs: IntegrationLeg[];
  brandedFare?: IntegrationBrandedFare;

  // SABA pricing
  saba?: SabaDetails;

  // Supplier params
  supplierSegments: SupplierSegmentMap[];
  supplierSolution?: SupplierSolution;

  // Search context
  searchContext?: IntegrationSearchContext;

  // Contact
  contact?: IntegrationContact;

  // Dynamic forms response
  dynamicForms: DynamicFormResult[];

  // Revalidation response
  revalidationBrands: RevalidationBrandResult[];

  // Insurance
  insurancePackages: IntegrationInsurancePackage[];

  // Airline disclaimers
  airlineDisclaimers: string[];

  // Currencies
  currencies: Record<string, number>;

  // Raw
  _raw: ParsedRow;
  _rawRequestBody: string;
  _rawResponseBody: string;
}

// ── Parsing ──

function tryParse(s: string): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function parseSegments(segs: any[]): IntegrationSegment[] {
  return (segs || []).map((s: any) => ({
    segmentId: s.segmentId || undefined,
    bookingCode: s.bookingCode || '',
    fareBasisCode: s.fareBasisCode || '',
    cabinType: s.cabinType || s.cabin || '',
    allianceCode: s.allianceCode || '',
    departureAirportCode: s.departureSchedule?.airportCode || s.departureAirportCode || '',
    departureDateTime: s.departureSchedule?.dateTime || s.departureDateTime || '',
    departureTerminal: s.departureSchedule?.terminal || undefined,
    arrivalAirportCode: s.arrivalSchedule?.airportCode || s.arrivalAirportCode || '',
    arrivalDateTime: s.arrivalSchedule?.dateTime || s.arrivalDateTime || '',
    arrivalTerminal: s.arrivalSchedule?.terminal || undefined,
    marketingAirlineCode: s.marketingCarrier?.airlineCode || s.marketingAirlineCode || '',
    marketingFlightNumber: s.marketingCarrier?.flightNumber || s.marketingFlightNumber || '',
    operatingAirlineCode: s.operatingCarrier?.airlineCode || s.operatingAirlineCode || '',
    operatingFlightNumber: s.operatingCarrier?.flightNumber || s.operatingFlightNumber || '',
    aircraftCode: s.aircraftCode || undefined,
    technicalStops: s.technicalStops || [],
    seats: s.seats || [],
    meals: s.meals || [],
    baggages: s.baggages || [],
  }));
}

function parseIntegrationLegs(rawLegs: any[]): IntegrationLeg[] {
  return (rawLegs || []).map((l: any) => ({
    departureAirportCode: l.departureSchedule?.airportCode || l.departureAirportCode || '',
    departureDateTime: l.departureSchedule?.dateTime || l.departureDateTime || '',
    arrivalAirportCode: l.arrivalSchedule?.airportCode || l.arrivalAirportCode || '',
    arrivalDateTime: l.arrivalSchedule?.dateTime || l.arrivalDateTime || '',
    segments: parseSegments(l.segments),
  }));
}

function parseIntegrationPrice(p: any): IntegrationPrice | undefined {
  if (!p) return undefined;
  return {
    totalAmount: p.totalAmount ?? 0,
    totalAmountUsd: p.totalAmountUsd ?? 0,
    baseAmount: p.baseAmount ?? 0,
    taxAmount: p.taxAmount ?? 0,
    totalBookingFee: p.totalBookingFee ?? 0,
    bookingFeeRate: p.bookingFeeRate ?? 0,
    commissionAmount: p.commissionAmount ?? 0,
    commissionPercentage: p.commissionPercentage ?? 0,
    adjustedBaseAmountDiff: p.adjustedBaseAmountDiff,
    currencyCode: p.currencyCode || '',
    cat35CommissionAmount: p.cat35CommissionAmount,
    cat35CommissionPercentage: p.cat35CommissionPercentage,
    cat35MarkupAmount: p.cat35MarkupAmount,
  };
}

function parseTaxes(taxes: any[]): IntegrationTax[] {
  return (taxes || []).map((t: any) => ({
    code: t.code || '',
    description: t.description || '',
    amount: t.amount ?? 0,
    currencyCode: t.currencyCode || '',
  }));
}

function parsePenalties(penalties: any[]): IntegrationPenalty[] {
  return (penalties || []).map((p: any) => ({
    type: p.type || '',
    doable: p.doable ?? false,
    amount: p.amount ?? 0,
    amountUsd: p.amountUsd ?? 0,
    currencyCode: p.currencyCode || '',
    applicability: p.applicability || '',
  }));
}

function parseFees(fees: any[]): IntegrationFee[] {
  return (fees || []).map((f: any) => ({
    type: f.type || '',
    amount: f.amount ?? 0,
    currencyCode: f.currencyCode || '',
  }));
}

function parseBaggages(baggageArrays: any): IntegrationBaggage[] {
  const result: IntegrationBaggage[] = [];
  const flatten = (arr: any) => {
    if (!arr) return;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (item && typeof item === 'object' && !Array.isArray(item) && item.type) {
          result.push({
            type: item.type || '',
            source: item.source || undefined,
            weight: item.weight ?? 0,
            unit: item.unit || '',
            pieceCount: item.pieceCount ?? 0,
            weightDescription: item.weightDescription || undefined,
            dimensionDescription: item.dimensionDescription || undefined,
          });
        } else {
          flatten(item);
        }
      }
    }
  };
  flatten(baggageArrays);
  return result;
}

function parsePassengerPricing(info: any): IntegrationPassengerPricing | undefined {
  if (!info) return undefined;
  return {
    passengerType: info.passengerType || '',
    bookingPrice: parseIntegrationPrice(info.bookingPassengerPrice?.price),
    vendorPrice: parseIntegrationPrice(info.vendorPassengerPrice?.price),
    bookingTaxes: parseTaxes(info.bookingPassengerPrice?.taxes),
    vendorTaxes: parseTaxes(info.vendorPassengerPrice?.taxes),
    fareBasisCodes: (info.fareBasisCodes || []).flat().filter((c: any) => typeof c === 'string'),
    baggages: parseBaggages(info.baggages),
    penalties: parsePenalties(info.penalties),
    fees: parseFees(info.fees),
  };
}

function parseBrandedFareFromRequest(bf: any): IntegrationBrandedFare | undefined {
  if (!bf) return undefined;
  const adultInfo = parsePassengerPricing(bf.adultInfo);
  const childInfo = parsePassengerPricing(bf.childInfo);
  const infantInfo = parsePassengerPricing(bf.infantInfo);
  return {
    id: bf.id || '',
    legId: bf.legId ?? 0,
    bookingIpcc: bf.bookingIpcc || '',
    msFareId: bf.msFareId || '',
    type: bf.type || '',
    refundType: bf.refundType || '',
    brandCode: bf.brand?.code || '',
    brandName: bf.brand?.name || '',
    bookingPrice: parseIntegrationPrice(bf.bookingPrice),
    vendorPrice: parseIntegrationPrice(bf.vendorPrice),
    adultInfo,
    childInfo,
    infantInfo,
    penalties: parsePenalties(bf.penalties),
    tags: (bf.tags || []).map((t: any) => ({ type: t.type || '', attributes: t.attributes })),
    userCurrencyCode: bf.userCurrencyCode || '',
    userCurrencyFx: bf.userCurrencyFx ?? 0,
    lastTicketDateTime: bf.lastTicketDateTime || undefined,
    createdAt: bf.createdAt || '',
  };
}

function parseSabaDetails(sp: any): SabaDetails | undefined {
  if (!sp || sp.sabaFinalPrice === undefined) return undefined;
  return {
    adjustment: sp.sabaAdjustment ?? 0,
    adjustmentUsd: sp.sabaAdjustmentUsd ?? 0,
    originalProviderCode: sp.sabaOriginalProviderCode || '',
    originalPrice: sp.sabaOriginalPrice ?? 0,
    originalPriceUsd: sp.sabaOriginalPriceUsd ?? 0,
    selectedPrice: sp.sabaSelectedPrice ?? 0,
    selectedPriceUsd: sp.sabaSelectedPriceUsd ?? 0,
    finalPrice: sp.sabaFinalPrice ?? 0,
    finalPriceUsd: sp.sabaFinalPriceUsd ?? 0,
    searchPriceUsd: sp.sabaSearchPriceUsd ?? 0,
    wasAdjusted: sp.sabaWasAdjusted ?? false,
    providerChanged: sp.sabaProviderChanged ?? false,
    isSearchFare: sp.sabaIsSearchFare ?? false,
    reason: sp.sabaReason || '',
    brandName: sp.sabaBrandName || '',
    endToEndMarginUsd: sp.sabaEndToEndMarginUsd ?? 0,
    sabaMarginUsd: sp.sabaSabaMarginUsd ?? 0,
    dynamicPricingMarginUsd: sp.sabaDynamicPricingMarginUsd ?? 0,
    globalSearchDeltaUsd: sp.sabaGlobalSearchDeltaUsd ?? 0,
    globalPriceDeltaUsd: sp.sabaGlobalPriceDeltaUsd ?? 0,
    baseAdjustmentUsd: sp.sabaBaseAdjustmentUsd ?? 0,
    bookingMarginId: sp.bookingMarginId ?? 0,
    comparedFares: (sp.sabaComparedFares || []).map((f: any) => ({
      msClickId: f.msClickId || '',
      providerCode: f.providerCode || '',
      integrationType: f.integrationType || '',
      msFareId: f.msFareId || '',
      priceUsd: f.priceUsd ?? 0,
      price: f.price ?? 0,
      currency: f.currency || '',
      selected: f.selected ?? false,
    })),
  };
}

function parseSupplierSegments(sp: any): SupplierSegmentMap[] {
  return (sp?.segmentMap || []).map((s: any) => ({
    carrier: s.carrier || '',
    flightNumber: s.flightNumber || '',
    origin: s.origin || '',
    destination: s.destination || '',
    departureTime: s.departureTime || '',
    arrivalTime: s.arrivalTime || '',
    flightTime: s.flightTime ?? 0,
    travelTime: s.travelTime ?? 0,
    distance: s.distance ?? 0,
    classOfService: s.classOfService || '',
    equipment: s.flightDetails?.[0]?.equipment || undefined,
    operatingCarrier: s.codeshareInfo?.operatingCarrier || undefined,
    operatingCarrierName: s.codeshareInfo?.value || undefined,
  }));
}

function parseSupplierSolution(sp: any): SupplierSolution | undefined {
  const sol = sp?.solution;
  if (!sol) return undefined;
  const api = sol.airPricingInfos?.[0];
  return {
    totalPrice: sol.totalPrice || '',
    basePrice: sol.basePrice || '',
    taxes: sol.taxes || '',
    fees: sol.fees || '',
    pricingMethod: api?.pricingMethod || undefined,
    refundable: api?.refundable,
    exchangeable: api?.exchangeable,
    fareCalc: api?.fareCalc || undefined,
    latestTicketingTime: api?.latestTicketingTime || undefined,
    changePenalties: (api?.changePenalties || []).map((p: any) => ({ amount: p.amount || '', application: p.application || '' })),
    cancelPenalties: (api?.cancelPenalties || []).map((p: any) => ({ amount: p.amount || '', application: p.application || '' })),
    taxInfos: (api?.taxInfos || []).map((t: any) => ({
      category: t.category || '',
      amount: t.amount || '',
      description: t.taxDetail?.description || '',
    })),
    baggageAllowance: (api?.baggageAllowances?.baggageAllowanceInfos || []).flatMap((b: any) => b.textInfos?.flatMap((ti: any) => ti.text) || []),
    carryOnAllowance: (api?.baggageAllowances?.carryOnAllowanceInfos || []).flatMap((b: any) => b.textInfos?.flatMap((ti: any) => ti.text) || []),
  };
}

function parseSearchContext(req: any): IntegrationSearchContext | undefined {
  const s = req?.search;
  if (!s) return undefined;
  return {
    searchId: s.searchId || '',
    adultsCount: s.adultsCount ?? 0,
    childrenCount: s.childrenCount ?? 0,
    infantsCount: s.infantsCount ?? 0,
    cabinType: s.cabinType || '',
    siteCode: s.siteCode || '',
    locale: s.locale || '',
    tripType: s.tripType || '',
    appType: s.appType || '',
    appBuild: s.appBuild,
    deviceType: s.deviceType || '',
    userLoggedIn: s.userLoggedIn ?? false,
    outboundDates: (s.trips || []).map((t: any) => t.outboundDate || ''),
    createdAt: s.createdAt || '',
  };
}

function parseContact(req: any): IntegrationContact | undefined {
  const c = req?.contact;
  if (!c) return undefined;
  return {
    email: c.email || '',
    fullName: c.fullName || '',
    phoneNumber: String(c.phoneNumber || ''),
    phonePrefix: String(c.phonePrefix || ''),
    countryCode: c.countryCode || '',
  };
}

function parseDynamicForms(respData: any): DynamicFormResult[] {
  const data = respData?.data || (Array.isArray(respData) ? respData : []);
  return (data || []).map((d: any) => ({
    priority: d.priority ?? 0,
    setId: d.setId ?? 0,
    validatingAirlineCodes: d.validatingAirlineCodes || [],
    routeTypes: d.routeTypes || [],
    conditionalPassengerTypes: d.conditionalPassengerTypes || [],
    requiredFields: d.requiredFields || [],
    optionalFields: d.optionalFields || [],
    requiredDocument: d.requiredDocument || '',
    conditionalNationalitiesCount: (d.conditionalNationalities || []).length,
  }));
}

function parseRevalidationBrands(respData: any): RevalidationBrandResult[] {
  const data = respData?.data || (Array.isArray(respData) ? respData : []);
  return (data || []).map((d: any) => ({
    bookingIpcc: d.bookingIpcc || '',
    integrationType: d.integrationType || '',
    type: d.type || '',
    refundType: d.refundType || '',
    brandCode: d.brandedLegs?.[0]?.brand?.code || '',
    brandName: d.brandedLegs?.[0]?.brand?.name || '',
    price: parseIntegrationPrice(d.price),
    adultPrice: parseIntegrationPrice(d.adultInfo?.passengerPrice?.price || d.adultInfo?.bookingPassengerPrice?.price),
    adultTaxes: parseTaxes(d.adultInfo?.passengerPrice?.taxes || d.adultInfo?.bookingPassengerPrice?.taxes),
    penalties: parsePenalties(d.penalties || d.adultInfo?.penalties),
    fees: parseFees(d.adultInfo?.fees),
    baggages: parseBaggages(d.adultInfo?.baggages),
  }));
}

function parseInsurancePackages(respData: any): IntegrationInsurancePackage[] {
  const data = respData?.data?.insurancePackages || respData?.insurancePackages || [];
  return (data || []).map((p: any) => ({
    uuid: p.uuid || '',
    type: p.type || '',
    title: p.title || '',
    status: p.status || '',
    confirmedOn: p.confirmedOn || undefined,
    supplier: p.supplier || '',
    totalAmount: p.price?.totalAmount ?? 0,
    totalTaxAmount: p.price?.totalTaxAmount ?? 0,
    totalAmountUsd: p.price?.totalAmountUsd ?? 0,
    currencyCode: p.price?.currencyCode || '',
    passengerNames: (p.insurances || []).flatMap((i: any) => i.passengerNames || []),
    cancellable: p.insurances?.[0]?.cancellable,
    termsUrl: p.insurances?.[0]?.termsAndConditionsUrl || '',
  }));
}

function parseAirlineDisclaimers(req: any): string[] {
  return (req?.airlineDisclaimers || []).map((d: any) => d.note?.name || d.note?.nameI18n?.en || '').filter(Boolean);
}

export function parseIntegrationCSV(text: string): FlattenedIntegrationEntry[] {
  const { rows } = parseCSV(text);
  return rows.map(row => flattenIntegrationEntry(row));
}

export function flattenIntegrationEntry(row: ParsedRow): FlattenedIntegrationEntry {
  const reqBody = row.request_body || '';
  const respBody = row.response_body || '';
  const reqData = tryParse(reqBody);
  const respData = tryParse(respBody);
  const errorRaw = row.error || '';
  const type = row.type || '';
  const url = row.url || '';

  // Extract itinerary from request
  const itinerary = reqData?.itinerary;
  const legs = parseIntegrationLegs(itinerary?.legs);
  const route = legs.map(l => {
    const dep = l.departureAirportCode;
    const arr = l.arrivalAirportCode;
    return `${dep} → ${arr}`;
  }).join(' · ');

  // Extract supplier params - could be in reqData.supplierParams or reqData.itinerary.supplierParams
  const supplierParams = reqData?.supplierParams || itinerary?.supplierParams || {};

  // Dynamic forms
  let dynamicForms: DynamicFormResult[] = [];
  if (type === 'INTEGRATION_DYNAMIC_FORMS') {
    dynamicForms = parseDynamicForms(respData);
  }

  // Revalidation brands
  let revalidationBrands: RevalidationBrandResult[] = [];
  if (type === 'INTEGRATION_REVALIDATION') {
    revalidationBrands = parseRevalidationBrands(respData);
  }

  // Insurance
  let insurancePackages: IntegrationInsurancePackage[] = [];
  if (type === 'VAS_INSURANCE_CONFIRM' || type === 'VAS_INSURANCE') {
    insurancePackages = parseInsurancePackages(respData);
  }

  return {
    ipcc: row.ipcc || '',
    itineraryRef: row.itinerary_ref || '',
    method: row.method || '',
    providerBrandedFaresCount: row.provider_branded_fares_count || '',
    requestedAt: row.requested_at || '',
    status: row.status || '',
    timeInMs: row.time_in_ms || '',
    type,
    url,
    wegoRef: row.wego_ref || '',
    orderId: row.order_id || '',
    brandedFareId: row.branded_fare_id || '',
    msFareId: row.ms_fare_id || '',
    queueNumber: row.queue_number || '',
    hasError: !!errorRaw,
    errorMessage: errorRaw ? (errorRaw.split('\n')[0] || errorRaw.slice(0, 200)) : '',
    timestamp: row.timestamp || '',
    date: row.date || '',

    fareId: reqData?.fareId || '',
    integrationType: reqData?.integrationType || '',
    validatingAirlineCode: itinerary?.validatingAirlineCode || reqData?.validatingAirlineCode || '',
    marketingAirlineCodes: reqData?.marketingAirlineCodes || [],
    operatingAirlineCodes: reqData?.operatingAirlineCodes || [],
    routeType: reqData?.routeType || '',
    departureCountryCodes: reqData?.departureCountryCodes || [],
    arrivalCountryCodes: reqData?.arrivalCountryCodes || [],
    providerCode: reqData?.providerCode || itinerary?.providerCode || '',

    route,
    tripType: itinerary?.tripType || '',
    domesticFlight: itinerary?.domesticFlight ?? false,
    legs,
    brandedFare: parseBrandedFareFromRequest(itinerary?.brandedFare),

    saba: parseSabaDetails(supplierParams),
    supplierSegments: parseSupplierSegments(supplierParams),
    supplierSolution: parseSupplierSolution(supplierParams),

    searchContext: parseSearchContext(reqData),
    contact: parseContact(reqData),

    dynamicForms,
    revalidationBrands,
    insurancePackages,

    airlineDisclaimers: parseAirlineDisclaimers(reqData),
    currencies: reqData?.currencies || {},

    _raw: row,
    _rawRequestBody: reqBody,
    _rawResponseBody: respBody,
  };
}
