import React, { useRef, useLayoutEffect, useState } from 'react';
import { formatNavStatus } from '../utils/shipFormatters';

interface SelectedShipPanelProps {
  selected: any | null;
  loadingDetails: boolean;
  onClose: () => void;
}

export function SelectedShipPanel({ selected, loadingDetails, onClose }: SelectedShipPanelProps) {
  const selectedPanelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: 10,
    top: 10,
  });

  useLayoutEffect(() => {
    if (!selected || !selected.pos) return;
    let cancelled = false;

    const measureAndPosition = () => {
      const panel = selectedPanelRef.current;
      const panelW = panel?.offsetWidth ?? 300;
      const panelH = panel?.offsetHeight ?? 220;
      const margin = 16; // Increased margin for mobile
      const navbarHeight = 64; // Height of navbar
      let left = (selected.pos?.x ?? 0) + 10;

      // clamp horizontally
      if (left + panelW + margin > window.innerWidth) {
        left = Math.max(margin, window.innerWidth - panelW - margin);
      }
      if (left < margin) left = margin;

      // prefer placing above the point; if not enough space, place below
      let top = (selected.pos?.y ?? 0) - panelH - 10;
      // Account for navbar at top
      if (top < margin + navbarHeight) {
        top = (selected.pos?.y ?? 0) + 20;
        if (top + panelH + margin > window.innerHeight) {
          top = Math.max(margin + navbarHeight, window.innerHeight - panelH - margin);
        }
      }
      if (!cancelled) setPanelStyle({ position: 'fixed', left, top, maxHeight: `calc(100vh - ${navbarHeight + margin * 2}px)`, overflowY: 'auto' });
    };

    requestAnimationFrame(measureAndPosition);
    const onResize = () => requestAnimationFrame(measureAndPosition);
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
  }, [selected]);

  if (!selected || !selected.pos) return null;

  return (
    <div ref={selectedPanelRef} className="z-[2100] pointer-events-auto max-w-[calc(100vw-32px)]" style={panelStyle}>
      <div className="bg-white dark:bg-white p-2.5 rounded-lg shadow-lg min-w-[200px] max-w-full text-gray-900 dark:text-gray-900">
        <div className="flex justify-between items-center">
          <strong className="text-gray-900 dark:text-gray-900">{selected.name ?? selected.ShipName ?? 'Unknown'}</strong>
          <button onClick={onClose} className="ml-2">
            ✕
          </button>
        </div>
        <div className="text-sm mt-2 text-gray-900 dark:text-gray-900">
          {loadingDetails ? <div className="mb-1.5 italic text-gray-700 dark:text-gray-700">Loading details…</div> : null}
          <div>
            <strong>MMSI:</strong> {selected.id ?? selected.mmsi}
          </div>
          <div>
            <strong>Lat:</strong> {selected.lat}
          </div>
          <div>
            <strong>Lon:</strong> {selected.lon}
          </div>
          <div>
            <strong>RoT:</strong> {selected.rateOfTurn ?? selected.RateOfTurn ?? '—'}
          </div>
          <div>
            <strong>Heading:</strong> {selected.trueHeading ?? selected.TrueHeading ?? '—'}
          </div>
          <div>
            <strong>COG:</strong> {selected.cog ?? selected.Cog ?? '—'}
          </div>
          <div>
            <strong>SOG:</strong> {selected.sog ?? selected.Sog ?? selected.SOG ?? '—'}
          </div>
          <div>
            <strong>Navigational status:</strong>{' '}
            {formatNavStatus(selected.navigationalStatus ?? selected.NavigationalStatus)}
          </div>
          <div className="mt-1.5">
            <strong>When:</strong> {selected.timeLabel}
          </div>
          {selected.timeUtc ? (
            <div>
              <strong>Raw:</strong> {selected.timeUtc}
            </div>
          ) : null}
          {selected.ShipName ? (
            <div>
              <strong>Name:</strong> {selected.ShipName}
            </div>
          ) : null}
          {selected.staticData ? (
            <div className="mt-2">
              <strong>Static data</strong>
              <div>
                <strong>Callsign:</strong> {selected.staticData.callSign ?? '—'}
              </div>
              <div>
                <strong>Destination:</strong> {selected.staticData.destination ?? '—'}
              </div>
              <div>
                <strong>Dimensions (A/B/C/D):</strong>{' '}
                {`${selected.staticData.dimensionA ?? 0}/${selected.staticData.dimensionB ?? 0}/${
                  selected.staticData.dimensionC ?? 0
                }/${selected.staticData.dimensionD ?? 0}`}
              </div>
              <div>
                <strong>ETA:</strong>{' '}
                {selected.staticData.etaDay != null
                  ? `${selected.staticData.etaDay}/${selected.staticData.etaMonth ?? ''} ${
                      selected.staticData.etaHour ?? ''
                    }:${selected.staticData.etaMinute ?? ''}`
                  : '—'}
              </div>
              <div>
                <strong>Max Draught:</strong> {selected.staticData.maximumStaticDraught ?? 0}
              </div>
              <div>
                <strong>Valid:</strong> {selected.staticData.valid ? 'Yes' : 'No'}
              </div>
              {selected.staticData.createdAt ? (
                <div>
                  <strong>Created:</strong> {new Date(selected.staticData.createdAt).toLocaleString()}
                </div>
              ) : null}
              {selected.staticData.updatedAt ? (
                <div>
                  <strong>Updated:</strong> {new Date(selected.staticData.updatedAt).toLocaleString()}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
