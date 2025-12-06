'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { assetAPI, transactionAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PriceChart } from '@/components/charts/PriceChart';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AssetDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [transacting, setTransacting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (assetId) {
      fetchAsset();
    }
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      const response = await assetAPI.getById(assetId);
      setAsset(response.data.data);
    } catch (error) {
      console.error('Failed to fetch asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user || !asset) return;

    if (!user.isVerified) {
      setMessage({ 
        type: 'error', 
        text: user.kycStatus !== 'approved' 
          ? 'Please complete KYC verification to buy assets' 
          : 'Please connect your wallet to buy assets'
      });
      return;
    }

    if (!asset.hedera?.tokenized || !asset.hedera?.tokenId) {
      setMessage({ 
        type: 'error', 
        text: 'Asset is not tokenized on Hedera blockchain'
      });
      return;
    }

    if (quantity > (asset.tokenization?.availableTokens || 0)) {
      setMessage({ 
        type: 'error', 
        text: `Only ${asset.tokenization?.availableTokens || 0} tokens available`
      });
      return;
    }

    setMessage(null);
    setTransacting(true);

    try {
      await transactionAPI.buy({ 
        assetId: asset._id, 
        quantity, 
        pricePerToken: asset.tokenization?.pricePerToken || 0
      });
      setMessage({ type: 'success', text: `Successfully purchased ${quantity} tokens!` });
      
      setTimeout(() => {
        fetchAsset();
      }, 1500);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Transaction failed'
      });
    } finally {
      setTransacting(false);
    }
  };

  const handleSell = async () => {
    if (!user || !asset) return;

    if (!user.isVerified) {
      setMessage({ 
        type: 'error', 
        text: user.kycStatus !== 'approved' 
          ? 'Please complete KYC verification to sell assets' 
          : 'Please connect your wallet to sell assets'
      });
      return;
    }

    if (!asset.hedera?.tokenized || !asset.hedera?.tokenId) {
      setMessage({ 
        type: 'error', 
        text: 'Asset is not tokenized on Hedera blockchain'
      });
      return;
    }

    setMessage(null);
    setTransacting(true);

    try {
      await transactionAPI.sell({ 
        assetId: asset._id, 
        quantity, 
        pricePerToken: asset.tokenization?.pricePerToken || 0
      });
      setMessage({ type: 'success', text: `Successfully sold ${quantity} tokens!` });
      
      setTimeout(() => {
        fetchAsset();
      }, 1500);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Transaction failed'
      });
    } finally {
      setTransacting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading asset...</p>
        </div>
      </div>
    );
  }

  if (!user || !asset) return null;

  const pricePerToken = asset.tokenization?.pricePerToken || 0;
  const totalSupply = asset.tokenization?.totalSupply || 0;
  const availableTokens = asset.tokenization?.availableTokens || 0;
  const totalCost = quantity * pricePerToken;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/marketplace"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg" />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">{asset.name}</h1>
                      <p className="text-gray-600 text-lg">{asset.symbol}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {asset.assetType}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-6">{asset.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Price per Token</p>
                      <p className="text-xl font-bold">{formatCurrency(pricePerToken)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Supply</p>
                      <p className="text-xl font-bold">{formatNumber(totalSupply)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-xl font-bold">{formatNumber(availableTokens)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Market Cap</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(totalSupply * pricePerToken)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <PriceChart data={asset.priceHistory} title="Price History (30 Days)" />
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trade {asset.symbol}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {message && (
                  <div
                    className={`p-3 rounded ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Token</span>
                    <span className="font-medium">{formatCurrency(pricePerToken)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Cost</span>
                      <span className="font-bold text-lg">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleBuy}
                    disabled={transacting || !user.isVerified}
                    className="w-full"
                  >
                    {transacting ? 'Processing...' : `Buy ${quantity} Token${quantity > 1 ? 's' : ''}`}
                  </Button>

                  {!user.isVerified && (
                    <p className="text-sm text-amber-600">
                      {user.kycStatus !== 'approved' 
                        ? 'Complete KYC verification to buy' 
                        : 'Connect wallet to buy'}
                    </p>
                  )}

                  <Button
                    onClick={handleSell}
                    disabled={transacting || !user.isVerified}
                    variant="outline"
                    className="w-full"
                  >
                    {transacting ? 'Processing...' : `Sell ${quantity} Token${quantity > 1 ? 's' : ''}`}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Total Supply: {formatNumber(totalSupply)}</p>
                  <p>• Available: {formatNumber(availableTokens)}</p>
                  {asset.hedera?.tokenId && (
                    <p>• Token ID: {asset.hedera.tokenId}</p>
                  )}
                  <p>• Verification: {asset.verificationStatus}</p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {asset.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">{asset.location}</span>
                  </div>
                )}
                {asset.verified && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified</span>
                    <span className="text-green-600 font-medium">✓ Yes</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
