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
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, RefreshCw, ExternalLink } from 'lucide-react';
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string | React.ReactNode } | null>(null);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (assetId) {
      fetchAsset();
      fetchUserBalance();
    }
  }, [assetId]);

  useEffect(() => {
    if (asset?.tokenization?.pricePerToken) {
      setLimitPrice(asset.tokenization.pricePerToken);
    }
  }, [asset]);

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

  const fetchUserBalance = async () => {
    setUserTokenBalance(0);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchAsset(), fetchUserBalance()]);
    setRefreshing(false);
  };

  const handleTrade = async () => {
    if (!user || !asset) return;

    if (!user.isVerified) {
      setMessage({ 
        type: 'error', 
        text: user.kycStatus !== 'approved' 
          ? 'Please complete KYC verification to trade' 
          : 'Please connect your wallet to trade'
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

    if (tradeMode === 'buy') {
      if (quantity > (asset.tokenization?.availableTokens || 0)) {
        setMessage({ 
          type: 'error', 
          text: `Only ${asset.tokenization?.availableTokens || 0} tokens available`
        });
        return;
      }
    } else {
      // Check user balance for selling
      if (quantity > userTokenBalance) {
        setMessage({ 
          type: 'error', 
          text: `Insufficient balance. You have ${userTokenBalance} tokens`
        });
        return;
      }
    }

    setMessage(null);
    setTransacting(true);

    try {
      const pricePerToken = orderType === 'market' 
        ? asset.tokenization?.pricePerToken || 0 
        : limitPrice;

      // For now, using existing API calls
      if (tradeMode === 'buy') {
        await transactionAPI.buy({ 
          assetId: asset._id, 
          quantity, 
          pricePerToken
        });
        setMessage({ type: 'success', text: `Successfully purchased ${quantity} token${quantity > 1 ? 's' : ''}!` });
      } else {
        await transactionAPI.sell({ 
          assetId: asset._id, 
          quantity, 
          pricePerToken
        });
        setMessage({ type: 'success', text: `Successfully sold ${quantity} token${quantity > 1 ? 's' : ''}!` });
      }
      
      setTimeout(() => {
        refreshData();
      }, 1500);
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || 'Transaction failed';
      
      // Check if it's a token association error
      if (errorData?.tokenId) {
        errorMessage = (
          <div className="space-y-2">
            <p className="font-semibold">{errorData.message}</p>
            <p className="text-sm">Token ID: <code className="bg-white px-2 py-1 rounded">{errorData.tokenId}</code></p>
            <p className="text-sm">{errorData.instructions}</p>
            <a 
              href="https://www.hashpack.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 underline block"
            >
              Open HashPack Wallet →
            </a>
          </div>
        );
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
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
  const totalCost = quantity * (orderType === 'market' ? pricePerToken : limitPrice);
  const priceChange24h = 0; // TODO: Calculate from price history

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>

          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="inline-flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Chart and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{asset.name}</h1>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {asset.tokenization?.symbol || asset.symbol}
                      </span>
                    </div>
                    {asset.hedera?.tokenId && (
                      <a
                        href={`https://hashscan.io/testnet/token/${asset.hedera.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-blue-600 inline-flex items-center gap-1"
                      >
                        {asset.hedera.tokenId}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {asset.assetType}
                  </span>
                </div>

                {/* Price Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Price</p>
                      <p className="text-4xl font-bold">{formatCurrency(pricePerToken)}</p>
                    </div>
                    <div className={`flex items-center gap-1 mb-2 ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span className="font-semibold">{priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%</span>
                      <span className="text-xs text-gray-500">24h</span>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Supply</p>
                    <p className="text-lg font-bold">{formatNumber(totalSupply)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-lg font-bold text-green-600">{formatNumber(availableTokens)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Your Balance</p>
                    <p className="text-lg font-bold text-blue-600">{formatNumber(userTokenBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Market Cap</p>
                    <p className="text-lg font-bold">{formatCurrency(totalSupply * pricePerToken)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <PriceChart data={asset.priceHistory} title="Price History (30 Days)" />

            {/* Asset Description */}
            <Card>
              <CardHeader>
                <CardTitle>About {asset.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{asset.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {asset.location && (
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{asset.location}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Verified:</span>
                    <span className={`ml-2 font-medium ${asset.verified ? 'text-green-600' : 'text-gray-500'}`}>
                      {asset.verified ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{asset.verificationStatus}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Wallet Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Wallet Status</p>
                    <p className="font-semibold text-sm">
                      {user.isVerified ? 'Connected' : 'Not Connected'}
                    </p>
                  </div>
                  {user.accountId && (
                    <a
                      href={`https://hashscan.io/testnet/account/${user.accountId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trading Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Trade {asset.tokenization?.symbol || asset.symbol}</CardTitle>
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

                {/* Buy/Sell Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTradeMode('buy')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      tradeMode === 'buy'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeMode('sell')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      tradeMode === 'sell'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Order Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderType('market')}
                      className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        orderType === 'market'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      onClick={() => setOrderType('limit')}
                      className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        orderType === 'limit'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Limit
                    </button>
                  </div>
                </div>

                {/* Limit Price (only for limit orders) */}
                {orderType === 'limit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limit Price (USD)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full"
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Available: {tradeMode === 'buy' ? formatNumber(availableTokens) : formatNumber(userTokenBalance)}</span>
                    <button
                      onClick={() => setQuantity(tradeMode === 'buy' ? availableTokens : userTokenBalance)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price per Token</span>
                    <span className="font-medium">
                      {formatCurrency(orderType === 'market' ? pricePerToken : limitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-medium">{formatNumber(quantity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Type</span>
                    <span className="font-medium capitalize">{orderType}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className={`font-bold text-lg ${tradeMode === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trade Button */}
                <Button
                  onClick={handleTrade}
                  disabled={transacting || !user.isVerified || quantity <= 0}
                  className={`w-full py-3 ${
                    tradeMode === 'buy'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {transacting ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `${tradeMode === 'buy' ? 'Buy' : 'Sell'} ${quantity} Token${quantity > 1 ? 's' : ''}`
                  )}
                </Button>

                {!user.isVerified && (
                  <p className="text-sm text-amber-600 text-center">
                    {user.kycStatus !== 'approved' 
                      ? 'Complete KYC verification to trade' 
                      : 'Connect wallet to trade'}
                  </p>
                )}

                {/* Info Text */}
                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                  <p>• Trades execute on Hedera blockchain</p>
                  <p>• Transactions require HashPack wallet signature</p>
                  <p>• Network fees may apply</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
