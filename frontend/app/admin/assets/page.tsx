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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Asset Verifications</h1>
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  Pending Reviews ({pendingAssets.length})
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {pendingAssets.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No pending asset verifications
                    </div>
                  ) : (
                    pendingAssets.map((asset) => (
                      <div
                        key={asset._id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedAsset?._id === asset._id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div className="font-medium">{asset.title}</div>
                        <div className="text-sm text-gray-600">{asset.category}</div>
                        <div className="text-sm text-gray-600">
                          Owner: {asset.ownerId.fullName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
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
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Asset Details</h2>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Title</label>
                      <div className="font-medium text-lg">{selectedAsset.title}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Description</label>
                      <div className="font-medium">{selectedAsset.description}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Category</label>
                      <div className="font-medium">{selectedAsset.category}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Estimated Price</label>
                      <div className="font-medium">${selectedAsset.estimatedPrice}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Owner Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <div className="font-medium">{selectedAsset.ownerId.fullName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <div className="font-medium">{selectedAsset.ownerId.email}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Hedera Account</label>
                        <div className="font-medium text-sm">{selectedAsset.ownerId.accountId}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">KYC Status</label>
                        <div className={`font-medium ${
                          selectedAsset.ownerId.kycStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {selectedAsset.ownerId.kycStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-2">
                      Verification Images ({selectedAsset.verificationImages.length})
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedAsset.verificationImages.map((img, idx) => (
                        <div key={idx} className="border rounded-lg p-2 bg-gray-50">
                          <img
                            src={`http://localhost:5000${img}`}
                            alt={`Verification ${idx + 1}`}
                            className="w-full h-auto rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedAsset.aiVerificationResult && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">AI Verification Result</h3>
                      <pre className="text-sm">
                        {JSON.stringify(selectedAsset.aiVerificationResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter reason for rejection..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleApprove(selectedAsset._id)}
                      disabled={processing}
                      className="flex-1"
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
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
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
