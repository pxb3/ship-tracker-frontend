import type { NextApiRequest, NextApiResponse } from 'next';

// Simple binary proxy for grpc-web requests. Forwards everything to GRPC_WEB_PROXY_URL
// Default target is http://localhost:8085 (Envoy). Set GRPC_WEB_PROXY_URL to change.

export const config = {
  api: {
    bodyParser: false, // we need raw body
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const proxyBase = process.env.GRPC_WEB_PROXY_URL || 'http://localhost:8085';
    // req.query.path is the catch-all segments
    const pathSegments = req.query.path as string[] | undefined;
    let path = pathSegments ? '/' + pathSegments.join('/') : '/';

    // If caller supplied only the RPC method (e.g. /Subscribe), normalize to the full
    // gRPC service path expected by the backend (package.Service/Method).
    // This helps quick tests (curl) that call /Subscribe directly while still
    // allowing correct paths like /ship.ShipService/Subscribe from generated clients.
    if (pathSegments && pathSegments.length === 1) {
      path = `/ship.ShipService/${pathSegments[0]}`;
    }

    const targetUrl = proxyBase.replace(/\/$/, '') + path + (req.url?.includes('?') ? req.url!.substring(req.url!.indexOf('?')) : '');

    // read raw body
    const chunks: Uint8Array[] = [];
    for await (const chunk of (req as any)) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    const body = Buffer.concat(chunks);

    // Copy headers but remove host (node-fetch will set it)
    const headers: Record<string, string> = {} as any;
    for (const [k, v] of Object.entries(req.headers)) {
      if (!v) continue;
      // skip host
      if (k.toLowerCase() === 'host') continue;
      // Some headers may be arrays
      headers[k] = Array.isArray(v) ? v.join(',') : String(v);
    }

    const fetchRes = await fetch(targetUrl, {
      method: req.method as string,
      headers,
      body: body.length > 0 ? body : undefined,
      // do not follow redirects automatically
      redirect: 'manual',
    });

    // copy status
    res.status(fetchRes.status);
    // copy headers
    fetchRes.headers.forEach((value, key) => {
      // skip controversial headers that Next/Node set automatically
      if (key.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(key, value);
    });

    // stream/payload
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    res.send(buf);
  } catch (err: any) {
    console.error('ship-grpc proxy error', err);
    res.status(500).json({ error: err?.message ?? String(err) });
  }
}
