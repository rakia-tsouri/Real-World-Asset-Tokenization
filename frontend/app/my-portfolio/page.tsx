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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading your assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">My Assets</h1>
            <p className="text-foreground-muted text-lg">Manage your Tunisian real estate portfolio</p>
          </div>
          <Button onClick={() => window.location.href = '/create-asset'} glow>
            Create New Asset
          </Button>
        </div>

        {/* Portfolio Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Total Assets</div>
              <div className="text-3xl font-bold text-foreground">{stats.totalAssets}</div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Total Value</div>
              <div className="text-3xl font-bold text-success">
                {stats.totalValue.toLocaleString()} TND
              </div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Listed</div>
              <div className="text-3xl font-bold text-accent">{stats.listedAssets}</div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Approved</div>
              <div className="text-3xl font-bold text-success">{stats.approvedAssets}</div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Pending</div>
              <div className="text-3xl font-bold text-warning">{stats.pendingAssets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Assets List */}
        {assets.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-3">No Assets Yet</h2>
              <p className="text-foreground-muted mb-6 text-lg">
                Start tokenizing your real estate properties to build your portfolio
              </p>
              <Button onClick={() => window.location.href = '/create-asset'} glow>
                Create Your First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset._id} hover className="glass">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{asset.title}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${
                        asset.verificationStatus === 'approved'
                          ? 'bg-success-muted text-success border-success/30'
                          : asset.verificationStatus === 'pending'
                          ? 'bg-warning-muted text-warning border-warning/30'
                          : asset.verificationStatus === 'rejected'
                          ? 'bg-danger-muted text-danger border-danger/30'
                          : 'bg-surface text-foreground-muted border-border'
                      }`}
                    >
                      {asset.verificationStatus}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-foreground-muted">
                      Category: <span className="font-medium text-foreground">{asset.category}</span>
                    </div>
                    <div className="text-sm text-foreground-muted">
                      Value:{' '}
                      <span className="font-medium text-success text-lg">
                        {(asset.listingPrice || asset.estimatedPrice || 0).toLocaleString()} TND
                      </span>
                    </div>
                    {asset.securityScore && (
                      <div className="text-sm text-foreground-muted">
                        Security Score:{' '}
                        <span className="font-medium text-foreground">{asset.securityScore}/100</span>
                      </div>
                    )}
                    {asset.isListed && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent-muted text-accent border border-accent/30 rounded-full font-medium">
                        🔵 Listed for Sale
                      </div>
                    )}
                    {asset.hedera.tokenized && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-muted text-primary border border-primary/30 rounded-full font-medium ml-2">
                        ⚡ Tokenized
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
