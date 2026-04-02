import { net } from 'electron';

export async function proxyTrade(
  league: string,
  query: object,
  cookie: string
): Promise<{ id?: string; error?: string }> {
  const encodedLeague = encodeURIComponent(league);
  const url = `https://poe.game.qq.com/api/trade/search/${encodedLeague}`;

  try {
    const response = await net.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: 'https://poe.game.qq.com',
        Referer: `https://poe.game.qq.com/trade/search/${encodedLeague}`,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(query),
    });

    const json = (await response.json()) as { id?: string; error?: string };
    if (json.id) {
      return { id: json.id };
    }
    return { error: json.error ?? `HTTP ${response.status}` };
  } catch (err) {
    return { error: String(err) };
  }
}
