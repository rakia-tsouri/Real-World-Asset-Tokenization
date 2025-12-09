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
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary glow-primary mx-auto"></div>
          <p className="mt-6 text-lg text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Wallet className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text">Connect Your Wallet</h1>
          <p className="text-foreground-muted mt-2">
            Connect your HashPack wallet to start trading assets
          </p>
        </div>

        {user.hashpackWalletConnected ? (
          <>
            <Card className="bg-success-muted border-success/30">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-success mb-2">Wallet Connected!</h2>
                <p className="text-success mb-2">
                  Your HashPack wallet is connected and ready to use.
                </p>
                {user.accountId && (
                  <p className="text-sm text-foreground-muted mb-4">
                    Account: {user.accountId}
                  </p>
                )}
                {user.isVerified ? (
                  <>
                    <p className="text-success mb-4">
                      Your account is fully verified. You can now buy and sell assets.
                    </p>
                    <Link href="/marketplace">
                      <Button className="bg-success hover:bg-success-hover">
                        Go to Marketplace
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-6 text-lg">
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
              <div className="mb-6 bg-warning-muted border border-warning/30 text-warning px-4 py-3 rounded">
                <p className="font-semibold">⚠️ KYC Required</p>
                <p className="text-sm mt-1">
                  You need to complete KYC verification before connecting your wallet.
                  <Link href="/kyc" className="text-primary hover:underline ml-1">
                    Submit KYC Documents →
                  </Link>
                </p>
              </div>
            )}
            
            <WalletConnection onSuccess={handleSuccess} />
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-primary hover:text-primary-hover">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
