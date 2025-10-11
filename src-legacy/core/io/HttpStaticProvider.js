export class HttpStaticProvider {
  async getText(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.text();
  }
  async getJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.json();
  }
  async exists(url) {
    // Prefer HEAD; fall back to GET (attempt range) for dev servers that don't support HEAD
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (r.ok) return true;
    } catch {}
    try {
      const r = await fetch(url, { method: 'GET', cache: 'no-store', headers: { 'Range': 'bytes=0-0' } });
      return r.ok;
    } catch {
      return false;
    }
  }
}
