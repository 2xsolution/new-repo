'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { FeeRoutingMode } from '@/shared/types';

export default function CreateForm() {
  const { publicKey } = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    imageUri: '',
    description: '',
    routingMode: FeeRoutingMode.LP,
    payoutWallet: '',
  });
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const checkAvailability = async () => {
    if (!formData.name || !formData.ticker) return;
    
    setChecking(true);
    try {
      const res = await fetch(`/api/identity/check?name=${formData.name}&ticker=${formData.ticker}`);
      const data = await res.json();
      setAvailable(data.available);
    } catch (error) {
      console.error('Check failed:', error);
    }
    setChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      alert('Please connect wallet');
      return;
    }

    if (available === false) {
      alert('This name + ticker combination is already taken!');
      return;
    }

    try {
      const res = await fetch('/api/tokens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creator: publicKey.toString(),
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        alert(`Token created! Mint: ${data.token.mint}`);
        window.location.href = `/token/${data.token.mint}`;
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Creation failed:', error);
      alert('Token creation failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-amber-900/20 to-yellow-900/20 rounded-lg border border-yellow-800/30">
      <h2 className="text-3xl font-bold mb-6 text-yellow-100">Launch Your Token 💩</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-yellow-200">Token Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={checkAvailability}
            className="w-full p-3 bg-amber-950/50 border border-yellow-700/50 rounded text-yellow-100 placeholder-yellow-600"
            placeholder="Doge Killer"
            required
          />
        </div>

        {/* Ticker */}
        <div>
          <label className="block text-sm font-medium mb-2 text-yellow-200">Ticker</label>
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
            onBlur={checkAvailability}
            maxLength={10}
            className="w-full p-3 bg-amber-950/50 border border-yellow-700/50 rounded text-yellow-100 placeholder-yellow-600"
            placeholder="DGKL"
            required
          />
          {checking && <p className="text-xs mt-1 text-yellow-400">Checking availability...</p>}
          {available === true && <p className="text-xs mt-1 text-green-400">✓ Available!</p>}
          {available === false && <p className="text-xs mt-1 text-red-400">✗ Already taken</p>}
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium mb-2 text-yellow-200">Image URL</label>
          <input
            type="url"
            value={formData.imageUri}
            onChange={(e) => setFormData({ ...formData, imageUri: e.target.value })}
            className="w-full p-3 bg-amber-950/50 border border-yellow-700/50 rounded text-yellow-100 placeholder-yellow-600"
            placeholder="https://..."
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2 text-yellow-200">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 bg-amber-950/50 border border-yellow-700/50 rounded text-yellow-100 placeholder-yellow-600"
            rows={3}
            placeholder="The next big thing..."
          />
        </div>

        {/* Fee Routing Mode */}
        <div>
          <label className="block text-sm font-medium mb-2 text-yellow-200">Creator Fee Routing</label>
          <select
            value={formData.routingMode}
            onChange={(e) => setFormData({ ...formData, routingMode: e.target.value as FeeRoutingMode })}
            className="w-full p-3 bg-amber-950/50 border border-yellow-700/50 rounded text-yellow-100"
          >
            <option value={FeeRoutingMode.LP}>Add to LP</option>
            <option value={FeeRoutingMode.BUYBACK_BURN}>Buyback & Burn</option>
            <option value={FeeRoutingMode.SEND_TO_WALLET}>Send to Wallet</option>
            <option value={FeeRoutingMode.VOLUME}>Volume Wallet</option>
            <option value={FeeRoutingMode.MARKET_MAKING}>Market Making</option>
            <option value={FeeRoutingMode.HOLDER_REWARDS}>Holder Rewards</option>
            <option value={FeeRoutingMode.STAKER_REWARDS}>Staker Rewards</option>
          </select>
        </div>

        {/* Payout Wallet (conditional) */}
        {formData.routingMode === FeeRoutingMode.SEND_TO_WALLET && (
          <div>
            <label className="block text-sm font-medium mb-2 text-yellow-200">Payout Wallet Address</label>
            <input
              type="text"
              value={formData.payoutWallet}
              onChange={(e) => setFormData({ ...formData, payoutWallet: e.target.value })}
              className="w-full p-3 bg-amber-950/50 border border-yellow-700/50 rounded text-yellow-100 placeholder-yellow-600"
              placeholder="Wallet address..."
              required
            />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={available === false || !publicKey}
          className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {!publicKey ? 'Connect Wallet First' : 'Launch Token 🚀'}
        </button>

        <p className="text-xs text-yellow-400 text-center mt-4">
          Bonding: 50 SOL cap • 47 SOL to LP • 2 SOL to creator • 1 SOL to platform
        </p>
      </form>
    </div>
  );
}