import React, { useRef, useLayoutEffect, useState } from 'react';

interface ShipTooltipProps {
  hoveredPos: { x: number; y: number } | null;
  hoveredName: string | null;
  hoveredTime: string | null;
  hoveredRoT: number | null;
  hoveredHeading: number | null;
}

export function ShipTooltip({
  hoveredPos,
  hoveredName,
  hoveredTime,
  hoveredRoT,
  hoveredHeading,
}: ShipTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!hoveredPos || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const offset = 12; // Distance from cursor
    const padding = 10; // Padding from viewport edges

    let left = hoveredPos.x + offset;
    let top = hoveredPos.y + offset;

    // Check right edge
    if (left + rect.width + padding > window.innerWidth) {
      left = hoveredPos.x - rect.width - offset;
    }

    // Check bottom edge
    if (top + rect.height + padding > window.innerHeight) {
      top = hoveredPos.y - rect.height - offset;
    }

    // Check left edge (if flipped position goes off-screen)
    if (left < padding) {
      left = padding;
    }

    // Check top edge (if flipped position goes off-screen)
    if (top < padding) {
      top = padding;
    }

    setPosition({ left, top });
  }, [hoveredPos, hoveredName, hoveredTime, hoveredRoT, hoveredHeading]);

  if (!hoveredPos) return null;

  return (
    <div
      ref={tooltipRef}
      className="absolute z-[2000] pointer-events-none bg-black/75 text-white p-1.5 rounded text-xs"
      style={{ left: position.left, top: position.top }}
    >
      {hoveredName ? <div className="font-semibold">{hoveredName}</div> : null}
      {hoveredTime ? <div className="text-[11px] opacity-90">{hoveredTime}</div> : null}
      {typeof hoveredRoT === 'number' ? <div className="text-[11px] opacity-90">RoT: {Number(hoveredRoT).toFixed(1)}</div> : null}
      {typeof hoveredHeading === 'number' ? <div className="text-[11px] opacity-90">Heading: {Number(hoveredHeading).toFixed(1)}°</div> : null}
    </div>
  );
}
