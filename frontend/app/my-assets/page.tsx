'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { assetAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Building2, 
  Car, 
  Gem, 
  Building, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Eye,
  Edit,
  ExternalLink
} from 'lucide-react';

interface Asset {
  _id: string;
  title: string;
  description: string;
  category: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  tokenization?: {
    totalSupply: number;
    symbol: string;
    pricePerToken: number;
    reservedTokens: number;
    availableTokens: number;
  };
  hedera?: {
    tokenId?: string;
    tokenized?: boolean;
  };
  isListed: boolean;
  createdAt: string;
  verificationApprovedAt?: string;
  verificationRejectedAt?: string;
  verificationRejectionReason?: string;
}

export default function MyAssetsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMyAssets();
    }
  }, [user]);

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      const response = await assetAPI.getMyAssets();
      setAssets(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'real-estate':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'vehicle':
        return <Car className="w-5 h-5 text-green-600" />;
      case 'commodity':
        return <Gem className="w-5 h-5 text-yellow-600" />;
      case 'company':
        return <Building className="w-5 h-5 text-purple-600" />;
      default:
        return <Building2 className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (filter === 'all') return true;
    return asset.verificationStatus === filter;
  });

  const stats = {
    total: assets.length,
    pending: assets.filter(a => a.verificationStatus === 'pending').length,
    approved: assets.filter(a => a.verificationStatus === 'approved').length,
    tokenized: assets.filter(a => a.hedera?.tokenized).length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assets...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Assets</h1>
          <p className="text-gray-600 mt-2">Manage and track your tokenized real-world assets</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Assets</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tokenized</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{stats.tokenized}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Assets List */}
        {filteredAssets.length > 0 ? (
          <div className="space-y-4">
            {filteredAssets.map((asset) => (
              <Card key={asset._id}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Category Icon */}
                      <div className="bg-gray-100 p-3 rounded-lg">
                        {getCategoryIcon(asset.category)}
                      </div>

                      {/* Asset Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{asset.title}</h3>
                            <p className="text-sm text-gray-500 capitalize mt-1">
                              {asset.category.replace('-', ' ')}
                            </p>
                          </div>
                          {getStatusBadge(asset.verificationStatus)}
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">{asset.description}</p>

                        {/* Tokenization Info */}
                        {asset.tokenization && asset.tokenization.symbol && (
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-gray-600">Token Symbol</p>
                                <p className="text-sm font-bold text-gray-900">{asset.tokenization.symbol}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Total Supply</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {(asset.tokenization.totalSupply || 0).toLocaleString()} tokens
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Price Per Token</p>
                                <p className="text-sm font-bold text-gray-900">
                                  ${asset.tokenization.pricePerToken || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Available</p>
                                <p className="text-sm font-bold text-green-600">
                                  {(asset.tokenization.availableTokens || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {asset.hedera?.tokenized && asset.hedera?.tokenId && (
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium text-purple-700">Hedera Token ID:</span>
                                  <code className="text-xs bg-white px-2 py-1 rounded border border-purple-200 font-mono">
                                    {asset.hedera.tokenId}
                                  </code>
                                  <a
                                    href={`https://hashscan.io/testnet/token/${asset.hedera.tokenId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    View on HashScan <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {asset.verificationStatus === 'rejected' && asset.verificationRejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">{asset.verificationRejectionReason}</p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span>Created: {new Date(asset.createdAt).toLocaleDateString()}</span>
                          {asset.verificationApprovedAt && (
                            <span>Approved: {new Date(asset.verificationApprovedAt).toLocaleDateString()}</span>
                          )}
                          {asset.isListed && (
                            <span className="text-green-600 font-medium">● Listed on Marketplace</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/marketplace/${asset._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {asset.verificationStatus === 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/create-asset?resubmit=${asset._id}`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Resubmit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No assets yet' : `No ${filter} assets`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? "You haven't created any assets yet. Start tokenizing your real-world assets!"
                  : `You don't have any ${filter} assets at the moment.`}
              </p>
              {filter === 'all' && (
                <Button onClick={() => router.push('/create-asset')}>
                  Create Your First Asset
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
