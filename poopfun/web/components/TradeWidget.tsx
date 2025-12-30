'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

interface TradeWidgetProps {
  mint: string;
  isComplete: boolean;
}

export default function TradeWidget({ mint, isComplete }: TradeWidgetProps) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrade = async () => {
    if (!publicKey || !signTransaction) {
      alert('Please connect wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Enter valid amount');
      return;
    }

    setLoading(true);
    try {
      const endpoint = tab === 'buy' ? '/api/trading/buy' : '/api/trading/sell';
      const payload = tab === 'buy'
        ? { mint, buyer: publicKey.toString(), solAmount: amount }
        : { mint, seller: publicKey.toString(), tokenAmount: amount };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        // Deserialize and sign transaction
        const txBuffer = Buffer.from(data.transaction, 'base64');
        const transaction = Transaction.from(txBuffer);
        const signed = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        await connection.confirmTransaction(signature);
        
        alert(`Trade successful! Signature: ${signature}`);
        setAmount('');
      } else {
        alert(`Trade failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed');
    }
    setLoading(false);
  };

  if (isComplete) {
    return (
      <div className="bg-amber-900/20 p-6 rounded-lg border border-yellow-700/30 text-center">
        <p className="text-yellow-200 mb-2">Bonding complete! Trade on permanent LP:</p>
        <a
          href={`https://app.meteora.ag/pools/${mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500"
        >
          Trade on Meteora →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 p-6 rounded-lg border border-yellow-700/30">
      <h3 className="text-xl font-bold mb-4 text-yellow-100">Trade 💰</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('buy')}
          className={`flex-1 py-2 rounded font-semibold transition-colors ${
            tab === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-amber-950/50 text-yellow-400 hover:bg-amber-950'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTab('sell')}
          className={`flex-1 py-2 rounded font-semibold transition-colors ${
            tab === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-amber-950/50 text-yellow-400 hover:bg-amber-950'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-yellow-200 mb-2">
            {tab === 'buy' ? 'SOL Amount' : 'Token Amount'}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            className="w-full p-3 bg-amber-950/50 border border-yellow-700/50 rounded text-yellow-100 text-lg"
          />
        </div>

        <button
          onClick={handleTrade}
          disabled={loading || !publicKey}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            tab === 'buy'
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-red-600 hover:bg-red-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Processing...' : tab === 'buy' ? '🚀 Buy' : '💸 Sell'}
        </button>

        <p className="text-xs text-yellow-400 text-center">
          Fee: 1% (0.9% platform, 0.1% creator)
        </p>
      </div>
    </div>
  );
}