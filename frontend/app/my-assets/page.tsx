'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { assetAPI, auditAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuditReport } from '@/components/ui/AuditReport';
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
  ExternalLink,
  Shield
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
  const [auditData, setAuditData] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleAudit = async (tokenId: string) => {
    setAuditing(true);
    setMessage(null);
    try {
      const response = await auditAPI.auditToken(tokenId);
      setAuditData(response.data);
      setShowAuditReport(true);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to audit token. Make sure the audit service is running on port 5002.'
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setAuditing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-success-muted text-success rounded-full text-sm font-medium border border-success/30">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-warning-muted text-warning rounded-full text-sm font-medium border border-warning/30">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-danger-muted text-danger rounded-full text-sm font-medium border border-danger/30">
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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading your assets...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text">My Assets</h1>
          <p className="text-foreground-muted mt-2 text-lg">Manage and track your tokenized real-world assets</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card hover className="glass">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Total Assets</p>
                  <p className="text-4xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="bg-primary-muted p-3 rounded-xl border border-primary-border">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>
          </Card>

          <Card hover className="glass">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Pending Review</p>
                  <p className="text-4xl font-bold text-warning mt-1">{stats.pending}</p>
                </div>
                <div className="bg-warning-muted p-3 rounded-xl border border-warning/30">
                  <Clock className="w-7 h-7 text-warning" />
                </div>
              </div>
            </div>
          </Card>

          <Card hover className="glass">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Approved</p>
                  <p className="text-4xl font-bold text-success mt-1">{stats.approved}</p>
                </div>
                <div className="bg-success-muted p-3 rounded-xl border border-success/30">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
              </div>
            </div>
          </Card>

          <Card hover className="glass">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Tokenized</p>
                  <p className="text-4xl font-bold text-accent mt-1">{stats.tokenized}</p>
                </div>
                <div className="bg-accent-muted p-3 rounded-xl border border-accent/30">
                  <TrendingUp className="w-7 h-7 text-accent" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Filter:</span>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-surface-elevated text-foreground-muted border border-border hover:bg-surface-hover hover:text-foreground'
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
                      
                      {asset.hedera?.tokenized && asset.hedera?.tokenId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAudit(asset.hedera.tokenId!)}
                          disabled={auditing}
                          className="border-purple-600 text-purple-600 hover:bg-purple-50"
                        >
                          <Shield className={`w-4 h-4 mr-1 ${auditing ? 'animate-pulse' : ''}`} />
                          {auditing ? 'Auditing...' : 'Audit'}
                        </Button>
                      )}
                      
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

        {/* Audit Report Modal */}
        {showAuditReport && (
          <AuditReport
            data={auditData}
            onClose={() => setShowAuditReport(false)}
          />
        )}
      </div>
    </div>
  );
}
