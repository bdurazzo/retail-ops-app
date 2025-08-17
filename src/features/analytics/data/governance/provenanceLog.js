// 📄 data/governance/dataScopes.js
// ROLE: Define allowed scopes and hard rules to prevent accidental mixing.

export const DATA_SCOPE = Object.freeze({
  FULL: "full",         // 2023-12 → present; variant-level fidelity guaranteed
  ARCHIVAL: "archival", // 2023-01 → 2023-11; style-level only (no variant guarantees)
  BOTH: "both",         // explicit, controlled blending (hybridMetrics.js only)
});

// Guardrail: throw if a metric tries to use ARCHIVAL for variant-required logic.
export function assertVariantAllowed(scope, hint = "") {
  if (scope !== DATA_SCOPE.FULL) {
    throw new Error(
      `[DataScope] Variant-level metric requires FULL scope. Got "${scope}". ${hint}`
    );
  }
}

// Guardrail: warn/throw if someone forgets to specify scope.
export function requireScope(scope) {
  if (!scope) {
    throw new Error(`[DataScope] Missing scope. Specify one of: ${Object.values(DATA_SCOPE).join(", ")}`);
  }
  return scope;
}