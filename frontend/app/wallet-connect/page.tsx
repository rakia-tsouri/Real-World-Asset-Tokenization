'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wallet, CheckCircle } from 'lucide-react';
import WalletConnection from '@/components/wallet/WalletConnection';

export default function WalletConnectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSuccess = () => {
    // Refresh the page to update user state
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Wallet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Connect Your Wallet</h1>
          <p className="text-gray-600 mt-2">
            Connect your HashPack wallet to start trading assets
          </p>
        </div>

        {user.hashpackWalletConnected ? (
          <>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">Wallet Connected!</h2>
                <p className="text-green-700 mb-2">
                  Your HashPack wallet is connected and ready to use.
                </p>
                {user.accountId && (
                  <p className="text-sm text-gray-600 mb-4">
                    Account: {user.accountId}
                  </p>
                )}
                {user.isVerified ? (
                  <>
                    <p className="text-green-700 mb-4">
                      Your account is fully verified. You can now buy and sell assets.
                    </p>
                    <Link href="/marketplace">
                      <Button className="bg-green-600 hover:bg-green-700">
                        Go to Marketplace
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
                    <p className="text-sm text-yellow-800">
                      {user.kycStatus !== 'approved' 
                        ? 'Complete KYC verification to start trading'
                        : 'You are now verified and ready to trade!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {user.kycStatus !== 'approved' && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <p className="font-semibold">⚠️ KYC Required</p>
                <p className="text-sm mt-1">
                  You need to complete KYC verification before connecting your wallet.
                  <Link href="/kyc" className="text-blue-600 hover:underline ml-1">
                    Submit KYC Documents →
                  </Link>
                </p>
              </div>
            )}
            
            <WalletConnection onSuccess={handleSuccess} />
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
