'use client';

import { useState, useEffect } from 'react';
import { assetAPI } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Asset {
  _id: string;
  title: string;
  description: string;
  category: string;
  verificationStatus: string;
  estimatedPrice: number;
  listingPrice: number;
  isListed: boolean;
  securityScore: number;
  hedera: {
    tokenId: string;
    tokenized: boolean;
  };
}

export default function MyPortfolio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    listedAssets: 0,
    approvedAssets: 0,
    pendingAssets: 0,
  });

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    try {
      const response = await assetAPI.getMyAssets();
      const assetData = response.data.data;
      setAssets(assetData);

      // Calculate stats
      const totalValue = assetData.reduce(
        (sum: number, asset: Asset) => sum + (asset.listingPrice || asset.estimatedPrice || 0),
        0
      );
      const listedCount = assetData.filter((a: Asset) => a.isListed).length;
      const approvedCount = assetData.filter((a: Asset) => a.verificationStatus === 'approved').length;
      const pendingCount = assetData.filter((a: Asset) => a.verificationStatus === 'pending').length;

      setStats({
        totalAssets: assetData.length,
        totalValue,
        listedAssets: listedCount,
        approvedAssets: approvedCount,
        pendingAssets: pendingCount,
      });
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleList = async (assetId: string) => {
    const price = prompt('Enter listing price (USD):');
    if (!price || isNaN(Number(price))) return;

    try {
      await assetAPI.list(assetId, Number(price));
      alert('Asset listed successfully!');
      fetchMyAssets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to list asset');
    }
  };

  const handleUnlist = async (assetId: string) => {
    if (!confirm('Are you sure you want to unlist this asset?')) return;

    try {
      await assetAPI.unlist(assetId);
      alert('Asset unlisted successfully!');
      fetchMyAssets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to unlist asset');
    }
  };

  const handleSecurityAnalysis = async (assetId: string) => {
    try {
      const response = await assetAPI.requestSecurityAnalysis(assetId);
      alert(`Security Score: ${response.data.data.securityScore}/100`);
      fetchMyAssets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to perform security analysis');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Portfolio</h1>
          <Button onClick={() => window.location.href = '/create-asset'}>
            Create New Asset
          </Button>
        </div>

        {/* Portfolio Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Assets</div>
              <div className="text-3xl font-bold">{stats.totalAssets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Value</div>
              <div className="text-3xl font-bold text-green-600">
                ${stats.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Listed</div>
              <div className="text-3xl font-bold text-blue-600">{stats.listedAssets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Approved</div>
              <div className="text-3xl font-bold text-green-600">{stats.approvedAssets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingAssets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Assets List */}
        {assets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2">No Assets Yet</h2>
              <p className="text-gray-600 mb-6">
                Start tokenizing your real-world assets to build your portfolio
              </p>
              <Button onClick={() => window.location.href = '/create-asset'}>
                Create Your First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{asset.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        asset.verificationStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : asset.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : asset.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {asset.verificationStatus}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      Category: <span className="font-medium">{asset.category}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Value:{' '}
                      <span className="font-medium text-green-600">
                        ${(asset.listingPrice || asset.estimatedPrice || 0).toLocaleString()}
                      </span>
                    </div>
                    {asset.securityScore && (
                      <div className="text-sm text-gray-600">
                        Security Score:{' '}
                        <span className="font-medium">{asset.securityScore}/100</span>
                      </div>
                    )}
                    {asset.isListed && (
                      <div className="text-xs text-blue-600 font-medium">
                        🔵 Listed for Sale
                      </div>
                    )}
                    {asset.hedera.tokenized && (
                      <div className="text-xs text-purple-600 font-medium">
                        ⚡ Tokenized on Hedera
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {asset.verificationStatus === 'approved' && !asset.isListed && (
                      <Button
                        onClick={() => handleList(asset._id)}
                        variant="primary"
                        size="sm"
                        className="w-full"
                      >
                        List for Sale
                      </Button>
                    )}

                    {asset.isListed && (
                      <Button
                        onClick={() => handleUnlist(asset._id)}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        Unlist
                      </Button>
                    )}

                    {asset.hedera.tokenized && !asset.securityScore && (
                      <Button
                        onClick={() => handleSecurityAnalysis(asset._id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Run Security Analysis
                      </Button>
                    )}

                    <Button
                      onClick={() => window.location.href = `/marketplace/${asset._id}`}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
