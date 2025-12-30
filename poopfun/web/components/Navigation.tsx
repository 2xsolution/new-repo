'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NAV_ITEMS } from '@/lib/constants';

export default function Navigation() {
  const { publicKey } = useWallet();

  return (
    <nav className="border-b border-yellow-800/30 bg-amber-900/20 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-yellow-100">
            💩 PoopFun.app
          </Link>

          <div className="hidden md:flex gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-yellow-300 hover:text-yellow-100 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <WalletMultiButton className="!bg-yellow-600 hover:!bg-yellow-500 !text-white !rounded-lg !px-4 !py-2 !font-semibold" />
        </div>
      </div>
    </nav>
  );
}