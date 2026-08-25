/**
 * Ship-related formatting utilities and constants
 */

export const NAV_STATUS_LABELS: Record<number, string> = {
  0: 'under way using engine',
  1: 'at anchor',
  2: 'not under command',
  3: 'restricted maneuverability',
  4: 'constrained by her draught',
  5: 'moored',
  6: 'aground',
  7: 'engaged in fishing',
  8: 'under way sailing',
  9: 'reserved (DG/HS/MP or HSC category C)',
  10: 'reserved (DG/HS/MP or IMO category A / WIG)',
  11: 'power-driven vessel towing astern (regional use)',
  12: 'power-driven vessel pushing ahead or towing alongside (regional use)',
  13: 'reserved for future use',
  14: 'AIS-SART / MOB-AIS / EPIRB-AIS',
  15: 'undefined / default',
};

export const formatNavStatus = (val: any): string => {
  if (val == null) return '—';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return NAV_STATUS_LABELS[n] ?? String(n);
};

export const extractCoordinates = (ship: any): { lon: number; lat: number } | null => {
  const lon = ship.longitude ?? ship.long ?? ship.lon ?? ship.lng ?? null;
  const lat = ship.latitude ?? ship.lat ?? null;
  return (typeof lon === 'number' && typeof lat === 'number') ? { lon, lat } : null;
};

export const extractShipId = (ship: any): string | number | null => {
  return ship.id ?? ship.mmsi ?? ship.MMSI ?? null;
};

export const getShipName = (ship: any): string => {
  return ship.name ?? ship.ShipName ?? ship.shipName ?? 'Unknown';
};

export const CLOSE_ZOOM = 13;
export const DEBOUNCE_MS = 500;
export const SESSION_MS = 15 * 60 * 1000; // 15 minutes
