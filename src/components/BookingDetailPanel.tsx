import React from 'react';
import { BookingResponse } from '../models/WegoBookingModel';
import { 
  CreditCard, Users, Plane, CheckCircle2, Clock, 
  MapPin, Shield, Tag, AlertCircle, FileText 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface BookingDetailPanelProps {
  details: BookingResponse;
}

export function BookingDetailPanel({ details }: BookingDetailPanelProps) {
  return (
    <div className="space-y-6 mt-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Top level status */}
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
            <div className="text-2xl font-bold">{details.paymentStatus}</div>
            {(details.payments || []).length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                via {details.payments[0].paymentMethodName || details.payments[0].paymentMethodCode}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4" /> Passengers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(details.passengers || []).length}</div>
            <p className="text-xs text-slate-400 mt-2">{details.contact?.email}</p>
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
          {/* Itineraries */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                <Plane className="w-5 h-5 text-indigo-400" /> Itineraries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(details.itineraries || []).map((itin, i) => (
                <div key={i} className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
                  <div className="font-medium text-slate-200 mb-4 pb-2 border-b border-slate-700/50">
                    Routing: {itin.departureAirportCode} → {itin.arrivalAirportCode}
                  </div>
                  <div className="space-y-4">
                    {(itin.segments || []).map((seg, j) => (
                      <div key={j} className="flex gap-4 items-start relative pl-6 pb-2">
                        <div className="absolute left-[11px] top-2 bottom-0 w-px bg-slate-700"></div>
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-center bg-slate-800/80 p-3 rounded-lg border border-slate-700/30">
                            <div>
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="font-bold text-slate-200">{seg.departureAirportCode}</span>
                                <span className="text-slate-500">→</span>
                                <span className="font-bold text-slate-200">{seg.arrivalAirportCode}</span>
                                {seg.marketingAirlineCode && (
                                  <Badge variant="outline" className="border-slate-600 text-slate-400 ml-2">
                                    {seg.marketingAirlineCode} {seg.marketingFlightNumber}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                {seg.departureDateTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {new Date(seg.departureDateTime).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                                {seg.cabin || 'ECONOMY'}
                              </Badge>
                              {seg.statusLabel && (
                                <div className="text-xs text-emerald-400 mt-2 flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> {seg.statusLabel}
                                </div>
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

          {/* Passengers */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                <Users className="w-5 h-5 text-indigo-400" /> Travelers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(details.passengers || []).map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                        {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">
                          {p.titleType} {p.firstName} {p.lastName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          {p.nationality && <span>{p.nationality}</span>}
                          {p.documentId && <span className="flex items-center gap-1"><FileText className="w-3 h-3"/>{p.documentId}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                <Tag className="w-5 h-5 text-indigo-400" /> Fares & Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(details.payments || []).map((pm, i) => (
                <div key={i} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                  <div className="flex justify-between font-medium text-slate-200">
                    <span>{pm.paymentMethodName || 'Payment'}</span>
                    <span>{pm.currencyCode} {pm.amount}</span>
                  </div>
                  {(pm.paymentFeeAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                      <span>Payment Fee</span>
                      <span>{pm.currencyCode} {pm.paymentFeeAmount}</span>
                    </div>
                  )}
                  {pm.status && (
                    <div className="mt-2 text-xs px-2 py-1 bg-slate-700/50 text-slate-300 inline-block rounded">
                      Status: {pm.status}
                    </div>
                  )}
                </div>
              ))}
              
              {details.brandedFares && details.brandedFares.map((fare, i) => (
                <div key={i} className="flex flex-col p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  <span className="text-xs font-semibold uppercase">{fare.code}</span>
                  <span className="font-medium">{fare.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {details.policy && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                  <Shield className="w-5 h-5 text-indigo-400" /> Fare Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between p-2 rounded bg-slate-800/30">
                  <span className="text-slate-400">Cancellation</span>
                  <span className={details.policy.cancellationAllowed ? "text-emerald-400" : "text-rose-400"}>
                    {details.policy.cancellationAllowed ? (details.policy.cancellationFee ? `${details.policy.currencyCode} ${details.policy.cancellationFee}` : 'Allowed') : 'Not Allowed'}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-800/30">
                  <span className="text-slate-400">Modification</span>
                  <span className={details.policy.modificationAllowed ? "text-emerald-400" : "text-rose-400"}>
                    {details.policy.modificationAllowed ? (details.policy.modificationFee ? `${details.policy.currencyCode} ${details.policy.modificationFee}` : 'Allowed') : 'Not Allowed'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {details.insurancePackages && details.insurancePackages.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                  <Shield className="w-5 h-5 text-amber-500" /> Insurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {details.insurancePackages.map((ins, i) => (
                  <div key={i} className="p-3 bg-slate-800/50 border border-amber-500/20 rounded-lg">
                    <div className="font-medium text-slate-200">{ins.title || ins.type}</div>
                    {ins.supplier && <div className="text-xs text-slate-400 mt-1">{ins.supplier}</div>}
                    {(ins.amount || ins.price?.amount) && (
                      <div className="text-amber-400 mt-2 font-medium">
                        {ins.currency || ins.price?.currencyCode} {ins.amount || ins.price?.amount}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
