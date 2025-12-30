'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BondingProgress from '@/components/BondingProgress';
import TradeWidget from '@/components/TradeWidget';

export default function TokenPage() {
  const { mint } = useParams();
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/tokens/${mint}`);
        const data = await res.json();
        if (data.success) {
          setToken(data);
        }
      } catch (error) {
        console.error('Failed to fetch token:', error);
      }
      setLoading(false);
    };

    if (mint) {
      fetchToken();
    }
  }, [mint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading token...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Token not found</div>
      </div>
    );
  }

  const { token: tokenData, bondingState } = token;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950">
      {/* Header */}
      <header className="border-b border-yellow-800/30 bg-amber-900/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-amber-950/50">
                {tokenData.image_uri ? (
                  <img src={tokenData.image_uri} alt={tokenData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">💩</div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-yellow-100">{tokenData.name}</h1>
                <p className="text-yellow-400">${tokenData.ticker}</p>
                <p className="text-yellow-300 text-sm">Created by: {tokenData.creator.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-yellow-200 text-sm">Mint</p>
              <p className="text-yellow-100 font-mono text-sm">{tokenData.mint}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Token Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {tokenData.description && (
              <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 p-6 rounded-lg border border-yellow-700/30">
                <h3 className="text-xl font-bold mb-4 text-yellow-100">About</h3>
                <p className="text-yellow-200">{tokenData.description}</p>
              </div>
            )}

            {/* Bonding Progress */}
            <BondingProgress mint={mint as string} />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-amber-950/50 p-4 rounded-lg text-center">
                <p className="text-yellow-400 text-sm">Market Cap</p>
                <p className="text-yellow-100 font-bold">
                  ${tokenData.market_cap ? tokenData.market_cap.toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="bg-amber-950/50 p-4 rounded-lg text-center">
                <p className="text-yellow-400 text-sm">SOL Collected</p>
                <p className="text-yellow-100 font-bold">{tokenData.total_sol_collected?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-amber-950/50 p-4 rounded-lg text-center">
                <p className="text-yellow-400 text-sm">Volume 24h</p>
                <p className="text-yellow-100 font-bold">
                  ${tokenData.volume_24h ? tokenData.volume_24h.toLocaleString() : '0'}
                </p>
              </div>
              <div className="bg-amber-950/50 p-4 rounded-lg text-center">
                <p className="text-yellow-400 text-sm">Created</p>
                <p className="text-yellow-100 font-bold">
                  {new Date(tokenData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Trading */}
          <div>
            <TradeWidget mint={mint as string} isComplete={tokenData.bonding_complete} />
          </div>
        </div>
      </main>
    </div>
  );
}