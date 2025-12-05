'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, MapPin, Calendar, Shield, Wallet, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push('/login');
    return null;
  }

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <Clock className="w-4 h-4" />
            Not Submitted
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">View and manage your account information</p>
        </div>

        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 mt-1">{user.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {user.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {user.country || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Type</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Verification Status */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Verification Status
              </h2>
              
              {/* Overall Status */}
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Verification</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </p>
                  </div>
                  <div>
                    {user.isVerified ? (
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>
                {!user.isVerified && (
                  <p className="text-sm text-gray-600 mt-3">
                    Complete KYC verification and connect your wallet to unlock all features
                  </p>
                )}
              </div>

              {/* KYC Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">KYC Verification</p>
                      <p className="text-sm text-gray-600">Identity verification status</p>
                    </div>
                  </div>
                  <div>
                    {getKycStatusBadge(user.kycStatus)}
                  </div>
                </div>

                {user.kycStatus === 'not_submitted' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      You haven't submitted your KYC documents yet. Complete verification to access all platform features.
                    </p>
                    <Link href="/dashboard">
                      <Button size="sm">Submit KYC Documents</Button>
                    </Link>
                  </div>
                )}

                {user.kycStatus === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Your KYC documents are under review. We'll notify you once the review is complete.
                    </p>
                  </div>
                )}

                {user.kycStatus === 'approved' && user.kycApprovedAt && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ✅ KYC approved on {new Date(user.kycApprovedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Wallet Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">HashPack Wallet</p>
                      <p className="text-sm text-gray-600">Hedera wallet connection</p>
                    </div>
                  </div>
                  <div>
                    {user.hashpackWalletConnected ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <XCircle className="w-4 h-4" />
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {user.hashpackWalletConnected && user.accountId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 mb-1">
                      <strong>Hedera Account ID:</strong>
                    </p>
                    <p className="font-mono text-sm text-green-900 bg-white px-3 py-2 rounded border border-green-300">
                      {user.accountId}
                    </p>
                  </div>
                )}

                {!user.hashpackWalletConnected && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      Connect your HashPack wallet to complete verification and start trading.
                    </p>
                    <Link href="/wallet-connect">
                      <Button size="sm">Connect Wallet</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full justify-start">
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="outline" className="w-full justify-start">
                    View Portfolio
                  </Button>
                </Link>
                <Link href="/notifications">
                  <Button variant="outline" className="w-full justify-start">
                    View Notifications
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
