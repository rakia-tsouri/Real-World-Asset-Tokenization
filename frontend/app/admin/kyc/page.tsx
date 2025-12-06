'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface KYCRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    accountId?: string;
    kycStatus: string;
    isVerified: boolean;
    hashpackWalletConnected: boolean;
  };
  fullName: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  phoneNumber?: string;
  country?: string;
  documentType: 'cin' | 'passport';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  processedByAI: boolean;
  aiResult?: any;
  createdAt: string;
  updatedAt: string;
}

export default function AdminKYCReview() {
  const [pendingKYCs, setPendingKYCs] = useState<KYCRequest[]>([]);
  const [selectedKYC, setSelectedKYC] = useState<KYCRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingKYCs();
  }, []);

  const fetchPendingKYCs = async () => {
    try {
      const response = await adminAPI.getPendingKYCs();
      setPendingKYCs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch pending KYCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycId: string) => {
    if (!confirm('Are you sure you want to approve this KYC?')) return;
    
    setProcessing(true);
    let approvalSuccess = false;
    
    try {
      const response = await adminAPI.approveKYC(kycId);
      console.log('Approve response:', response);
      console.log('Response data:', response.data);
      
      if (response.data && response.data.success) {
        approvalSuccess = true;
        
        // Clear selection immediately
        setSelectedKYC(null);
        
        // Show success message
        alert('KYC approved successfully! The user has been notified.');
      } else {
        throw new Error(response.data?.message || 'Unexpected response format');
      }
    } catch (error: any) {
      console.error('Approve error:', error);
      console.error('Error response:', error.response);
      
      if (!approvalSuccess) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to approve KYC';
        alert(`Error: ${errorMessage}`);
      }
    }
    
    // Always refresh the list, even if there was an error
    try {
      await fetchPendingKYCs();
    } catch (refreshError) {
      console.error('Failed to refresh list:', refreshError);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (kycId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Are you sure you want to reject this KYC?')) return;
    
    setProcessing(true);
    let rejectionSuccess = false;
    
    try {
      const response = await adminAPI.rejectKYC(kycId, rejectionReason);
      console.log('Reject response:', response.data);
      
      if (response.data && response.data.success) {
        rejectionSuccess = true;
        
        // Clear selection and reason immediately
        setSelectedKYC(null);
        setRejectionReason('');
        
        // Show success message
        alert('KYC rejected successfully! The user has been notified.');
      } else {
        throw new Error(response.data?.message || 'Unexpected response format');
      }
    } catch (error: any) {
      console.error('Reject error:', error);
      
      if (!rejectionSuccess) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to reject KYC';
        alert(`Error: ${errorMessage}`);
      }
    }
    
    // Always refresh the list
    try {
      await fetchPendingKYCs();
    } catch (refreshError) {
      console.error('Failed to refresh list:', refreshError);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold gradient-text">KYC Verifications</h1>
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of pending KYCs */}
          <div className="lg:col-span-1">
            <Card className="glass">
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">
                  Pending Reviews ({pendingKYCs.length})
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {pendingKYCs.length === 0 ? (
                    <div className="p-6 text-center text-foreground-muted">
                      No pending KYC verifications
                    </div>
                  ) : (
                    pendingKYCs.map((kyc) => (
                      <div
                        key={kyc._id}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedKYC?._id === kyc._id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-surface-hover'
                        }`}
                        onClick={() => setSelectedKYC(kyc)}
                      >
                        <div className="font-medium text-foreground">{kyc.fullName || 'Name not provided'}</div>
                        <div className="text-sm text-foreground-muted">{kyc.userId.email}</div>
                        <div className="text-xs text-foreground-subtle mt-1">
                          Submitted: {new Date(kyc.createdAt).toLocaleDateString()}
                        </div>
                        {kyc.processedByAI && (
                          <div className="inline-flex items-center gap-1 text-xs text-success bg-success-muted px-2 py-0.5 rounded-full mt-1">
                            ✓ AI Processed
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KYC Details */}
          <div className="lg:col-span-2">
            {selectedKYC ? (
              <Card className="glass">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-foreground">KYC Details</h2>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* User Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-foreground-muted">Full Name</label>
                      <div className="font-medium text-foreground">{selectedKYC.fullName}</div>
                    </div>
                    <div>
                      <label className="text-sm text-foreground-muted">Email</label>
                      <div className="font-medium text-foreground">{selectedKYC.userId.email}</div>
                    </div>
                    <div>
                      <label className="text-sm text-foreground-muted">Date of Birth</label>
                      <div className="font-medium text-foreground">
                        {selectedKYC.dateOfBirth ? new Date(selectedKYC.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-foreground-muted">Phone Number</label>
                      <div className="font-medium text-foreground">{selectedKYC.phoneNumber || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-foreground-muted">Country</label>
                      <div className="font-medium text-foreground">{selectedKYC.country || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-foreground-muted">Hedera Account</label>
                      <div className="font-medium text-sm text-foreground">{selectedKYC.userId.accountId || 'Not linked'}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-foreground-muted">Address</label>
                      <div className="font-medium text-foreground">{selectedKYC.address || 'Not provided'}</div>
                    </div>
                  </div>

                  {/* User Status */}
                  <div className="bg-surface p-5 rounded-xl border border-border">
                    <h3 className="font-semibold mb-3 text-foreground">User Status</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-foreground-muted">KYC Status: <span className="font-medium text-foreground">{selectedKYC.userId.kycStatus}</span></div>
                      <div className="text-foreground-muted">Verified: <span className="font-medium text-foreground">{selectedKYC.userId.isVerified ? 'Yes' : 'No'}</span></div>
                      <div className="text-foreground-muted">Wallet Connected: <span className="font-medium text-foreground">{selectedKYC.userId.hashpackWalletConnected ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>

                  {/* Document */}
                  <div>
                    <label className="text-sm text-foreground-muted block mb-2">
                      Document Type: {selectedKYC.documentType === 'cin' ? 'National ID (CIN)' : 'Passport'}
                    </label>
                    <div className="border border-border rounded-xl p-4 bg-surface">
                      <div className="relative w-full" style={{ minHeight: '300px' }}>
                        <Image
                          src={`http://localhost:5000${selectedKYC.documentUrl}`}
                          alt="KYC Document"
                          width={800}
                          height={600}
                          className="max-w-full h-auto max-h-96 mx-auto object-contain rounded-lg"
                          unoptimized
                        />
                      </div>
                      <div className="text-xs text-foreground-subtle mt-3 space-y-1">
                        <p>Path: {selectedKYC.documentUrl}</p>
                        <a 
                          href={`http://localhost:5000${selectedKYC.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-hover block font-medium"
                        >
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* AI Result */}
                  {selectedKYC.processedByAI && selectedKYC.aiResult && (
                    <div className="bg-accent-muted border border-accent/30 rounded-xl p-5">
                      <h3 className="font-semibold mb-3 text-accent">AI Verification Result</h3>
                      <pre className="text-sm text-foreground bg-surface p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(selectedKYC.aiResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Rejection Reason Input */}
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

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleApprove(selectedKYC._id)}
                      disabled={processing}
                      className="flex-1"
                      glow
                    >
                      {processing ? 'Processing...' : 'Approve KYC'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReject(selectedKYC._id)}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? 'Processing...' : 'Reject KYC'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass">
                <CardContent className="p-12 text-center text-foreground-muted">
                  Select a KYC submission to review
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
