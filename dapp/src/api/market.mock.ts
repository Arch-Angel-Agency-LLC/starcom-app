// Local mock handler for /api/market for dev use

const mockMarketData = [
	{ id: 'btc', name: 'Bitcoin', price: 67000, volume: 12000 },
	{ id: 'eth', name: 'Ethereum', price: 3500, volume: 8000 },
	{ id: 'sol', name: 'Solana', price: 150, volume: 5000 },
];

// Returns mock market data (for dev/local use)
export function getMockMarketData() {
	return mockMarketData;
}

// AI-NOTE: This file is for local development only. All live market data should be fetched from on-chain or decentralized sources in production, per the serverless, on-chain policy in the updated artifacts.
