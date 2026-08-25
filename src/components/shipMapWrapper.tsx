'use client';

import dynamic from 'next/dynamic';

const ShipMapDeck = dynamic(() => import('../components/shipMapDeck'), { ssr: false });

export default function ShipMapWrapper() {
  return <div style={{ height: '100vh' }}><ShipMapDeck/></div>;
}