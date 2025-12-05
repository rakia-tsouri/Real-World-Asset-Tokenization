'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, calculatePercentageChange } from '@/lib/utils';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  assetType: string;
  pricePerToken: number;
  availableSupply: number;
  totalSupply: number;
  image?: string;
  priceHistory: Array<{ price: number }>;
}

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const priceChange = asset.priceHistory.length > 1
    ? calculatePercentageChange(
        asset.priceHistory[asset.priceHistory.length - 1].price,
        asset.priceHistory[asset.priceHistory.length - 2].price
      )
    : 0;

  const isPositive = priceChange >= 0;

  return (
    <Link href={`/marketplace/${asset.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg" />
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{asset.name}</h3>
                <p className="text-sm text-gray-500">{asset.symbol}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {asset.assetType}
              </span>
            </div>
            
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(asset.pricePerToken)}</p>
                <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  <span>{Math.abs(priceChange).toFixed(2)}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-sm font-medium">{asset.availableSupply.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
