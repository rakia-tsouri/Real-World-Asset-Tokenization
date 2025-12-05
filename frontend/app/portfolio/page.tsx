'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, transactionAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
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
      const [portfolioRes, transactionsRes] = await Promise.all([
        userAPI.getPortfolio(),
        transactionAPI.getAll()
      ]);
      setPortfolio(portfolioRes.data.data);
      setTransactions(transactionsRes.data.data);
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
          <p className="mt-4 text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Portfolio</h1>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(user.walletBalance)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Portfolio Value</p>
              <p className="text-3xl font-bold">{formatCurrency(portfolio?.totalValue || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Total Assets</p>
              <p className="text-3xl font-bold">{formatCurrency(portfolio?.totalAssets || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio?.portfolio?.length > 0 ? (
              <div className="space-y-4">
                {portfolio.portfolio.map((holding: any) => {
                  const totalValue = holding.quantity * holding.currentPrice;
                  const pl = totalValue - holding.totalInvested;
                  const plPercentage = (pl / holding.totalInvested) * 100;

                  return (
                    <div
                      key={holding.assetId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{holding.assetName}</h3>
                        <p className="text-sm text-gray-600">{holding.assetSymbol}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-medium">{formatNumber(holding.quantity)}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-gray-600">Avg Price</p>
                        <p className="font-medium">{formatCurrency(holding.averagePrice)}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="font-medium">{formatCurrency(totalValue)}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm text-gray-600">P&L</p>
                        <p className={`font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(pl)}
                        </p>
                        <p className={`text-sm ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {plPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No assets in your portfolio</p>
                <a href="/marketplace" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  Browse Marketplace
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'buy' ? (
                          <ArrowDownRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.assetSymbol}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatNumber(tx.quantity)} tokens
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(tx.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
