import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Fetches the live USD -> PHP exchange rate from a free, no-key API (open.er-api.com).
// Falls back gracefully so the caller can use a manual rate when offline/unavailable.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return Response.json({ error: 'Rate service unavailable' }, { status: 502 });
    const data = await res.json();
    const rate = data?.rates?.PHP;
    if (!rate || typeof rate !== 'number') {
      return Response.json({ error: 'PHP rate not found' }, { status: 502 });
    }
    return Response.json({
      rate,
      source: 'open.er-api.com',
      updated_at: data.time_last_update_utc || new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}