// Local mock handler for /api/market for dev use
import type { NextApiRequest, NextApiResponse } from 'next';

const mockMarketData = [
  { id: 'btc', name: 'Bitcoin', price: 67000, volume: 12000 },
  { id: 'eth', name: 'Ethereum', price: 3500, volume: 8000 },
  { id: 'sol', name: 'Solana', price: 150, volume: 5000 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(mockMarketData);
}
