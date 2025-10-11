export class ManifestClient {
  constructor(provider, manifestUrl) {
    this.provider = provider;
    this.manifestUrl = manifestUrl;
    this.cache = null;
  }
  async get() {
    if (this.cache) return this.cache;
    this.cache = await this.provider.getJSON(this.manifestUrl);
    return this.cache;
  }
  async listMonths() {
    const m = await this.get();
    const out = [];
    if (m && m.years) {
      for (const yyyy of Object.keys(m.years).sort()) {
        for (const mm of m.years[yyyy]) out.push({ yyyy, mm });
      }
      return out;
    }
    if (m && Array.isArray(m.months)) {
      for (const rec of m.months) {
        if (rec && rec.month && typeof rec.month === 'string') {
          const [yyyy, mm] = rec.month.split('-');
          out.push({ yyyy, mm, path: rec.path });
        }
      }
      return out.sort((a,b)=> (a.yyyy+a.mm).localeCompare(b.yyyy+b.mm));
    }
    return out;
  }
}
