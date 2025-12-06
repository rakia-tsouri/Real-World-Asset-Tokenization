'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, assetAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriceChart } from '@/components/charts/PriceChart';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TrendingUp, Wallet, Package, DollarSign, CheckCircle, AlertCircle, Clock, Link as LinkIcon } from 'lucide-react';

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
        assetAPI.getAll({ listed: 'true' })
      ]);
      setPortfolio(portfolioRes.data.data);
      setAssets(assetsRes.data.data.slice(0, 5)); // Show top 5 for dashboard
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKYCStatusBadge = () => {
    if (!user) return null;
    
    const statusConfig = {
      not_submitted: { color: 'bg-surface-elevated text-foreground-subtle border border-border', icon: Clock, text: 'KYC Not Submitted' },
      pending: { color: 'bg-warning-muted text-warning border border-warning/30', icon: Clock, text: 'KYC Pending' },
      approved: { color: 'bg-success-muted text-success border border-success/30', icon: CheckCircle, text: 'KYC Approved' },
      rejected: { color: 'bg-danger-muted text-danger border border-danger/30', icon: AlertCircle, text: 'KYC Rejected' },
    };

    const config = statusConfig[user.kycStatus as keyof typeof statusConfig] || statusConfig.not_submitted;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Aggregate price history from all assets
  const aggregatePriceData = assets.length > 0 && assets[0]?.priceHistory
    ? assets[0].priceHistory.map((point: any, index: number) => {
        const avgPrice = assets.reduce((sum: number, asset: any) => 
          sum + (asset.priceHistory?.[index]?.price || 0), 0) / assets.length;
        return {
          date: point.date,
          price: avgPrice,
          volume: 0
        };
      })
    : [];

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Welcome, {user.name}!</h1>
            <p className="text-foreground-muted mt-2 text-lg">Your Tunisian Real Estate Portfolio</p>
          </div>
          {getKYCStatusBadge()}
        </div>

        {/* Verification Status Card */}
        {!user.isVerified && (
          <Card className="mb-8 border-l-4 border-l-primary glass">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Start Your Investment Journey</h2>
              <p className="text-foreground-muted mb-6">
                Complete these steps to start investing in Tunisian real estate with as little as 300 TND.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* KYC Status */}
                <div className="bg-surface p-5 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    {user.kycStatus === 'approved' ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : user.kycStatus === 'pending' ? (
                      <Clock className="w-6 h-6 text-warning" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-foreground-subtle" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">KYC Verification</h3>
                      <p className="text-sm text-foreground-muted">
                        {user.kycStatus === 'approved' ? 'Verified ✓' : 
                         user.kycStatus === 'pending' ? 'Under Review' :
                         user.kycStatus === 'rejected' ? 'Rejected - Resubmit' :
                         'Not Started'}
                      </p>
                    </div>
                  </div>
                  {user.kycStatus === 'not_submitted' || user.kycStatus === 'rejected' ? (
                    <Link href="/kyc">
                      <Button className="w-full" glow>Submit KYC Documents</Button>
                    </Link>
                  ) : user.kycStatus === 'pending' ? (
                    <p className="text-sm text-foreground-muted">Your documents are being reviewed. This usually takes 24 hours.</p>
                  ) : null}
                </div>

                {/* Wallet Status */}
                <div className="bg-surface p-5 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    {user.hashpackWalletConnected ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-foreground-subtle" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">HashPack Wallet</h3>
                      <p className="text-sm text-foreground-muted">
                        {user.hashpackWalletConnected ? 'Connected ✓' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  {!user.hashpackWalletConnected && (
                    <Link href="/wallet-connect">
                      <Button className="w-full" glow>Connect Wallet</Button>
                    </Link>
                  )}
                  {user.accountId && (
                    <p className="text-xs text-foreground-subtle mt-2">Account: {user.accountId}</p>
                  )}
                </div>
              </div>

              {user.kycStatus === 'approved' && user.hashpackWalletConnected && (
                <div className="mt-6 p-4 bg-success-muted border border-success/30 rounded-xl">
                  <p className="text-success font-medium">
                    🎉 Your account is fully verified! You can now trade assets.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">My Assets</p>
                  <p className="text-3xl font-bold text-foreground">{portfolio?.stats?.totalAssets || 0}</p>
                </div>
                <Package className="w-12 h-12 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Portfolio Value</p>
                  <p className="text-3xl font-bold text-success">{formatCurrency(portfolio?.stats?.totalValue || 0)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Listed for Sale</p>
                  <p className="text-3xl font-bold text-accent">{portfolio?.stats?.listedAssets || 0}</p>
                </div>
                <Wallet className="w-12 h-12 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/marketplace">
            <Card hover className="glass cursor-pointer">
              <CardContent className="p-6 text-center">
                <Package className="w-14 h-14 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-foreground">Browse Marketplace</h3>
                <p className="text-sm text-foreground-muted">Discover tokenized assets</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/create-asset">
            <Card hover className="glass cursor-pointer">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-14 h-14 text-success mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-foreground">Create Asset</h3>
                <p className="text-sm text-foreground-muted">Tokenize your assets</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/my-portfolio">
            <Card hover className="glass cursor-pointer">
              <CardContent className="p-6 text-center">
                <Wallet className="w-14 h-14 text-accent mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-foreground">My Portfolio</h3>
                <p className="text-sm text-foreground-muted">Manage your assets</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Assets from Marketplace */}
        <Card className="glass">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Featured Assets</CardTitle>
              <Link href="/marketplace">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {assets.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset: any) => (
                  <Link key={asset._id} href={`/marketplace/${asset._id}`}>
                    <div className="bg-surface border border-border rounded-xl p-5 hover:bg-surface-hover transition-all cursor-pointer card-hover">
                      <h4 className="font-semibold text-foreground mb-2">{asset.title}</h4>
                      <p className="text-sm text-foreground-muted mb-3 line-clamp-2">{asset.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(asset.listingPrice || asset.valuation)}
                        </span>
                        <span className="text-xs bg-primary-muted text-primary px-3 py-1 rounded-full border border-primary-border">
                          {asset.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-foreground-muted py-8">No assets available yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
