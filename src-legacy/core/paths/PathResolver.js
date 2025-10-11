const expand = (tpl, v) => tpl.replace(/\$\{(\w+)\}/g, (_, k) => v[k] ?? "");

export class PathResolver {
  constructor({ baseDir, monthFilePatterns }) {
    this.baseDir = baseDir;
    this.patterns = monthFilePatterns;
  }
  // keep your original signature
  candidates(yyyy, mm) {
    const vars = { yyyy, mm, baseDir: this.baseDir, base: this.baseDir };
    return this.patterns.map(p => expand(p, vars));
  }
}