import React, { useState } from 'react';
import { BookingResponse } from '../models/WegoBookingModel';
import { useBookingSync } from '../hooks/useBookingSync';
import { 
  CreditCard, Users, Plane, CheckCircle2, Clock, 
  MapPin, Shield, Tag, AlertCircle, FileText,
  Briefcase, ChevronDown, ChevronUp, RefreshCw, XCircle, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface BookingDetailPanelProps {
  initialDetails: BookingResponse;
}

export function BookingDetailPanel({ initialDetails }: BookingDetailPanelProps) {
  // Part 4, 6: Connect custom hook for state polling and persistence
  const { data: details, isPolling, manualRefresh, error } = useBookingSync(initialDetails);
  
  const [showTaxes, setShowTaxes] = useState(false);
  const [showRawRules, setShowRawRules] = useState(false);

  // 3.7 Fare rules extraction util
  const extractFareRulesBullets = (text: string) => {
    if (!text) return [];
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    // Simple mock extraction based on common keywords
    const highlights = lines.filter(l => 
      l.toLowerCase().includes('change') || 
      l.toLowerCase().includes('cancel') || 
      l.toLowerCase().includes('stopover') ||
      l.toLowerCase().includes('penalty')
    ).slice(0, 5); // Limit to top 5
    return highlights.length > 0 ? highlights : lines.slice(0, 3); // fallback to first 3
  };

  const isAuthPending = details.paymentStatus === 'AUTH_PENDING' || details.paymentStatus === 'AUTHORIZED';
  const isAnomaly = details.responseCode >= 50000;
  
  const pnrStatus = details.partnerPnrStatuses?.[0] || null;
  const price = details.price;
  const isBnpl = details.payments?.some(p => p.paymentMethodCode?.includes('bnpl_4_installments'));

  return (
    <div className="space-y-6 mt-4 w-full relative">
      
      {/* Loading Overlay for Part 4 & Part 5 Anomalies */}
      {(isAuthPending || isAnomaly) && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-4 flex items-center justify-between mb-6 animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 text-indigo-400 ${isPolling ? 'animate-spin' : ''}`} />
            <div>
              <p className="font-semibold text-indigo-300">
                 {isAnomaly ? "We're confirming your booking. This may take a few minutes." : "Payment processing..."}
              </p>
              <p className="text-xs text-indigo-400/70 mt-1">Status will update automatically.</p>
            </div>
          </div>
          <button 
            onClick={manualRefresh}
            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs rounded transition-colors"
          >
            Refresh Now
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-lg p-4 flex items-center gap-3 mb-6">
           <XCircle className="w-5 h-5 text-rose-500" />
           <p className="text-sm font-medium text-rose-300">{error}</p>
        </div>
      )}

      {/* --- Section 3.1 & 3.8: Status Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Booking Ref</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{details.bookingRef}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={details.status === 'CONFIRMED' ? 'default' : 'secondary'} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                {details.status}
              </Badge>
              {pnrStatus?.overallTicketStatus && (
                <Badge variant="outline" className="border-slate-700 text-slate-300">
                  TKT: {pnrStatus.overallTicketStatus}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold flex items-center gap-2">
                {details.paymentStatus} 
                {isAuthPending && <span className="flex w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
            </div>
            {details.refundType && <p className="text-xs text-rose-400 mt-1">Refund: {details.refundType}</p>}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Fare Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {details.brandedFares?.[0] ? (
              <>
                 <div className="text-lg font-bold">{details.brandedFares[0].name}</div>
                 <div className="text-xs text-slate-400 mt-1 font-mono">{details.brandedFares[0].code}</div>
              </>
            ) : (
                 <div className="text-lg font-bold text-slate-500">Standard</div>
            )}
            {pnrStatus?.lastSyncedAt && (
              <div className="text-[10px] text-slate-500 mt-2 truncate">Synced: {pnrStatus.lastSyncedAt}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Response Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className={details.responseCode >= 50000 ? "text-rose-500" : "text-emerald-500"}>
                {details.responseCode}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* --- Section 3.3: Flight Itinerary --- */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                <Plane className="w-5 h-5 text-indigo-400" /> Flight Itinerary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(details.itineraries || []).map((itin, i) => (
                <div key={i} className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
                  <div className="font-medium text-slate-200 mb-4 pb-2 border-b border-slate-700/50 flex justify-between">
                    <span>{itin.departureAirportCode} → {itin.arrivalAirportCode}</span>
                    <span className="text-sm text-slate-400">{Math.floor((itin.durationMinutes || 0)/60)}h {(itin.durationMinutes || 0)%60}m</span>
                  </div>
                  <div className="space-y-6">
                    {(itin.segments || []).map((seg, j) => (
                      <div key={j} className="flex gap-4 items-start relative pl-6 pb-2">
                        {j < (itin.segments?.length || 0) - 1 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-700"></div>}
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center">
                          <Plane className="w-3 h-3 text-indigo-500" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/30">
                            
                            {/* Airline Header */}
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-300">
                                  {seg.marketingAirlineName || seg.marketingAirlineCode} {seg.marketingFlightNumber}
                                </span>
                                {seg.airlineRef && (
                                  <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700 text-slate-400">
                                    PNR: {seg.airlineRef}
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="secondary" className="bg-slate-800 text-slate-400">{seg.cabin || 'ECONOMY'}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative">
                               <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800"></div>
                               {/* Departure */}
                               <div className="pr-4">
                                  <div className="text-2xl font-bold text-slate-200">{seg.departureAirportCode}</div>
                                  <div className="text-xs text-slate-400 truncate mt-1">{seg.departureAirportName || seg.departureCityName}</div>
                                  {seg.departureDateTime && (
                                    <div className="mt-2 text-sm text-indigo-300 flex items-center gap-1">
                                      <Clock className="w-3 h-3"/>
                                      {new Date(seg.departureDateTime).toLocaleString(undefined, {
                                        hour: '2-digit', minute:'2-digit', timeZoneName: 'short'
                                      })}
                                    </div>
                                  )}
                               </div>
                               {/* Arrival */}
                               <div className="pl-4">
                                  <div className="text-2xl font-bold text-slate-200">{seg.arrivalAirportCode}</div>
                                  <div className="text-xs text-slate-400 truncate mt-1">{seg.arrivalAirportName || seg.arrivalCityName}</div>
                                  {seg.arrivalDateTime && (
                                    <div className="mt-2 text-sm text-indigo-300 flex items-center gap-1">
                                      <Clock className="w-3 h-3"/>
                                      {new Date(seg.arrivalDateTime).toLocaleString(undefined, {
                                        hour: '2-digit', minute:'2-digit', timeZoneName: 'short'
                                      })}
                                    </div>
                                  )}
                               </div>
                            </div>
                            
                            {/* Statuses */}
                            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
                              {seg.statusLabel && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" /> {seg.statusLabel}
                                </span>
                              )}
                              {seg.segmentTicketStatus && (
                                <span className="text-slate-400">TKT: {seg.segmentTicketStatus}</span>
                              )}
                              {seg.hasScheduleChange && (
                                <span className="text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Schedule Changed</span>
                              )}
                              {(seg.durationMinutes ?? 0) > 0 && (
                                <span className="ml-auto text-slate-500">{Math.floor((seg.durationMinutes || 0)/60)}h {(seg.durationMinutes || 0)%60}m flt</span>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* --- Section 3.2: Passengers --- */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400" /> Travelers & Contact</span>
                <span className="text-sm font-normal text-slate-400">{details.contact?.email} • +{details.contact?.phonePrefix} {details.contact?.phoneNumber}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(details.passengers || []).map((p, i) => (
                  <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 parseounded-lg bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                        {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">
                          {p.titleType} {p.firstName} {p.lastName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                          {p.dateOfBirth && <span>DOB: {p.dateOfBirth}</span>}
                          {p.nationality && <span>Nat: {p.nationality}</span>}
                        </div>
                      </div>
                    </div>
                    {p.documentId && (
                       <Badge variant="outline" className="mt-2 md:mt-0 border-slate-600 text-slate-300 flex items-center gap-2">
                         <FileText className="w-3 h-3"/> Passport: {p.documentId}
                       </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* --- Section 3.4: Baggage Allowance --- */}
          {(details.baggage?.length || details.baggage_mapping?.length) ? (
            <Card className="bg-slate-900 border-slate-800">
               <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                    <Briefcase className="w-5 h-5 text-indigo-400" /> Baggage Allowance
                  </CardTitle>
               </CardHeader>
               <CardContent>
                 {details.baggage_mapping ? (
                    <div className="space-y-4 text-sm">
                      {/* Using flat mapping if deeply nested arrays are complex, simplified here */}
                       <div className="p-3 bg-slate-800/40 rounded border border-slate-700/50 flex gap-4 overflow-x-auto">
                          {details.baggage_mapping.flat(2).map((bag: any, bIdx: number) => (
                            <div key={bIdx} className="min-w-[120px] bg-slate-900 p-3 rounded border border-slate-700">
                               <div className="text-xs font-bold text-slate-400 mb-2">{bag.type}</div>
                               <div className="text-lg text-slate-200 font-semibold">{bag.weight}{bag.unit}</div>
                               {bag.pieceCount && <div className="text-xs text-slate-500 mt-1">{bag.pieceCount} Pieces</div>}
                               <Badge className="mt-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 border-none">Included</Badge>
                            </div>
                          ))}
                       </div>
                    </div>
                 ) : (
                    <p className="text-slate-500 text-sm">See basic baggage config</p>
                 )}
               </CardContent>
            </Card>
          ) : null}

        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          
          {/* --- Section 3.5 & Part 5: Price Breakdown & BNPL --- */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-400" /> Price</span>
                <span className="text-xl text-emerald-400 font-bold">{price?.summary?.userCurrencyCode || 'USD'} {price?.summary?.userTotalAmount || details.payments?.[0]?.amount}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {price?.summary?.userBaseAmount && (
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Base Fare</span>
                  <span>{price.summary.userBaseAmount}</span>
                </div>
              )}
              
              {/* Expandable Taxes */}
              {price?.taxes && price.taxes.length > 0 && (
                <div className="border border-slate-700/60 rounded-md overflow-hidden transition-all bg-slate-900">
                  <button 
                    onClick={() => setShowTaxes(!showTaxes)}
                    className="w-full flex justify-between items-center p-3 text-sm text-slate-300 hover:bg-slate-800/50"
                  >
                    <span>Taxes & Surcharges ({price.taxes.length})</span>
                    <div className="flex items-center gap-2">
                      <span>{price.summary?.userTaxAmount}</span>
                      {showTaxes ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </div>
                  </button>
                  {showTaxes && (
                    <div className="px-3 pb-3 pt-1 space-y-2 bg-slate-950/50 border-t border-slate-800">
                      {price.taxes.map((t, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-400">
                          <span>{t.code} - {t.description}</span>
                          <span>{t.currencyCode || price.summary?.userCurrencyCode} {t.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {price?.summary?.userTotalBookingFee && (
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Wego Booking Fee</span>
                  <span>{price.summary.userTotalBookingFee}</span>
                </div>
              )}

              <Separator className="bg-slate-700/50" />

              {/* Part 5: BNPL Handling */}
              {(details.payments || []).map((pm, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between font-medium text-sm text-indigo-300">
                    <span className="flex items-center gap-2">
                       {pm.paymentMethodCode?.includes('bnpl_4_installments') ? '4 interest free payments' : (pm.paymentMethodName || 'Payment')}
                    </span>
                    <span>{pm.currencyCode} {pm.chargedAmount || pm.amount}</span>
                  </div>
                  
                  {isBnpl && pm.paymentMethodCode?.includes('bnpl_4_installments') && (
                     <div className="pl-4 border-l-2 border-indigo-500/30 text-xs text-slate-400 py-1 space-y-1">
                        <p>Total separated into 4 installments</p>
                        <p>Status: {pm.status}</p>
                     </div>
                  )}
                  
                  {(pm.paymentFeeAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-xs text-slate-400 bg-slate-800/30 p-2 rounded">
                      <span>Payment processing fee ({isBnpl ? 'BNPL Fee' : 'Card Fee'})</span>
                      <span>{pm.currencyCode} {pm.paymentFeeAmount}</span>
                    </div>
                  )}
                </div>
              ))}
              
            </CardContent>
          </Card>

          {/* --- Section 3.6: Penalties & Fees --- */}
          {(details.policy || details.penalties?.fees) && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                  <Shield className="w-5 h-5 text-rose-400" /> Penalties & Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                
                {details.policy && (
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 rounded bg-slate-800/30">
                      <span className="text-slate-400">Cancel Fee (Policy)</span>
                      <span className={details.policy.cancellationAllowed ? "text-slate-200 font-medium" : "text-rose-400"}>
                        {details.policy.cancellationAllowed ? (details.policy.cancellationFee ? `${details.policy.currencyCode} ${details.policy.cancellationFee}` : 'Allowed') : 'Not Allowed'}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-800/30">
                      <span className="text-slate-400">Change Fee (Policy)</span>
                      <span className={details.policy.modificationAllowed ? "text-slate-200 font-medium" : "text-rose-400"}>
                        {details.policy.modificationAllowed ? (details.policy.modificationFee ? `${details.policy.currencyCode} ${details.policy.modificationFee}` : 'Allowed') : 'Not Allowed'}
                      </span>
                    </div>
                  </div>
                )}
                
                {details.penalties?.fees && details.penalties.fees.length > 0 && (
                  <>
                    <Separator className="bg-slate-700/50 my-2"/>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Airline Specific Fees</p>
                    {details.penalties.fees.map((f, i) => (
                       <div key={i} className="flex justify-between text-xs text-slate-300">
                          <span>{f.type} Fee</span>
                          <span>USD {f.amountInUsd || f.amount}</span>
                       </div>
                    ))}
                  </>
                )}

              </CardContent>
            </Card>
          )}

          {/* --- Section 3.7: Fare Rules Summary --- */}
          {details.flightFareRules && (
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                    <Info className="w-5 h-5 text-indigo-400" /> Fare Rules Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <ul className="list-disc pl-4 space-y-2 text-sm text-slate-300 mb-4">
                      {extractFareRulesBullets(details.flightFareRules).map((str, idx) => (
                         <li key={idx} className="line-clamp-2" title={str}>{str}</li>
                      ))}
                   </ul>

                   <button 
                     onClick={() => setShowRawRules(!showRawRules)}
                     className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                   >
                     {showRawRules ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                     {showRawRules ? 'Hide Rules' : 'View Full Fare Rules'}
                   </button>

                   {showRawRules && (
                      <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800 max-h-60 overflow-y-auto">
                         <pre className="text-[10px] text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                            {details.flightFareRules}
                         </pre>
                      </div>
                   )}
                </CardContent>
             </Card>
          )}

        </div>
      </div>
    </div>
  );
}
