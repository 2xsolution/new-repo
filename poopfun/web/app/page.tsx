'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TokenCard from '@/components/TokenCard';

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch('/api/tokens?limit=50');
        const data = await res.json();
        if (data.success) {
          setTokens(data.tokens);
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      }
    };

    fetchTokens();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950">
      {/* Header */}
      <header className="border-b border-yellow-800/30 bg-amber-900/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-100">
            💩 PoopFun.app
          </h1>
          <Link
            href="/create"
            className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-amber-500 transition-all"
          >
            Launch Token
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'trending', 'new', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-yellow-600 text-white'
                  : 'bg-amber-900/30 text-yellow-300 hover:bg-amber-900/50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokens.map((token: any) => (
            <TokenCard key={token.mint} token={token} />
          ))}
        </div>

        {tokens.length === 0 && (
          <div className="text-center py-20 text-yellow-400">
            <p className="text-xl mb-4">No tokens yet</p>
            <Link
              href="/create"
              className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500"
            >
              Be the first to launch! 🚀
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}