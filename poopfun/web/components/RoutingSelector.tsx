'use client';

import { FeeRoutingMode } from '@/shared/types';

interface RoutingSelectorProps {
  value: FeeRoutingMode;
  onChange: (mode: FeeRoutingMode) => void;
}

export default function RoutingSelector({ value, onChange }: RoutingSelectorProps) {
  const options = [
    { value: FeeRoutingMode.LP, label: 'Add to LP', desc: 'Increase liquidity' },
    { value: FeeRoutingMode.BUYBACK_BURN, label: 'Buyback & Burn', desc: 'Reduce supply' },
    { value: FeeRoutingMode.SEND_TO_WALLET, label: 'Send to Wallet', desc: 'Direct payout' },
    { value: FeeRoutingMode.VOLUME, label: 'Volume Wallet', desc: 'Volume incentives' },
    { value: FeeRoutingMode.MARKET_MAKING, label: 'Market Making', desc: 'Liquidity incentives' },
    { value: FeeRoutingMode.HOLDER_REWARDS, label: 'Holder Rewards', desc: 'Reward token holders' },
    { value: FeeRoutingMode.STAKER_REWARDS, label: 'Staker Rewards', desc: 'Reward stakers only' },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-yellow-200">Fee Routing Mode</label>
      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
              value === option.value
                ? 'border-yellow-500 bg-yellow-900/20'
                : 'border-yellow-700/50 bg-amber-950/50 hover:bg-amber-950'
            }`}
          >
            <input
              type="radio"
              name="routingMode"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-yellow-100">{option.label}</div>
              <div className="text-xs text-yellow-400">{option.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}