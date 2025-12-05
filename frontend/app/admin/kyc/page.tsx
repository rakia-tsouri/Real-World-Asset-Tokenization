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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">KYC Verifications</h1>
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of pending KYCs */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  Pending Reviews ({pendingKYCs.length})
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {pendingKYCs.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No pending KYC verifications
                    </div>
                  ) : (
                    pendingKYCs.map((kyc) => (
                      <div
                        key={kyc._id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedKYC?._id === kyc._id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedKYC(kyc)}
                      >
                        <div className="font-medium">{kyc.fullName || 'Name not provided'}</div>
                        <div className="text-sm text-gray-600">{kyc.userId.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(kyc.createdAt).toLocaleDateString()}
                        </div>
                        {kyc.processedByAI && (
                          <div className="text-xs text-green-600 mt-1">
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
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">KYC Details</h2>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* User Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-black">Full Name</label>
                      <div className="font-medium">{selectedKYC.fullName}</div>
                    </div>
                    <div>
                      <label className="text-sm text-black">Email</label>
                      <div className="font-medium">{selectedKYC.userId.email}</div>
                    </div>
                    <div>
                      <label className="text-sm text-black">Date of Birth</label>
                      <div className="font-medium">
                        {selectedKYC.dateOfBirth ? new Date(selectedKYC.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-black">Phone Number</label>
                      <div className="font-medium">{selectedKYC.phoneNumber || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-black">Country</label>
                      <div className="font-medium">{selectedKYC.country || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-black">Hedera Account</label>
                      <div className="font-medium text-sm">{selectedKYC.userId.accountId || 'Not linked'}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-black">Address</label>
                      <div className="font-medium">{selectedKYC.address || 'Not provided'}</div>
                    </div>
                  </div>

                  {/* User Status */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">User Status</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>KYC Status: <span className="font-medium">{selectedKYC.userId.kycStatus}</span></div>
                      <div>Verified: <span className="font-medium">{selectedKYC.userId.isVerified ? 'Yes' : 'No'}</span></div>
                      <div>Wallet Connected: <span className="font-medium">{selectedKYC.userId.hashpackWalletConnected ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>

                  {/* Document */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">
                      Document Type: {selectedKYC.documentType === 'cin' ? 'National ID (CIN)' : 'Passport'}
                    </label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="relative w-full" style={{ minHeight: '300px' }}>
                        <Image
                          src={`http://localhost:5000${selectedKYC.documentUrl}`}
                          alt="KYC Document"
                          width={800}
                          height={600}
                          className="max-w-full h-auto max-h-96 mx-auto object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <p>Path: {selectedKYC.documentUrl}</p>
                        <a 
                          href={`http://localhost:5000${selectedKYC.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block"
                        >
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* AI Result */}
                  {selectedKYC.processedByAI && selectedKYC.aiResult && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">AI Verification Result</h3>
                      <pre className="text-sm">
                        {JSON.stringify(selectedKYC.aiResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Rejection Reason Input */}
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

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleApprove(selectedKYC._id)}
                      disabled={processing}
                      className="flex-1"
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
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
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
