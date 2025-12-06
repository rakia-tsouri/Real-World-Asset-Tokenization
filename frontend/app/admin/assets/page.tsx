'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Asset {
  _id: string;
  title: string;
  description: string;
  category: string;
  estimatedPrice: number;
  verificationImages: string[];
  verificationStatus: string;
  verificationSubmittedAt: string;
  aiVerificationResult: any;
  ownerId: {
    accountId: string;
    fullName: string;
    email: string;
    kycStatus: string;
  };
}

export default function AdminAssetReview() {
  const [pendingAssets, setPendingAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingAssets();
  }, []);

  const fetchPendingAssets = async () => {
    try {
      const response = await adminAPI.getPendingAssets();
      setPendingAssets(response.data.data);
    } catch (error) {
      console.error('Failed to fetch pending assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assetId: string) => {
    if (!confirm('Are you sure you want to approve this asset?')) return;
    
    setProcessing(true);
    try {
      await adminAPI.approveAsset(assetId);
      alert('Asset approved successfully');
      setSelectedAsset(null);
      fetchPendingAssets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve asset');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (assetId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Are you sure you want to reject this asset?')) return;
    
    setProcessing(true);
    try {
      await adminAPI.rejectAsset(assetId, rejectionReason);
      alert('Asset rejected successfully');
      setSelectedAsset(null);
      setRejectionReason('');
      fetchPendingAssets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject asset');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold gradient-text">Asset Verifications</h1>
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="glass">
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">
                  Pending Reviews ({pendingAssets.length})
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {pendingAssets.length === 0 ? (
                    <div className="p-6 text-center text-foreground-muted">
                      No pending asset verifications
                    </div>
                  ) : (
                    pendingAssets.map((asset) => (
                      <div
                        key={asset._id}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedAsset?._id === asset._id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-surface-hover'
                        }`}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div className="font-medium text-foreground">{asset.title}</div>
                        <div className="text-sm text-foreground-muted">{asset.category}</div>
                        <div className="text-sm text-foreground-muted">
                          Owner: {asset.ownerId.fullName}
                        </div>
                        <div className="text-xs text-foreground-subtle mt-1">
                          Submitted: {new Date(asset.verificationSubmittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedAsset ? (
              <Card className="glass">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-foreground">Asset Details</h2>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm text-foreground-muted">Title</label>
                      <div className="font-medium text-lg text-foreground">{selectedAsset.title}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-foreground-muted">Description</label>
                      <div className="font-medium text-foreground">{selectedAsset.description}</div>
                    </div>
                    <div>
                      <label className="text-sm text-foreground-muted">Category</label>
                      <div className="font-medium text-foreground">{selectedAsset.category}</div>
                    </div>
                    <div>
                      <label className="text-sm text-foreground-muted">Estimated Price</label>
                      <div className="font-medium text-success text-lg">{selectedAsset.estimatedPrice} TND</div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="font-semibold mb-3 text-foreground">Owner Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-foreground-muted">Name</label>
                        <div className="font-medium text-foreground">{selectedAsset.ownerId.fullName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-foreground-muted">Email</label>
                        <div className="font-medium text-foreground">{selectedAsset.ownerId.email}</div>
                      </div>
                      <div>
                        <label className="text-sm text-foreground-muted">Hedera Account</label>
                        <div className="font-medium text-sm text-foreground">{selectedAsset.ownerId.accountId}</div>
                      </div>
                      <div>
                        <label className="text-sm text-foreground-muted">KYC Status</label>
                        <div className={`font-medium ${
                          selectedAsset.ownerId.kycStatus === 'approved' ? 'text-success' : 'text-warning'
                        }`}>
                          {selectedAsset.ownerId.kycStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-foreground-muted block mb-3">
                      Verification Images ({selectedAsset.verificationImages.length})
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedAsset.verificationImages.map((img, idx) => (
                        <div key={idx} className="border border-border rounded-xl p-2 bg-surface">
                          <img
                            src={`http://localhost:5000${img}`}
                            alt={`Verification ${idx + 1}`}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedAsset.aiVerificationResult && (
                    <div className="bg-accent-muted border border-accent/30 rounded-xl p-5">
                      <h3 className="font-semibold mb-3 text-accent">AI Verification Result</h3>
                      <pre className="text-sm text-foreground bg-surface p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(selectedAsset.aiVerificationResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-3 border border-border bg-surface text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                      rows={3}
                      placeholder="Enter reason for rejection..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleApprove(selectedAsset._id)}
                      disabled={processing}
                      className="flex-1"
                      glow
                    >
                      {processing ? 'Processing...' : 'Approve Asset'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReject(selectedAsset._id)}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? 'Processing...' : 'Reject Asset'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass">
                <CardContent className="p-12 text-center text-foreground-muted">
                  Select an asset to review
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
