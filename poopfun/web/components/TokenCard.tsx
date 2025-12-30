import Link from 'next/link';

interface TokenCardProps {
  token: {
    mint: string;
    name: string;
    ticker: string;
    image_uri: string;
    bonding_complete: number;
    total_sol_collected: number;
    market_cap: number;
  };
}

export default function TokenCard({ token }: TokenCardProps) {
  const progress = (token.total_sol_collected / 50) * 100;

  return (
    <Link href={`/token/${token.mint}`}>
      <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-yellow-700/30 rounded-lg p-4 hover:border-yellow-600/50 transition-all cursor-pointer group">
        {/* Image */}
        <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-amber-950/50">
          {token.image_uri ? (
            <img
              src={token.image_uri}
              alt={token.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              💩
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-yellow-100 group-hover:text-yellow-50 transition-colors">
                {token.name}
              </h3>
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

          {/* Progress or Market Cap */}
          {!token.bonding_complete ? (
            <div>
              <div className="flex justify-between text-xs text-yellow-300 mb-1">
                <span>{token.total_sol_collected.toFixed(1)} SOL</span>
                <span>50 SOL</span>
              </div>
              <div className="w-full bg-amber-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-600 to-amber-500 h-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-yellow-400">Market Cap</p>
              <p className="text-lg font-bold text-yellow-100">
                ${token.market_cap.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}