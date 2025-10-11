import { useEffect, useState } from "react";
import { AnalyticsService } from "../services/AnalyticsService";
import { normalizeQuery } from "../dtos/QueryDTO";
import { toTableDTO } from "../feeders/tableFeeder";

export function useAnalyticsQuery(inputQuery) {
  const [state, setState] = useState({ table: null, loading: false, error: null, meta: null });

  useEffect(() => {
    const q = normalizeQuery(inputQuery);
    if (!q.time) {
      setState({ table: null, loading: false, error: null, meta: null });
      return;
    }

    let cancelled = false;
    setState({ table: null, loading: true, error: null, meta: null });

    AnalyticsService.getOrdersForQuery(q)
      .then((res) => {
        if (cancelled) return;
        const table = toTableDTO(res.rows);
        setState({ table, loading: false, error: null, meta: { missing: res.missing } });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ table: null, loading: false, error: err, meta: null });
      });

    return () => { cancelled = true; };
  }, [JSON.stringify(inputQuery)]);

  return state;
}