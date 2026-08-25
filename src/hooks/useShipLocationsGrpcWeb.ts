import { useEffect, useState, useRef, useCallback } from 'react';
import { ShipServiceClient } from '../gen/ship.client';
import type { SubscribeRequest } from '../gen/ship';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';

type BBox = { minLat: number; minLon: number; maxLat: number; maxLon: number } | null;

export function useShipLocationsGrpcWeb(endpoint: string, bbox: BBox, opts?: { refreshIntervalMs?: number, enabled?: boolean }) {
  const refreshIntervalMs = opts?.refreshIntervalMs ?? 30_000;
  const enabled = opts?.enabled ?? true;
  const [positionsArray, setPositionsArray] = useState<any[]>([]);
  const clientRef = useRef<ShipServiceClient | null>(null);
  const activeCallRef = useRef<any | null>(null);

  // stable bbox key so object identity doesn't retrigger effects
  const bboxKey = bbox ? `${bbox.minLat}:${bbox.minLon}:${bbox.maxLat}:${bbox.maxLon}` : '';

  const close = useCallback(() => {
    try {
      if (activeCallRef.current && typeof activeCallRef.current.cancel === 'function') {
        activeCallRef.current.cancel();
      }
    } catch (e) {
      // ignore
    }
    activeCallRef.current = null;
    try { clientRef.current = null; } catch (e) {}
  }, []);

  useEffect(() => {
    // If disabled, ensure any active call is cancelled immediately and do nothing.
    if (!enabled) {
      try { close(); } catch (e) { /* ignore */ }
      return;
    }

    if (!bbox) return;

    // create transport in binary mode so Content-Type is application/grpc-web+proto
    const transport = new GrpcWebFetchTransport({ baseUrl: endpoint, format: 'binary' as any });
    const client = new ShipServiceClient(transport);
    clientRef.current = client;

    const req: SubscribeRequest = { box: { minLat: bbox.minLat, minLon: bbox.minLon, maxLat: bbox.maxLat, maxLon: bbox.maxLon } };

    let mounted = true;
    // Unary polling: call the RPC and await `call.response` (a Promise) every refreshIntervalMs.
    const fetchSnapshot = async () => {
      if (!clientRef.current) return;
      // cancel any previous active call before starting new one
      try {
        if (activeCallRef.current && typeof activeCallRef.current.cancel === 'function') {
          try { activeCallRef.current.cancel(); } catch (e) {}
        }
      } catch (e) {}

      let call: any = null;
      try {
        call = clientRef.current.subscribe(req);
        activeCallRef.current = call;
        // `call.response` is a Promise (thenable) for unary calls from protobuf-ts
        if (call && call.response && typeof (call.response as any).then === 'function') {
          const res = await call.response;
          if (!mounted) return;
          const ships = res?.ships ?? [];
          setPositionsArray(
            ships.map((s: any) => ({
              id: s.id,
              mmsi: s.mmsi,
              latitude: s.latitude,
              longitude: s.longitude,
              name: s.name,
              heading: s.heading,
              timeUtc: s.timeUtc ?? '',
              cog: s.cog,
            })),
          );
        } else {
          // If the client doesn't expose a unary response promise, log shape for debugging
          console.error('useShipLocationsGrpcWeb: client.subscribe did not return a unary response promise', { call });
        }
      } catch (err) {
        console.error('useShipLocationsGrpcWeb fetchSnapshot error', err);
      } finally {
        if (activeCallRef.current === call) activeCallRef.current = null;
        try { if (call && typeof call.cancel === 'function') call.cancel(); } catch (e) {}
      }
    };

    // immediately fetch one snapshot and then poll
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, refreshIntervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
      try { if (activeCallRef.current && typeof activeCallRef.current.cancel === 'function') activeCallRef.current.cancel(); } catch (e) {}
      activeCallRef.current = null;
      clientRef.current = null;
    };
  }, [endpoint, bboxKey, refreshIntervalMs, enabled, close]);

  return { positionsArray, close };
}
