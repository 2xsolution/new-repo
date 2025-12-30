'use client';

import { useEffect, useState } from 'react';

interface BondingProgressProps {
  mint: string;
}

export default function BondingProgress({ mint }: BondingProgressProps) {
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/tokens/${mint}/progress`);
        const data = await res.json();
        if (data.success) {
          setProgress(data);
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [mint]);

  if (!progress) {
    return <div className="text-yellow-400">Loading bonding progress...</div>;
  }

  return (
    <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 p-6 rounded-lg border border-yellow-700/30">
      <h3 className="text-xl font-bold mb-4 text-yellow-100">Bonding Progress 🔥</h3>
      
      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-yellow-200">{progress.currentSol.toFixed(2)} SOL</span>
            <span className="text-yellow-400">{progress.targetSol} SOL Target</span>
          </div>
          <div className="w-full bg-amber-950 rounded-full h-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-600 to-amber-500 h-full transition-all duration-500 flex items-center justify-center text-xs font-bold"
              style={{ width: `${Math.min(progress.progress, 100)}%` }}
            >
              {progress.progress.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Status */}
        {progress.isComplete ? (
          <div className="bg-green-900/20 border border-green-600/50 rounded p-3 text-center">
            <p className="text-green-400 font-bold">✅ Bonding Complete!</p>
            <p className="text-xs text-green-300 mt-1">Token migrated to permanent LP</p>
          </div>
        ) : (
          <div className="bg-blue-900/20 border border-blue-600/50 rounded p-3 text-center">
            <p className="text-blue-400 font-semibold">⚡ Bonding Phase Active</p>
            <p className="text-xs text-blue-300 mt-1">
              {(progress.targetSol - progress.currentSol).toFixed(2)} SOL remaining
            </p>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-amber-950/50 p-3 rounded">
            <p className="text-yellow-400 text-xs">To LP</p>
            <p className="text-yellow-100 font-bold">47 SOL</p>
          </div>
          <div className="bg-amber-950/50 p-3 rounded">
            <p className="text-yellow-400 text-xs">LP Tokens</p>
            <p className="text-yellow-100 font-bold">85%</p>
          </div>
          <div className="bg-amber-950/50 p-3 rounded">
            <p className="text-yellow-400 text-xs">Creator</p>
            <p className="text-yellow-100 font-bold">2 SOL</p>
          </div>
          <div className="bg-amber-950/50 p-3 rounded">
            <p className="text-yellow-400 text-xs">Platform</p>
            <p className="text-yellow-100 font-bold">1 SOL</p>
          </div>
        </div>
      </div>
    </div>
  );
}