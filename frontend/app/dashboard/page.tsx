'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, assetAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PriceChart } from '@/components/charts/PriceChart';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TrendingUp, Wallet, Package, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [portfolioRes, assetsRes] = await Promise.all([
        userAPI.getPortfolio(),
        assetAPI.getAll()
      ]);
      setPortfolio(portfolioRes.data.data);
      setAssets(assetsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Aggregate price history from all assets
  const aggregatePriceData = assets.length > 0
    ? assets[0].priceHistory.map((point: any, index: number) => {
        const avgPrice = assets.reduce((sum: number, asset: any) => 
          sum + asset.priceHistory[index].price, 0) / assets.length;
        return {
          date: point.date,
          price: avgPrice,
          volume: 0
        };
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Wallet Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(user.walletBalance)}</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalValue || 0)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalAssets || 0)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Holdings</p>
                  <p className="text-2xl font-bold">{portfolio?.portfolio?.length || 0}</p>
                </div>
                <Package className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Chart */}
        {aggregatePriceData.length > 0 && (
          <div className="mb-8">
            <PriceChart data={aggregatePriceData} title="Market Overview" />
          </div>
        )}

        {/* Portfolio Holdings */}
        <Card>
          <CardHeader>
            <CardTitle>Your Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio?.portfolio?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-medium text-gray-600">Asset</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Quantity</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Avg Price</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Current Price</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Total Value</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.portfolio.map((holding: any) => {
                      const totalValue = holding.quantity * holding.currentPrice;
                      const pl = totalValue - holding.totalInvested;
                      const plPercentage = (pl / holding.totalInvested) * 100;

                      return (
                        <tr key={holding.assetId} className="border-b">
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{holding.assetName}</p>
                              <p className="text-sm text-gray-500">{holding.assetSymbol}</p>
                            </div>
                          </td>
                          <td className="py-4">{formatNumber(holding.quantity)}</td>
                          <td className="py-4">{formatCurrency(holding.averagePrice)}</td>
                          <td className="py-4">{formatCurrency(holding.currentPrice)}</td>
                          <td className="py-4">{formatCurrency(totalValue)}</td>
                          <td className="py-4">
                            <span className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(pl)} ({plPercentage.toFixed(2)}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No assets in your portfolio yet</p>
                <a href="/marketplace" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  Browse Marketplace
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
