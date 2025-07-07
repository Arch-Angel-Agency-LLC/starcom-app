// Fetches on-chain market data from the Starcom API
// Fetches market data (REST API)

export async function fetchMarketData() {
  const res = await fetch("/api/market");
  return await res.json();
}