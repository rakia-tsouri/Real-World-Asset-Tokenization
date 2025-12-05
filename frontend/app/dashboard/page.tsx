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
      not_submitted: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'KYC Not Submitted' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'KYC Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'KYC Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'KYC Rejected' },
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
          {getKYCStatusBadge()}
        </div>

        {/* Verification Status Card */}
        {!user.isVerified && (
          <Card className="mb-8 border-l-4 border-l-blue-600">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Complete Your Account Setup</h2>
              <p className="text-gray-600 mb-4">
                To start buying and selling assets, you need to complete KYC verification and connect your wallet.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* KYC Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {user.kycStatus === 'approved' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : user.kycStatus === 'pending' ? (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold">KYC Verification</h3>
                      <p className="text-sm text-gray-600">
                        {user.kycStatus === 'approved' ? 'Verified ✓' : 
                         user.kycStatus === 'pending' ? 'Under Review' :
                         user.kycStatus === 'rejected' ? 'Rejected - Resubmit' :
                         'Not Started'}
                      </p>
                    </div>
                  </div>
                  {user.kycStatus === 'not_submitted' || user.kycStatus === 'rejected' ? (
                    <Link href="/kyc">
                      <Button className="w-full">Submit KYC Documents</Button>
                    </Link>
                  ) : user.kycStatus === 'pending' ? (
                    <p className="text-sm text-gray-600">Your documents are being reviewed. This usually takes 24 hours.</p>
                  ) : null}
                </div>

                {/* Wallet Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {user.hashpackWalletConnected ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold">HashPack Wallet</h3>
                      <p className="text-sm text-gray-600">
                        {user.hashpackWalletConnected ? 'Connected ✓' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  {!user.hashpackWalletConnected && (
                    <Link href="/wallet-connect">
                      <Button className="w-full">Connect Wallet</Button>
                    </Link>
                  )}
                  {user.accountId && (
                    <p className="text-xs text-gray-500 mt-2">Account: {user.accountId}</p>
                  )}
                </div>
              </div>

              {user.kycStatus === 'approved' && user.hashpackWalletConnected && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎉 Your account is fully verified! You can now trade assets.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">My Assets</p>
                  <p className="text-2xl font-bold">{portfolio?.stats?.totalAssets || 0}</p>
                </div>
                <Package className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolio?.stats?.totalValue || 0)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Listed for Sale</p>
                  <p className="text-2xl font-bold">{portfolio?.stats?.listedAssets || 0}</p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/marketplace">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold">Browse Marketplace</h3>
                <p className="text-sm text-gray-600">Discover tokenized assets</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/create-asset">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold">Create Asset</h3>
                <p className="text-sm text-gray-600">Tokenize your assets</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/my-portfolio">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Wallet className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold">My Portfolio</h3>
                <p className="text-sm text-gray-600">Manage your assets</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Assets from Marketplace */}
        <Card>
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
                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <h4 className="font-semibold mb-2">{asset.title}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{asset.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(asset.listingPrice || asset.valuation)}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {asset.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No assets available yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
