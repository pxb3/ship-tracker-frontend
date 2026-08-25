// Plain time helper functions (no React hooks) so they can be imported directly.

export function parseMetaTime(s?: string | number): Date | null {
    if (!s && s !== 0) return null;
    if (typeof s === 'number') {
        const n = s;
        const maybeMs = n > 1e12 ? n : (n < 1e11 ? n * 1000 : n * 1000);
        const dnum = new Date(maybeMs);
        if (isNaN(dnum.getTime())) return null;
        return dnum;
    }
    const str = String(s).trim();
    if (!str) return null;
    const isoTry = new Date(str);
    if (!isNaN(isoTry.getTime())) return isoTry;
    if (/^\d{10,}$/.test(str)) {
        const n = Number(str);
        const ms = str.length === 10 ? n * 1000 : n;
        const dnum = new Date(ms);
        if (!isNaN(dnum.getTime())) return dnum;
    }
    const m = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);
    if (m) {
        const date = m[1];
        const time = m[2];
        const micros = m[3] || '';
        const ms = micros ? micros.substring(0, 3).padEnd(3, '0') : '000';
        const iso = `${date}T${time}.${ms}Z`;
        const d = new Date(iso);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

export function timeAgo(d?: Date | null): string {
    if (!d) return 'unknown time';
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec} sec ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    const days = Math.floor(hr / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}