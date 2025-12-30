'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserTokens = async () => {
      if (!publicKey) return;

      try {
        // This would be a new API endpoint to get tokens by creator
        const res = await fetch(`/api/tokens?creator=${publicKey.toString()}`);
        const data = await res.json();
        if (data.success) {
          setTokens(data.tokens);
        }
      } catch (error) {
        console.error('Failed to fetch user tokens:', error);
      }
      setLoading(false);
    };

    fetchUserTokens();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-yellow-100 mb-4">Connect Wallet</h1>
          <p className="text-yellow-300">Please connect your wallet to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950">
      {/* Header */}
      <header className="border-b border-yellow-800/30 bg-amber-900/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-yellow-100">Creator Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-yellow-400">Loading your tokens...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-yellow-100 mb-4">No tokens yet</h2>
            <p className="text-yellow-300 mb-6">Create your first token to get started!</p>
            <Link
              href="/create"
              className="inline-block bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-amber-500"
            >
              Launch Token 🚀
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokens.map((token: any) => (
                <div key={token.mint} className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-yellow-700/30 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-yellow-100">{token.name}</h3>
                      <p className="text-sm text-yellow-400">${token.ticker}</p>
                    </div>
                    {token.bonding_complete ? (
                      <span className="bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded border border-green-600/30">
                        Complete
                      </span>
                    ) : (
                      <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-600/30">
                        Bonding
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-400">SOL Collected:</span>
                      <span className="text-yellow-100">{token.total_sol_collected?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">Market Cap:</span>
                      <span className="text-yellow-100">
                        ${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/token/${token.mint}`}
                    className="mt-4 inline-block w-full text-center bg-yellow-600 text-white py-2 rounded font-semibold hover:bg-yellow-500 transition-colors"
                  >
                    View Token
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}