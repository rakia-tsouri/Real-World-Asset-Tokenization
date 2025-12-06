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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">My Portfolio</h1>
        <p className="text-foreground-muted text-lg mb-8">Track your real estate investments and returns</p>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card hover className="glass">
            <CardContent className="p-6">
              <p className="text-sm text-foreground-muted mb-2">Total Assets</p>
              <p className="text-4xl font-bold text-foreground">{portfolio?.stats?.totalAssets || 0}</p>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <p className="text-sm text-foreground-muted mb-2">Portfolio Value</p>
              <p className="text-4xl font-bold text-success">{formatCurrency(portfolio?.stats?.totalValue || 0)}</p>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <p className="text-sm text-foreground-muted mb-2">Listed Assets</p>
              <p className="text-4xl font-bold text-accent">{portfolio?.stats?.listedAssets || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <Card className="mb-8 glass">
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
                      className="flex items-center justify-between p-5 bg-surface rounded-xl border border-border hover:bg-surface-hover transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">{holding.assetName}</h3>
                        <p className="text-sm text-foreground-muted">{holding.assetSymbol}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-foreground-muted">Quantity</p>
                        <p className="font-medium text-foreground">{formatNumber(holding.quantity)}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-foreground-muted">Avg Price</p>
                        <p className="font-medium text-foreground">{formatCurrency(holding.averagePrice)}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-foreground-muted">Current Value</p>
                        <p className="font-medium text-foreground">{formatCurrency(totalValue)}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm text-foreground-muted">P&L</p>
                        <p className={`font-semibold ${pl >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(pl)}
                        </p>
                        <p className={`text-sm ${pl >= 0 ? 'text-success' : 'text-danger'}`}>
                          {plPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-foreground-subtle mx-auto mb-4 opacity-30" />
                <p className="text-foreground-muted mb-4">No assets in your portfolio</p>
                <a href="/marketplace" className="text-primary hover:text-primary-hover mt-2 inline-block font-medium">
                  Browse Marketplace
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-5 bg-surface rounded-xl border border-border hover:bg-surface-hover transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${
                        tx.type === 'buy' ? 'bg-success-muted border border-success/30' : 'bg-danger-muted border border-danger/30'
                      }`}>
                        {tx.type === 'buy' ? (
                          <ArrowDownRight className="w-5 h-5 text-success" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-danger" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.assetSymbol}
                        </p>
                        <p className="text-sm text-foreground-muted">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatNumber(tx.quantity)} tokens
                      </p>
                      <p className="text-sm text-foreground-muted">
                        {formatCurrency(tx.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground-muted">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
