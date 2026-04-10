import { useState, useEffect, useRef } from 'react';
import { BookingResponse, safeParseBookingResponse } from '../models/WegoBookingModel';

interface UseBookingSyncReturn {
  data: BookingResponse;
  isPolling: boolean;
  manualRefresh: () => void;
  error: string | null;
}

export function useBookingSync(initialData: BookingResponse): UseBookingSyncReturn {
  const [data, setData] = useState<BookingResponse>(() => {
    // Part 6: Offline Caching & Sync (Read from local cache on mount)
    if (typeof window !== 'undefined' && initialData.bookingRef) {
      const cached = localStorage.getItem(`booking_${initialData.bookingRef}`);
      if (cached) {
        const parsed = safeParseBookingResponse(cached);
        if (parsed.success) {
          // If cached data's last synced time is newer than initial payload, prefer cache
          const cachedSyncedAt = parsed.data.partnerPnrStatuses?.[0]?.lastSyncedAt || '';
          const initialSyncedAt = initialData.partnerPnrStatuses?.[0]?.lastSyncedAt || '';
          if (cachedSyncedAt >= initialSyncedAt) {
            return parsed.data;
          }
        }
      }
    }
    return initialData;
  });

  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const backoffRef = useRef(5000); // Start at 5 seconds
  const maxBackoff = 30000; // Cap at 30 seconds
  const maxPollingTime = 30 * 60 * 1000; // 30 minutes
  const startTimeRef = useRef(Date.now());

  // Part 7: Analytics & Debug Logging wrapper
  const logEvent = (eventName: string, meta: Record<string, any> = {}) => {
    const payload = {
      event: eventName,
      bookingRef: data.bookingRef,
      wegoOrderId: data.bookingMetadata?.wegoOrderId || 'UNKNOWN',
      timestamp: new Date().toISOString(),
      ...meta
    };
    console.debug(`[Analytics Tracker]`, payload);
  };

  const fetchLatestStatus = async () => {
    logEvent('booking_sync_attempt', { backoffMs: backoffRef.current });
    try {
      // Mocking the real endpoint call in the Web application
      setIsPolling(true);
      const res = await fetch(`/v2/details?syncBooking=true&bookingRef=${data.bookingRef}`);
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      
      const jsonStr = await res.text();
      const parsed = safeParseBookingResponse(jsonStr);
      
      if (parsed.success) {
        const newData = parsed.data;
        
        // Log state transition
        if (data.paymentStatus === 'AUTH_PENDING' && newData.paymentStatus === 'CAPTURED') {
          logEvent('payment_state_transition', { from: 'AUTH_PENDING', to: 'CAPTURED' });
        }
        
        setData(newData);
        
        // Persist to local storage
        localStorage.setItem(`booking_${newData.bookingRef}`, JSON.stringify(newData));
        setError(null);
        return newData;
      } else {
        logEvent('parsing_failure', { error: parsed.error });
        throw new Error('Failed to parse updated booking response');
      }
    } catch (err: any) {
      logEvent('network_sync_error', { message: err.message });
      setError(err.message);
      return null;
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    // Persist init data cleanly
    if (initialData.bookingRef) {
       localStorage.setItem(`booking_${initialData.bookingRef}`, JSON.stringify(initialData));
    }
  }, [initialData]);

  useEffect(() => {
    // Check if we need to poll (Part 4)
    const needsPolling = 
      data.paymentStatus === 'AUTH_PENDING' || 
      data.paymentStatus === 'AUTHORIZED' || 
      data.responseCode >= 50000;
      
    if (needsPolling) {
      if (Date.now() - startTimeRef.current > maxPollingTime) {
        logEvent('polling_timeout');
        setError('Payment processing is taking longer than expected. Please check back later.');
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        const result = await fetchLatestStatus();
        
        // Exponential backoff adjustment
        if (result && (result.paymentStatus === 'CAPTURED' || result.responseCode < 50000)) {
           // Success! Stop polling.
           clearTimeout(timeoutRef.current);
        } else {
           // Still pending or error, backoff and recurse
           backoffRef.current = Math.min(backoffRef.current * 1.5, maxBackoff);
        }
      }, backoffRef.current);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data.paymentStatus, data.responseCode]);

  // Expose a manual refresh for the UI (e.g. for 50000 anomalies)
  const manualRefresh = () => {
    logEvent('manual_refresh_triggered');
    backoffRef.current = 5000; // reset backoff
    startTimeRef.current = Date.now(); // reset timeouts
    fetchLatestStatus();
  };

  return { data, isPolling, manualRefresh, error };
}
