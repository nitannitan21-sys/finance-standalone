export async function getUsdPhpRate() {
  const response = await fetch('https://open.er-api.com/v6/latest/USD', {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Rate service unavailable');
  }

  const data = await response.json();
  const rate = data?.rates?.PHP;

  if (!rate || typeof rate !== 'number') {
    throw new Error('PHP rate not found');
  }

  return {
    rate,
    source: 'open.er-api.com',
    updated_at: data.time_last_update_utc || new Date().toISOString(),
  };
}
