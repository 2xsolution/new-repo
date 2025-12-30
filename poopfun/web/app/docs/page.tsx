export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-yellow-950">
      {/* Header */}
      <header className="border-b border-yellow-800/30 bg-amber-900/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-yellow-100">Documentation</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-invert prose-yellow max-w-none">
          <h2>How PoopFun Works</h2>

          <h3>Bonding Curve</h3>
          <p>
            Each token starts with a bonding curve that accepts SOL until it reaches 50 SOL.
            The curve uses Meteora's DLMM (Dynamic Liquidity Market Maker) for efficient price discovery.
          </p>

          <h3>Token Distribution</h3>
          <ul>
            <li><strong>85% of supply</strong> goes to the bonding curve LP</li>
            <li><strong>15% remains</strong> outside the LP for future use</li>
          </ul>

          <h3>Fee Structure</h3>
          <p>During bonding phase:</p>
          <ul>
            <li><strong>1% total fee</strong> on all trades</li>
            <li><strong>0.9%</strong> goes to platform</li>
            <li><strong>0.1%</strong> goes to creator</li>
          </ul>

          <h3>LP Migration</h3>
          <p>
            When 50 SOL is collected, the bonding curve automatically migrates to a permanent LP:
          </p>
          <ul>
            <li><strong>47 SOL</strong> + <strong>85% tokens</strong> create the permanent pool</li>
            <li><strong>2 SOL</strong> payout to creator</li>
            <li><strong>1 SOL</strong> payout to platform</li>
          </ul>

          <h3>Creator Fee Routing</h3>
          <p>Creators can choose how their fees are handled:</p>
          <ul>
            <li><strong>LP</strong>: Add to liquidity pool</li>
            <li><strong>Buyback & Burn</strong>: Swap for tokens and burn</li>
            <li><strong>Send to Wallet</strong>: Direct transfer</li>
            <li><strong>Volume</strong>: Dedicated volume wallet</li>
            <li><strong>Market Making</strong>: MM wallet</li>
            <li><strong>Holder Rewards</strong>: Merkle distribution</li>
            <li><strong>Staker Rewards</strong>: Staker-only rewards</li>
          </ul>

          <h3>One-Launch-Only</h3>
          <p>
            Each name+ticker combination can only be launched once. This prevents duplicates
            and ensures fair competition.
          </p>
        </div>
      </main>
    </div>
  );
}